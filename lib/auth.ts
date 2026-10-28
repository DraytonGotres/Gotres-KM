export function authMessage(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case 'email_not_confirmed': return 'Confirme seu e-mail antes de entrar.'
    case 'invalid_credentials': return 'E-mail ou senha incorretos.'
    case 'over_email_send_rate_limit': case 'over_request_rate_limit': return 'Muitas tentativas. Aguarde alguns minutos.'
    case 'weak_password': return 'Use uma senha mais forte, com pelo menos 12 caracteres.'
    case 'session_not_found': case 'refresh_token_not_found': return 'Sessão expirada. Entre novamente.'
    default: return 'Não foi possível concluir. Confira a conexão ou solicite um novo link de acesso.'
  }
}

export function authRedirect(mode: 'confirm' | 'reset', origin: string): string {
  const url = new URL(origin)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Origem não segura')
  return `${url.origin}/?auth=${mode}`
}
