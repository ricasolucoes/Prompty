import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

async function writeToClipboard(text: string): Promise<void> {
  // Prefer Web Clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    // fall through to Tauri fallback
  }

  // Tauri 2 fallback: dynamic import resolved via vite-ignore so static
  // module resolution does not fail when the optional plugin is absent.
  // Plugin (@tauri-apps/plugin-clipboard-manager) may not be installed until plan 09.
  try {
    const specifier = '@tauri-apps/plugin-clipboard-manager'
    const mod = (await import(/* @vite-ignore */ specifier).catch(() => null)) as Record<
      string,
      unknown
    > | null
    const writeText = mod?.['writeText']
    if (mod && typeof writeText === 'function') {
      await (writeText as (text: string) => Promise<void>)(text)
      return
    }
  } catch {
    // ignore
  }

  // Last resort: deprecated execCommand for older WebViews
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export function useCopy() {
  async function copy(text: string, promptyId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await writeToClipboard(text)
    } catch {
      return { ok: false, error: 'Não foi possível copiar. Tente novamente.' }
    }
    // Best-effort RPC to record copy event. Non-blocking; ignore errors so user always gets feedback.
    try {
      await supabase.rpc('record_copy', { p_prompty_id: promptyId })
    } catch {
      // swallow — copy already succeeded for the user
    }
    // Fire-and-forget: refresh profile.points so gamification loop stays current within the session.
    void useAuthStore.getState().refetchProfile()
    return { ok: true }
  }
  return { copy }
}
