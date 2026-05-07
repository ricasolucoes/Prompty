import { supabase } from '@/lib/supabase'

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

  // Tauri 2 fallback: dynamic import so web build doesn't fail.
  // Plugin (@tauri-apps/plugin-clipboard-manager) may not be installed until plan 09.
  // Using Function constructor to avoid TS module resolution on optional plugin.
  try {
    // eslint-disable-next-line no-new-func
    const dynImport = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<unknown>
    const mod = await dynImport('@tauri-apps/plugin-clipboard-manager').catch(() => null) as Record<string, unknown> | null
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
    return { ok: true }
  }
  return { copy }
}
