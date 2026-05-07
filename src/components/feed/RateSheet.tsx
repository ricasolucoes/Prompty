import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { SecondaryButton } from '@/components/ui/SecondaryButton'
import { useTest } from '@/hooks/useTest'

interface Props {
  open: boolean
  prompty: { id: string; title: string }
  onClose: () => void
  onSubmitted: () => void
}

export function RateSheet({ open, prompty, onClose, onSubmitted }: Props) {
  const { submit } = useTest()
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset on open/close
  useEffect(() => {
    if (!open) { setRating(0); setNotes(''); setImage(null); setBusy(false); setErr(null) }
  }, [open])

  if (!open) return null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) { setErr('Selecione uma nota.'); return }
    setBusy(true); setErr(null)
    const trimmedNotes = notes.trim()
    const r = await submit({
      prompty_id: prompty.id,
      rating,
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      ...(image ? { image } : {}),
    })
    setBusy(false)
    if (!r.ok) { setErr(r.error ?? 'Erro ao enviar.'); return }
    onSubmitted()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Avaliar prompty"
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
          Como ficou?
        </h2>
        <p style={{ marginTop: 4, marginBottom: 24, textAlign: 'center', fontSize: 13.5, color: 'var(--text-2)' }}>
          {prompty.title}
        </p>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }} role="radiogroup" aria-label="Nota">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
              onClick={() => setRating(n)}
              style={{
                background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                color: n <= rating ? '#FFB020' : 'var(--line-strong)',
              }}
            >
              <Icon name={n <= rating ? 'starFill' : 'star'} size={36} color={n <= rating ? '#FFB020' : 'currentColor'} />
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
          maxLength={500}
          rows={3}
          style={{
            width: '100%', padding: 12, marginBottom: 12,
            borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface-2)',
            color: 'var(--text-1)', fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13.5, lineHeight: 1.4,
            resize: 'vertical',
          }}
          aria-label="Notas (opcional)"
        />

        {/* Optional image upload */}
        <div style={{ marginBottom: 16 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
            aria-label="Anexar imagem"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', height: 140, borderRadius: 12,
              border: '2px dashed var(--line-strong)',
              background: 'var(--surface-2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', fontSize: 13.5, fontWeight: 700,
              gap: 8,
            }}
          >
            <Icon name="image" size={20} />
            {image ? `Anexada: ${image.name}` : 'Anexar imagem (opcional)'}
          </button>
        </div>

        {err && <p role="alert" style={{ color: '#FF3B6B', fontSize: 13.5, marginBottom: 12 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <SecondaryButton onClick={onClose} full>Avaliar depois</SecondaryButton>
          <PrimaryButton type="submit" full disabled={busy || rating < 1}>
            {busy ? 'Enviando…' : 'Enviar (+5p)'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
