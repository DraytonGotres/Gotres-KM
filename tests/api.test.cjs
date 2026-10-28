const { test } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const url = process.env.GOTRES_TEST_SUPABASE_URL
const publicKey = process.env.GOTRES_TEST_SUPABASE_ANON_KEY
const adminKey = process.env.GOTRES_TEST_SUPABASE_ADMIN_KEY

test('Supabase local: proprietário vê somente seu histórico restaurado', {
  skip: !(url && publicKey && process.env.GOTRES_TEST_OWNER_JWT) && 'Requer cópia restaurada e JWT assinado apenas para o ambiente isolado'
}, async () => {
  assert(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname))
  for (const [table, expected] of [['vehicles',2],['refuelings',89],['maintenances',13]]) {
    const response=await fetch(new URL(`/rest/v1/${table}?select=id`,url),{
      method:'HEAD',headers:{apikey:publicKey,Authorization:`Bearer ${process.env.GOTRES_TEST_OWNER_JWT}`,Prefer:'count=exact'}
    })
    assert(response.ok, `Histórico ${table}: HTTP ${response.status}`)
    assert.equal(Number(response.headers.get('content-range')?.split('/')[1]),expected)
  }
})

test('Supabase local: Auth e isolamento por chamadas REST diretas', {
  skip: !(url && publicKey && adminKey) && 'Requer instância Supabase local descartável com migração e Confirm email habilitados'
}, async () => {
  const parsed = new URL(url)
  assert(['localhost','127.0.0.1','[::1]'].includes(parsed.hostname), 'Este teste recusa qualquer host não local')
  const request = async (path, method='GET', body, jwt, key=publicKey) => {
    const response = await fetch(new URL(path,url), {method,headers:{apikey:key,Authorization:`Bearer ${jwt || key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)})
    const text=await response.text(); let data;try{data=JSON.parse(text)}catch{data=text}
    return {status:response.status,ok:response.ok,data}
  }
  const suffix=randomUUID(), password=`Test-${randomUUID()}-Aa1!`
  async function account(label,confirmed=true) {
    const email=`gotres-${label}-${suffix}@example.test`
    const created=await request('/auth/v1/admin/users','POST',{email,password,email_confirm:confirmed},adminKey,adminKey)
    assert(created.ok,`Falha ao criar fixture ${label}: HTTP ${created.status}`)
    const login=await request('/auth/v1/token?grant_type=password','POST',{email,password})
    return {id:created.data.id,email,login,jwt:login.data.access_token}
  }
  const a=await account('a'),b=await account('b'),u=await account('unconfirmed',false)
  assert(a.jwt&&b.jwt);assert.equal(u.login.ok,false)
  const wrong=await request('/auth/v1/token?grant_type=password','POST',{email:a.email,password:'incorrect-password'})
  assert.equal(wrong.ok,false)
  const expired=await request('/auth/v1/user','GET',undefined,'invalid-token')
  assert.equal(expired.ok,false)
  const vehicle=async user=>{
    const result=await request('/rest/v1/vehicles','POST',{owner_id:user.id,manufacturer:'Teste',model:'Fixture',plate:randomUUID().slice(0,7).toUpperCase(),color:'Azul',year:2020},user.jwt)
    assert(result.ok,`Cadastro veículo: HTTP ${result.status}`);return result.data[0]
  }
  const av=await vehicle(a),bv=await vehicle(b)
  const ar=await request('/rest/v1/refuelings','POST',{vehicle_id:av.id,date:'2026-10-01',km_previous:100,km_current:200,km_driven:100,liters:10,price_per_liter:5,cost:50,fuel_type:'Gasolina'},a.jwt)
  const am=await request('/rest/v1/maintenances','POST',{vehicle_id:av.id,date:'2026-10-01',type:'Revisão',description:'Fixture',cost:10,km_at_maintenance:200},a.jwt)
  assert(ar.ok&&am.ok)
  for(const [table,id,patch] of [['vehicles',av.id,{model:'Attack'}],['refuelings',ar.data[0].id,{cost:1}],['maintenances',am.data[0].id,{cost:1}]]) {
    for(const method of ['GET','PATCH','DELETE']) {
      const result=await request(`/rest/v1/${table}?id=eq.${id}`,method,method==='PATCH'?patch:undefined,b.jwt)
      assert(result.ok);assert.deepEqual(result.data,[])
    }
    for(const method of ['GET','POST','PATCH','DELETE']) {
      const anon=await request(`/rest/v1/${table}?id=eq.${id}`,method,method==='PATCH'||method==='POST'?patch:undefined)
      assert.equal(anon.ok,false,`anon ${method} ${table}`)
    }
  }
  const swapped=await request(`/rest/v1/vehicles?id=eq.${av.id}`,'PATCH',{owner_id:b.id},a.jwt);assert.equal(swapped.ok,false)
  const linked=await request(`/rest/v1/refuelings?id=eq.${ar.data[0].id}`,'PATCH',{vehicle_id:bv.id},a.jwt);assert.equal(linked.ok,false)
  const signup=await request('/auth/v1/signup','POST',{email:`signup-${suffix}@example.test`,password,data:{name:'Teste'}})
  assert(signup.ok);assert.equal(Boolean(signup.data.access_token),false,'Confirm email deve impedir sessão imediata')
  const logout=await request('/auth/v1/logout?scope=local','POST',undefined,a.jwt);assert(logout.ok)
  // Fixtures mantidas na instância descartável. Nunca excluir dados/usuários de produção.
})

test('Supabase local: confirmação por e-mail e recuperação de senha com PKCE', {
  skip: !(url && publicKey && process.env.GOTRES_TEST_MAILBOX_URL) && 'Requer captura SMTP no Supabase local descartável'
}, async () => {
  const { createHash, randomBytes } = require('node:crypto')
  const mailbox = new URL(process.env.GOTRES_TEST_MAILBOX_URL)
  for (const target of [new URL(url), mailbox]) {
    assert(['localhost','127.0.0.1','[::1]'].includes(target.hostname), 'Teste restrito ao ambiente local')
  }
  const email = `pkce-${randomUUID()}@example.test`
  const password = `Original-${randomUUID()}-Aa1!`
  const nextPassword = `Changed-${randomUUID()}-Bb2!`
  const request = async (path, body, jwt, method='POST') => {
    const response = await fetch(new URL(path,url), {method, headers: {apikey:publicKey, Authorization:`Bearer ${jwt || publicKey}`, 'Content-Type':'application/json'}, body:JSON.stringify(body)})
    const data = await response.json()
    assert(response.ok, `Auth ${path}: HTTP ${response.status}`)
    return data
  }
  const pkce = () => {
    const verifier=randomBytes(48).toString('base64url')
    return {verifier, code_challenge:createHash('sha256').update(verifier).digest('base64url'), code_challenge_method:'s256'}
  }
  const followMail = async (type, verifier) => {
    let link
    for (let attempt=0; attempt<30; attempt++) {
      const response=await fetch(mailbox)
      const messages=await response.json()
      const matches=messages.filter(m=>m.to.includes(email))
      for (const message of matches.reverse()) {
        const links=message.body.match(/https?:\/\/[^\s"<>]+/g) || []
        link=links.map(raw=>new URL(raw.replaceAll('&amp;','&'))).find(u=>u.pathname==='/auth/v1/verify' && u.searchParams.get('type')===type)
        if (link) break
      }
      if (link) break
      await new Promise(resolve=>setTimeout(resolve,100))
    }
    assert(link, `E-mail ${type} não recebido no SMTP isolado`)
    assert.equal(link.origin, new URL(url).origin)
    const confirmed=await fetch(link,{redirect:'manual'})
    assert.equal(confirmed.status,303)
    const redirect=new URL(confirmed.headers.get('location'))
    assert.equal(redirect.origin,'http://localhost:3000')
    const code=redirect.searchParams.get('code')
    assert(code, 'Redirecionamento PKCE deve conter código de uso único')
    const session=await request('/auth/v1/token?grant_type=pkce',{auth_code:code,code_verifier:verifier})
    assert(session.access_token)
    return session
  }
  const signup=pkce()
  const registered=await request('/auth/v1/signup?redirect_to=http%3A%2F%2Flocalhost%3A3000%2F%3Fauth%3Dconfirm',{
    email,password,code_challenge:signup.code_challenge,code_challenge_method:signup.code_challenge_method
  })
  assert.equal(Boolean(registered.access_token),false)
  const session=await followMail('signup',signup.verifier)
  assert(session.user.email_confirmed_at)
  await request('/auth/v1/token?grant_type=password',{email,password})
  const recovery=pkce()
  await request('/auth/v1/recover?redirect_to=http%3A%2F%2Flocalhost%3A3000%2F%3Fauth%3Dreset',{
    email,code_challenge:recovery.code_challenge,code_challenge_method:recovery.code_challenge_method
  })
  const recovered=await followMail('recovery',recovery.verifier)
  await request('/auth/v1/user',{password:nextPassword},recovered.access_token,'PUT')
  const old=await fetch(new URL('/auth/v1/token?grant_type=password',url),{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})})
  assert.equal(old.ok,false)
  await request('/auth/v1/token?grant_type=password',{email,password:nextPassword})
})
