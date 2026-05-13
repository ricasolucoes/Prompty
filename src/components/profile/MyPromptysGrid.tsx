import { useAuthStore } from '@/stores/auth.store'
import { levelOf } from '@/lib/constants/levels'
import { useMyPromptys } from '@/hooks/useMyPromptys'
import { MyPromptyCard } from './MyPromptyCard'

export function MyPromptysGrid() {
  const profile = useAuthStore((s) => s.profile)
  const lvl = levelOf(profile?.points ?? 0)
  // LEVL-07: feature appears progressively. Hidden for L1/L2 entirely (no greyed UI).
  const isL3OrAbove = lvl.id === 'L3' || lvl.id === 'L4' || lvl.id === 'L5'
  const { promptys } = useMyPromptys()

  if (!isL3OrAbove) return null

  return (
    <section style={{ marginTop: 48, textAlign: 'left' }} aria-label="Meus Promptys">
      <h2
        style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}
      >
        Meus Promptys
      </h2>

      {promptys.length === 0 ? (
        <div
          role="region"
          aria-label="Nenhum Prompty publicado"
          style={{
            padding: 24,
            border: '1px dashed var(--line-strong, var(--line))',
            borderRadius: 14,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, marginBottom: 4, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
            Nenhum Prompty ainda
          </p>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.4 }}>
            Crie seu primeiro Prompty pelo botão ✦ abaixo.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {promptys.map((p) => (
            <MyPromptyCard key={p.id} prompty={p} />
          ))}
        </div>
      )}
    </section>
  )
}
