import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false },
  },
})

// Apply default theme class on <html>
document.documentElement.classList.add('theme-light')

// Single auth listener registered once at module load
void (async () => {
  const { data } = await supabase.auth.getSession()
  const initialUser = data.session?.user ?? null
  useAuthStore.getState().setUser(initialUser)

  if (initialUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', initialUser.id)
      .maybeSingle()
    useAuthStore.getState().setProfile(profile ?? null)
  }
  useAuthStore.getState().setLoading(false)

  supabase.auth.onAuthStateChange(async (_event, session) => {
    const u = session?.user ?? null
    useAuthStore.getState().setUser(u)
    if (u) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle()
      useAuthStore.getState().setProfile(profile ?? null)
    } else {
      useAuthStore.getState().setProfile(null)
    }
  })
})()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
