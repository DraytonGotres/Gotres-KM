const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
test('worker não armazena HTML, Auth ou API; só atualiza após ação do usuário', async () => {
  const events = {}, entries = new Map(), stores = new Map([['gotres-km-v3',new Map()],['unrelated',new Map()]])
  let skip = 0, network = async () => new Response('new')
  const cache = { addAll: async urls => urls.forEach(url => entries.set(url, new Response('old'))), put: async (req,res) => entries.set(new URL(req.url).pathname,res) }
  const caches = { open: async name => { stores.set(name, entries); return cache }, keys: async () => Array.from(stores.keys()), delete: async name => stores.delete(name), match: async req => entries.get(new URL(req.url).pathname)?.clone() }
  vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'), { URL, caches, fetch: (...args) => network(...args), self: { location:{origin:'https://example.test'}, skipWaiting:() => skip++, clients:{claim:async()=>{}}, addEventListener:(type,fn)=>events[type]=fn } })
  let pending; events.install({waitUntil:p=>pending=p}); await pending
  assert.equal(skip,0)
  events.activate({waitUntil:p=>pending=p}); await pending
  assert(!stores.has('gotres-km-v3')); assert(stores.has('unrelated'))
  for(const url of ['https://example.test/','https://example.test/?auth=reset&code=secret','https://example.test/api/data','https://db.supabase.co/rest/v1/vehicles','https://db.supabase.co/auth/v1/token']) {
    let intercepted=false; events.fetch({request:new Request(url),respondWith:()=>intercepted=true}); assert.equal(intercepted,false)
  }
  const fetchLogo=async()=>{let response;events.fetch({request:new Request('https://example.test/logo.png'),respondWith:p=>response=p});return (await response).text()}
  assert.equal(await fetchLogo(),'new'); network=async()=>{throw Error('offline')};assert.equal(await fetchLogo(),'new')
  events.message({data:{type:'SKIP_WAITING'}});assert.equal(skip,1)
})
