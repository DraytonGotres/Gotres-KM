'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authMessage, authRedirect } from '@/lib/auth'

type Mode = 'login' | 'signup' | 'confirm' | 'forgot' | 'reset'

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    let revision = 0
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'reset') setMode('reset')
    if (params.get('error') || new URLSearchParams(window.location.hash.slice(1)).get('error')) {
      setMessage('Link inválido ou expirado. Solicite um novo e-mail.')
      setMode('forgot')
    }
    const validate = async () => {
      const current = ++revision
      const { data, error } = await supabase.auth.getUser()
      if (!live || current !== revision) return
      setUser(!error && data.user?.email_confirmed_at ? data.user : null)
      setChecking(false)
      if (error && params.get('code')) setMessage('Não foi possível validar o link. Solicite outro e abra-o no mesmo navegador em que iniciou a solicitação.')
      if (params.get('code') || params.get('error') || window.location.hash) {
        window.history.replaceState(null, '', params.get('auth') === 'reset' ? '/?auth=reset' : '/')
      }
    }
    void validate()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        ++revision
        setUser(null)
        setChecking(false)
        setMode('login')
        setPassword('')
        setMessage('Sessão encerrada. Entre novamente para acessar seus dados.')
      } else {
        if (event === 'PASSWORD_RECOVERY') setMode('reset')
        // Evita chamadas Auth dentro do callback síncrono do SDK.
        setTimeout(() => { if (live) void validate() }, 0)
      }
      if (!session && event === 'TOKEN_REFRESHED') setMessage('Sessão expirada. Entre novamente.')
    })
    const focus = () => { void validate() }
    window.addEventListener('focus', focus)
    return () => { live = false; subscription.unsubscribe(); window.removeEventListener('focus', focus) }
  }, [])

  const logout = async () => {
    if (!window.confirm('Encerrar sessão? Alterações ainda não salvas serão descartadas.')) return
    setBusy(true)
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) setMessage(authMessage(error))
    else { setUser(null); setMode('login') }
    setBusy(false)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if ((mode === 'signup' || mode === 'reset') && (password.length < 12 || password !== confirmation)) {
        setMessage('Use pelo menos 12 caracteres e confirme a mesma senha.'); return
      }
      if (mode === 'signup') {
        if (!name.trim()) { setMessage('Informe seu nome.'); return }
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password,
          options: { data: { name: name.trim() }, emailRedirectTo: authRedirect('confirm', window.location.origin) } })
        if (error) throw error
        // Fail closed caso a confirmação tenha sido desabilitada no Auth por engano.
        if (data.session) {
          await supabase.auth.signOut({ scope: 'local' })
          setMessage('Cadastro indisponível: a confirmação obrigatória de e-mail precisa ser habilitada pelo administrador.')
        } else {
          setMode('confirm'); setMessage('Confira seu e-mail para confirmar o cadastro. Abra o link no mesmo navegador em que iniciou o cadastro.')
        }
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        if (!data.user?.email_confirmed_at) { await supabase.auth.signOut({ scope: 'local' }); setMode('confirm'); setMessage('Confirme seu e-mail antes de entrar.') }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirect('reset', window.location.origin) })
        if (error) throw error
        setMessage('Se houver uma conta para este e-mail, você receberá um link. Abra-o neste mesmo navegador.')
      } else if (mode === 'confirm') {
        const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: authRedirect('confirm', window.location.origin) } })
        if (error) throw error
        setMessage('Se o cadastro estiver pendente, um novo e-mail será enviado.')
      } else if (mode === 'reset') {
        const { data, error: sessionError } = await supabase.auth.getUser()
        if (sessionError || !data.user) { setMessage('Link inválido ou expirado. Solicite uma nova recuperação.'); return }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        await supabase.auth.signOut({ scope: 'local' })
        window.history.replaceState(null, '', '/')
        setMode('login'); setMessage('Senha atualizada. Entre com sua nova senha.')
      }
      setPassword(''); setConfirmation('')
    } catch (error) { setMessage(authMessage(error as { code?: string })) }
    finally { setBusy(false) }
  }

  if (checking) return <main className="min-h-screen bg-slate-900 text-white grid place-items-center">Verificando sessão...</main>
  if (user && mode !== 'reset') return <>
    <div className="no-print bg-slate-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm break-all">{user.email}</span>
      <button className="px-4 py-2 rounded bg-slate-700" disabled={busy} onClick={logout}>Sair deste dispositivo</button>
      {message && <p role="status" className="w-full text-amber-200">{message}</p>}
    </div>
    <div key={user.id}>{children}</div>
  </>
  const titles: Record<Mode, string> = { login: 'Entrar', signup: 'Criar conta', confirm: 'Confirmar e-mail', forgot: 'Recuperar senha', reset: 'Redefinir senha' }
  return <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
    <section className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 p-6 sm:p-8">
      <img src="/logo.png" alt="GOTRES-KM" className="h-20 w-auto mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-center">{titles[mode]}</h1>
      <p className="text-blue-200 text-sm text-center mt-2 mb-6">Gestão de frota • Seus dados protegidos</p>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <label className="block">Nome<input required maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg p-3 bg-slate-700" /></label>}
        {mode !== 'reset' && <label className="block">E-mail<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg p-3 bg-slate-700" /></label>}
        {['login', 'signup', 'reset'].includes(mode) && <label className="block">Senha<input required type="password" minLength={mode === 'login' ? 1 : 12} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg p-3 bg-slate-700" /></label>}
        {['signup', 'reset'].includes(mode) && <label className="block">Confirmar senha<input required type="password" minLength={12} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="mt-1 w-full rounded-lg p-3 bg-slate-700" /></label>}
        {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-blue-500 py-3 font-semibold disabled:opacity-50">{busy ? 'Aguarde...' : mode === 'confirm' ? 'Reenviar confirmação' : titles[mode]}</button>
      </form>
      <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm text-blue-200">
        {(['login', 'signup', 'forgot', 'confirm'] as Mode[]).filter(item => item !== mode).map(item => <button key={item} disabled={busy} onClick={() => { setMode(item); setMessage(''); setPassword(''); setConfirmation('') }}>{titles[item]}</button>)}
      </div>
    </section>
  </main>
}
