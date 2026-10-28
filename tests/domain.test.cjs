const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file)
const { localDate, calendarSelection, ratio, numericLabel, historyIssues, validateRefueling } = require('../lib/domain.ts')
const { authMessage, authRedirect } = require('../lib/auth.ts')
process.env.TZ = 'America/Fortaleza'

test('mês, ano e data local não mudam por UTC', () => {
  assert.equal(localDate(new Date('2026-10-28T01:30:00Z')), '2026-10-27')
  assert.equal(calendarSelection('2026-10').getMonth(), 9)
  assert.equal(calendarSelection('2026', true).getFullYear(), 2026)
  assert.equal(calendarSelection('2026-13'), null)
  assert.equal(calendarSelection(''), null)
})
test('indicadores rejeitam denominador zero e números inválidos', () => {
  assert.equal(ratio(100, 0), null)
  assert.equal(ratio(NaN, 10), null)
  assert.equal(ratio(-1, 10), null)
  assert.equal(ratio(100, 10), 10)
  assert.equal(numericLabel(null), 'Não calculável')
})
const rows = [
  { id: 'first', date: '2026-10-01', km_previous: 100, km_current: 200, km_driven: 100 },
  { id: 'last', date: '2026-10-10', km_previous: 200, km_current: 300, km_driven: 100 },
]
const base = { date: '2026-10-11', km_previous: 300, km_current: 400, liters: 10, price_per_liter: 5 }
test('sequência normal é aceita e lançamento retroativo conflitante é bloqueado', () => {
  assert.equal(validateRefueling(base, rows), null)
  assert.match(validateRefueling({ ...base, date: '2026-10-05', km_previous: 200, km_current: 250 }, rows), /próximo/)
  assert.match(validateRefueling({ ...base, km_previous: 250 }, rows), /precedente/)
  assert.match(validateRefueling({ ...base, liters: 0 }, rows), /litros/)
})
test('inserção retroativa preenche uma lacuna válida sem reescrever registros', () => {
  const gap = [rows[0], { ...rows[1], km_previous: 250, km_driven: 50 }]
  const before = JSON.stringify(gap)
  assert.equal(validateRefueling({ ...base, date: '2026-10-05', km_previous: 200, km_current: 250 }, gap), null)
  assert.equal(JSON.stringify(gap), before)
})
test('inconsistências antigas são sinalizadas sem mutação', () => {
  const invalid = [rows[0], { ...rows[1], km_previous: 250 }]
  const before = JSON.stringify(invalid)
  assert.deepEqual(historyIssues(invalid), ['last'])
  assert.equal(JSON.stringify(invalid), before)
})
test('mensagens Auth e URLs não dependem de credenciais', () => {
  assert.match(authMessage({ code: 'email_not_confirmed' }), /Confirme/)
  assert.match(authMessage({ code: 'invalid_credentials' }), /incorretos/)
  assert.match(authMessage({ code: 'session_not_found' }), /expirada/)
  assert.equal(authRedirect('reset', 'http://localhost:3000'), 'http://localhost:3000/?auth=reset')
  assert.equal(authRedirect('confirm', 'https://example.vercel.app'), 'https://example.vercel.app/?auth=confirm')
  assert.throws(() => authRedirect('reset', 'http://example.com'))
})
