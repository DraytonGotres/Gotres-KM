const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createClient } = require('@supabase/supabase-js')
test('SDK Auth: cadastro aguarda confirmação, erros de login e envio de recuperação (servidor simulado)', async () => {
  const requests=[]
  const client=createClient('http://127.0.0.1:54321','test-public-key',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,flowType:'pkce'},
    global:{fetch:async(input,init)=>{
      const url=new URL(String(input));const body=JSON.parse(init.body||'{}');requests.push({path:url.pathname,body})
      if(url.pathname.endsWith('/signup'))return new Response(JSON.stringify({id:'11111111-1111-4111-8111-111111111111',email:body.email,identities:[],aud:'authenticated',created_at:new Date().toISOString()}),{status:200,headers:{'content-type':'application/json'}})
      if(url.pathname.endsWith('/token'))return new Response(JSON.stringify({code:'email_not_confirmed',msg:'Email not confirmed'}),{status:400,headers:{'content-type':'application/json','X-Supabase-Api-Version':'2024-01-01'}})
      return new Response('{}',{status:200,headers:{'content-type':'application/json'}})
    }}
  })
  const signup=await client.auth.signUp({email:'test@example.test',password:'Long-password-123!',options:{data:{name:'Teste'},emailRedirectTo:'http://localhost:3000/?auth=confirm'}})
  assert.equal(signup.error,null);assert.equal(signup.data.session,null)
  const login=await client.auth.signInWithPassword({email:'test@example.test',password:'Long-password-123!'})
  assert.equal(login.error.code,'email_not_confirmed')
  const recovery=await client.auth.resetPasswordForEmail('test@example.test',{redirectTo:'http://localhost:3000/?auth=reset'})
  assert.equal(recovery.error,null)
  assert(requests.some(r=>r.path.endsWith('/recover')))
})
