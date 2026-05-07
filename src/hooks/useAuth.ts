import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

type Result = { error?: string }

function mapAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already in use')) {
    return 'Este e-mail já está em uso. Tente entrar ou recuperar a senha.'
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  return 'Algo deu errado. Verifique sua conexão e tente novamente.'
}

export function useAuth() {
  async function signUp(email: string, password: string): Promise<Result> {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: mapAuthError(error.message) }
    return {}
  }

  async function signIn(email: string, password: string): Promise<Result> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: mapAuthError(error.message) }
    return {}
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    useAuthStore.getState().reset()
  }

  async function resetPassword(email: string): Promise<Result> {
    const options =
      typeof window !== 'undefined'
        ? { redirectTo: `${window.location.origin}/reset-password` }
        : {}
    const { error } = await supabase.auth.resetPasswordForEmail(email, options)
    if (error) return { error: mapAuthError(error.message) }
    return {}
  }

  return { signUp, signIn, signOut, resetPassword }
}
