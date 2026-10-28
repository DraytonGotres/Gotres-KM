const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const localModulePath = path.join(__dirname, '../.local-tools/node_modules/@electric-sql/pglite')
const modulePath = process.env.GOTRES_TEST_PGLITE_MODULE || (fs.existsSync(localModulePath) ? localModulePath : undefined)

// PostgreSQL real em memória; não usa URL, chaves ou dados da produção.
test('migração e isolamento PostgreSQL', { skip: !modulePath && 'Defina GOTRES_TEST_PGLITE_MODULE para um PGlite já instalado' }, async t => {
  const { PGlite } = require(modulePath)
  const db = new PGlite()
  const a = '11111111-1111-4111-8111-111111111111'
  const b = '22222222-2222-4222-8222-222222222222'
  const unconfirmed = '33333333-3333-4333-8333-333333333333'
  const legacy = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const bVehicle = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
      CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, email_confirmed_at timestamptz);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      INSERT INTO auth.users VALUES ('${a}',now()),('${b}',now()),('${unconfirmed}',NULL);`)
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase-setup.sql'), 'utf8'))
    await db.exec(`INSERT INTO vehicles(id,manufacturer,model,plate,color,year) VALUES ('${legacy}','Marca','Modelo','ABC1234','Azul',2020);
      INSERT INTO refuelings(vehicle_id,date,km_previous,km_current,km_driven,liters,price_per_liter,cost,fuel_type) VALUES ('${legacy}','2026-10-01',100,200,100,10,5,50,'Gasolina');`)
    const before = (await db.query('SELECT row_to_json(r) AS row FROM refuelings r')).rows
    await db.exec(`INSERT INTO maintenances(vehicle_id,date,type,description,cost,km_at_maintenance) VALUES ('${legacy}','2026-10-01','Revisão','Histórico legado',25,200)`)
    const maintenanceBefore = (await db.query('SELECT row_to_json(m) AS row FROM maintenances m')).rows
    const migration = fs.readFileSync(path.join(__dirname, '../database/migrations/001_multiuser.sql'), 'utf8')
    await t.test('migração exige backup e proprietário explícito', async () => {
      await assert.rejects(db.exec(migration), /Backup/)
      await db.exec('ROLLBACK')
      await db.exec("SELECT set_config('gotres.backup_verified','yes',false)")
      await assert.rejects(db.exec(migration), /UUID/)
      await db.exec('ROLLBACK')
    })
    await db.exec(`SELECT set_config('gotres.legacy_owner_id','${a}',false);`)
    await db.exec(migration)
    await t.test('histórico legado e IDs preservados, proprietário atribuído administrativamente', async () => {
      assert.deepEqual((await db.query('SELECT row_to_json(r) AS row FROM refuelings r')).rows, before)
      assert.deepEqual((await db.query('SELECT row_to_json(m) AS row FROM maintenances m')).rows, maintenanceBefore)
      assert.equal((await db.query('SELECT owner_id FROM vehicles')).rows[0].owner_id, a)
    })
    const asUser = async (id, sql) => {
      await db.exec('BEGIN; SET LOCAL ROLE authenticated;')
      try { await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [id]); const result = await db.query(sql); await db.exec('COMMIT'); return result }
      catch (error) { await db.exec('ROLLBACK'); throw error }
    }
    await t.test('usuário B cria e visualiza apenas seu veículo', async () => {
      await asUser(b, `INSERT INTO vehicles(id,manufacturer,model,plate,color,year) VALUES ('${bVehicle}','Marca','Modelo','ABC1234','Azul',2020)`)
      assert.equal((await asUser(b, 'SELECT * FROM vehicles')).rows.length, 1)
      assert.equal((await asUser(a, 'SELECT * FROM vehicles')).rows[0].id, legacy)
    })
    await t.test('A não consulta, altera nem exclui veículo B por SQL direto', async () => {
      assert.equal((await asUser(a, `SELECT * FROM vehicles WHERE id='${bVehicle}'`)).rows.length, 0)
      assert.equal((await asUser(a, `UPDATE vehicles SET model='Ataque' WHERE id='${bVehicle}' RETURNING id`)).rows.length, 0)
      assert.equal((await asUser(a, `DELETE FROM vehicles WHERE id='${bVehicle}' RETURNING id`)).rows.length, 0)
      await assert.rejects(asUser(a, `INSERT INTO vehicles(owner_id,manufacturer,model,plate,color,year) VALUES ('${b}','X','X','XYZ0000','X',2020)`), /row-level security/)
    })
    await t.test('B não acessa histórico A nem insere manutenção/abastecimento em veículo A', async () => {
      assert.equal((await asUser(b, 'SELECT * FROM refuelings')).rows.length, 0)
      assert.equal((await asUser(b, `UPDATE refuelings SET cost=0 RETURNING id`)).rows.length, 0)
      assert.equal((await asUser(b, `DELETE FROM refuelings RETURNING id`)).rows.length, 0)
      await assert.rejects(asUser(b, `INSERT INTO maintenances(vehicle_id,date,type,description,cost,km_at_maintenance) VALUES ('${legacy}','2026-10-02','Revisão','Teste',10,200)`), /row-level security/)
      await assert.rejects(asUser(b, `INSERT INTO refuelings(vehicle_id,date,km_previous,km_current,km_driven,liters,price_per_liter,cost,fuel_type) VALUES ('${legacy}','2026-10-02',200,300,100,10,5,50,'Gasolina')`), /row-level security/)
    })
    await t.test('proprietário imutável, e-mail não confirmado e anon sem acesso', async () => {
      await assert.rejects(asUser(a, `UPDATE vehicles SET owner_id='${b}' WHERE id='${legacy}'`), /imutáveis/)
      assert.equal((await asUser(unconfirmed, 'SELECT * FROM vehicles')).rows.length, 0)
      for (const sql of ['SELECT * FROM vehicles', 'SELECT * FROM refuelings', 'SELECT * FROM maintenances', "UPDATE vehicles SET model='X'", 'DELETE FROM vehicles', "INSERT INTO vehicles(manufacturer,model,plate,color,year) VALUES ('X','X','X','X',2020)"]) {
        await db.exec('BEGIN; SET LOCAL ROLE anon;')
        await assert.rejects(db.query(sql), /permission denied/)
        await db.exec('ROLLBACK')
      }
    })
    await t.test('inativação preserva histórico e exclusão física é bloqueada', async () => {
      await asUser(a, `UPDATE vehicles SET active=false WHERE id='${legacy}'`)
      assert.equal((await asUser(a, 'SELECT * FROM refuelings')).rows.length, 1)
      await assert.rejects(asUser(a, `DELETE FROM vehicles WHERE id='${legacy}'`), /Inative/)
      await assert.rejects(asUser(a, `INSERT INTO maintenances(vehicle_id,date,type,description,cost,km_at_maintenance) VALUES ('${legacy}','2026-10-02','Revisão','Teste',10,200)`), /row-level security/)
      await asUser(a, `UPDATE vehicles SET active=true WHERE id='${legacy}'`)
    })
    await t.test('sequência e valores são validados no banco e alterações auditadas', async () => {
      const insert = (previous, current, date='2026-10-02') => `INSERT INTO refuelings(vehicle_id,date,km_previous,km_current,km_driven,liters,price_per_liter,cost,fuel_type) VALUES ('${legacy}','${date}',${previous},${current},${current-previous},10,5,50,'Gasolina')`
      await assert.rejects(asUser(a, insert(150,300)), /precedente/)
      await asUser(a, insert(200,300))
      await assert.rejects(asUser(a, insert(200,250,'2026-10-01')), /posterior/)
      await assert.rejects(asUser(a, "UPDATE refuelings SET liters=0"), /inválidos/)
      await assert.rejects(asUser(a, "DELETE FROM refuelings WHERE date='2026-10-01'"), /sucessores/)
      await asUser(a, "UPDATE refuelings SET cost=51 WHERE date='2026-10-02'")
      const audit = await db.query("SELECT old_record->>'cost' AS old_cost, new_record->>'cost' AS new_cost FROM gotres_private.record_history WHERE table_name='refuelings'")
      assert.deepEqual(audit.rows, [{ old_cost:'50.00', new_cost:'51.00' }])
    })
  } finally { await db.close() }
})
