const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const vm = require('node:vm')
function load(mock) {
  const code=ts.transpileModule(fs.readFileSync('lib/data.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
  const exports={};vm.runInNewContext(code,{exports,require:()=>({supabase:mock})});return exports
}
test('paginação respeita teto menor configurado na API, sem perder registros',async()=>{
  const rows=Array.from({length:7},(_,id)=>({id}));const calls=[]
  const api=load({auth:{getUser:async()=>({data:{user:{id:'a',email_confirmed_at:'yes'}},error:null})},from:()=>{
    let offset=0;const query={select:()=>query,order:()=>query,range:start=>{offset=start;return query},eq:()=>query,then:resolve=>{calls.push(offset);return Promise.resolve({data:rows.slice(offset,offset+2),error:null}).then(resolve)}};return query
  }})
  const result=await api.readAll('vehicles');assert.equal(result.length,7);assert.deepEqual(calls,[0,2,4,6,7])
})
test('erro da consulta é propagado em vez de virar lista vazia',async()=>{
  const failure={code:'42501'}
  const api=load({auth:{getUser:async()=>({data:{user:{id:'a',email_confirmed_at:'yes'}}})},from:()=>{
    const query={select:()=>query,order:()=>query,range:()=>query,eq:()=>query,then:resolve=>Promise.resolve({data:null,error:failure}).then(resolve)};return query
  }})
  await assert.rejects(api.readAll('vehicles'),error=>error.code==='42501')
})
test('sem sessão confirmada nenhuma tabela é consultada',async()=>{
  let queried=false
  const api=load({auth:{getUser:async()=>({data:{user:{id:'a'}}})},from:()=>{queried=true}})
  await assert.rejects(api.readAll('vehicles'));assert.equal(queried,false)
})
