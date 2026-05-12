import { useEffect, useState } from 'react'
import { SecondaryButton } from '@/components/ui/SecondaryButton'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { useReport } from '@/hooks/useReport'
import { CATEGORIES } from '@/lib/constants/categories'

interface Props {
  open: boolean
  prompty: { id: string; title: string }
  onClose: () => void
  onSubmitted: () => void
}

export function CategorySuggestSheet({ open, prompty, onClose, onSubmitted }: Props) {
  const { submit } = useReport()
  const [category, setCategory] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) { setCategory(''); setNotes(''); setBusy(false); setErr(null) }
  }, [open])

  if (!open) return null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) { setErr('Selecione uma categoria.'); return }
    setBusy(true); setErr(null)
    const trimmed = notes.trim()
    const r = await submit({
      prompty_id: prompty.id,
      type: 'category_suggestion',
      reason: category,
      ...(trimmed ? { notes: trimmed } : {}),
    })
    setBusy(false)
    if (!r.ok) { setErr(r.error ?? 'Não foi possível enviar.'); return }
    onSubmitted()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sugerir categoria"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', animation: 'fadeIn .2s',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%', maxWidth: 430,
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 32px',
          animation: 'slideUp .25s cubic-bezier(.2, .8, .2, 1)',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}
      >
        <div style={{ width: 32, height: 4, background: 'var(--line-strong)', borderRadius: 2, margin: '0 auto 16px' }} aria-hidden="true" />

        <h2 style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-display, sans-serif)', fontWeight: 700, fontSize: 19, letterSpacing: -0.4, color: 'var(--text-1)' }}>
          Sugerir categoria
        </h2>
        <p style={{ marginTop: 4, marginBottom: 24, textAlign: 'center', fontSize: 13.5, color: 'var(--text-2)' }}>
          {prompty.title}
        </p>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>
          Nova categoria
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Nova categoria"
          aria-required="true"
          style={{
            width: '100%', padding: 12,
            borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line)',
            color: 'var(--text-1)', fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13.5,
            marginBottom: 16,
          }}
        >
          <option value="" disabled>Selecione uma categoria</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>
          Por que esta categoria? (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Explique brevemente"
          maxLength={300}
          rows={2}
          aria-label="Por que esta categoria? (opcional)"
          style={{
            width: '100%', padding: 12, marginBottom: 16,
            borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface-2)',
            color: 'var(--text-1)', fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13.5, lineHeight: 1.4,
            resize: 'vertical',
          }}
        />

        {err && <p role="alert" style={{ color: '#FF3B6B', fontSize: 13.5, marginBottom: 12 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <SecondaryButton onClick={onClose} full>Fechar</SecondaryButton>
          <PrimaryButton type="submit" full disabled={busy || !category}>
            {busy ? 'Enviando…' : 'Enviar sugestão'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
