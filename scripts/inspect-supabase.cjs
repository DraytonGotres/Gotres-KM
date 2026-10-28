// Somente GET/HEAD, sem linhas de dados nem impressão de chaves.
const fs = require('node:fs')
const env = fs.readFileSync('.env.local', 'utf8')
function value(name) {
  const match = env.match(new RegExp('^\\s*' + name + '\\s*=\\s*(.+)\\s*$', 'm'))
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : ''
}
async function main() {
  const origin = new URL(value('NEXT_PUBLIC_SUPABASE_URL'))
  if (origin.hostname !== 'hxschbkcrycerialpndo.supabase.co' || origin.protocol !== 'https:') throw Error('Referência de projeto diferente da autorizada')
  const key = value('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!key) throw Error('Chave pública ausente')
  if (key.startsWith('sb_secret_')) throw Error('Chave administrativa recusada')
  if (!key.startsWith('sb_publishable_')) {
    const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))
    if (claims.role !== 'anon') throw Error('Apenas chave de papel anon autorizada')
  }
  console.log('Tipo de chave conferido: pública/anon; conteúdo omitido.')
  const headers = { apikey:key, Authorization:`Bearer ${key}` }
  const settings = await fetch(new URL('/auth/v1/settings',origin), {headers,signal:AbortSignal.timeout(15000)})
  console.log('Auth settings HTTP:',settings.status)
  if (settings.ok) {
    const data = await settings.json()
    console.log('Cadastro desabilitado:',data.disable_signup)
    console.log('Autoconfirmação de e-mail:',data.mailer_autoconfirm)
    console.log('Provedor e-mail habilitado:',data.external?.email)
  }
  for (const table of ['vehicles','refuelings','maintenances']) {
    const result = await fetch(new URL(`/rest/v1/${table}?select=id`,origin), {method:'HEAD',headers:{...headers,Prefer:'count=exact',Range:'0-0'},signal:AbortSignal.timeout(15000)})
    const total = result.headers.get('content-range')?.split('/')[1]
    console.log(JSON.stringify({table,http:result.status,anonVisibleRecords:total && total !== '*' ? Number(total) > 0 : 'não determinado'}))
  }
  console.log('Somente leitura verificada. INSERT/UPDATE/DELETE e políticas exigem metadados administrativos; não foram testados contra produção.')
}
main().catch(() => { console.error('Inspeção não concluída: conexão/configuração indisponível. Nenhuma credencial foi registrada.'); process.exitCode=1 })
