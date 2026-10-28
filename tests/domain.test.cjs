const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file)
const { localDate, calendarSelection, ratio, numericLabel, historyIssues, historyIssueDetails, validateRefueling } = require('../lib/domain.ts')
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

test('alertas individuais identificam as três quebras reais sem sinalizar registros corretos', () => {
  const history = [
    { id: 'apr', date: '2025-04-25', km_previous: 83397, km_current: 83496, km_driven: 99 },
    { id: 'may', date: '2025-05-19', km_previous: 83560, km_current: 83595, km_driven: 35 },
    { id: 'jun6', date: '2025-06-06', km_previous: 83560, km_current: 83682, km_driven: 122 },
    { id: 'jun13', date: '2025-06-13', km_previous: 83496, km_current: 83560, km_driven: 64 },
    { id: 'jul', date: '2025-07-09', km_previous: 83560, km_current: 83749, km_driven: 189 },
  ].reverse()
  const before = JSON.stringify(history)
  const details = historyIssueDetails(history)
  assert.deepEqual([...details.keys()], ['may', 'jun6', 'jun13'])
  assert.match(details.get('may')[0], /83\.560 km.*25\/04\/2025.*83\.496 km.*64 km/)
  assert.match(details.get('jun6')[0], /83\.560 km.*19\/05\/2025.*83\.595 km.*35 km/)
  assert.match(details.get('jun13')[0], /83\.496 km.*06\/06\/2025.*83\.682 km.*186 km/)
  assert.equal(JSON.stringify(history), before)
})

test('detalhes cobrem distância divergente, hodômetro inválido e ordem do mesmo dia', () => {
  assert.equal(historyIssueDetails(rows).size, 0)
  const details = historyIssueDetails([{ ...rows[0], km_current: 90, km_driven: 5 }]).get('first')
  assert.equal(details.length, 2)
  assert.match(details[0], /sem avanço/)
  assert.match(details[1], /Distância divergente/)
  assert.match(historyIssueDetails([{ ...rows[0], km_previous: NaN }]).get('first')[0], /valor inválido/)
  assert.equal(historyIssueDetails(rows.map(row => ({ ...row, date: '2026-10-01' })).reverse()).size, 0)
})
test('mensagens Auth e URLs não dependem de credenciais', () => {
  assert.match(authMessage({ code: 'email_not_confirmed' }), /Confirme/)
  assert.match(authMessage({ code: 'invalid_credentials' }), /incorretos/)
  assert.match(authMessage({ code: 'session_not_found' }), /expirada/)
  assert.equal(authRedirect('reset', 'http://localhost:3000'), 'http://localhost:3000/?auth=reset')
  assert.equal(authRedirect('confirm', 'https://example.vercel.app'), 'https://example.vercel.app/?auth=confirm')
  assert.throws(() => authRedirect('reset', 'http://example.com'))
})
