import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'
import { useLevelStore } from '@/stores/level.store'
import { levelOf, nextLevel } from '@/lib/constants/levels'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { SecondaryButton } from '@/components/ui/SecondaryButton'
import { Icon } from '@/components/ui/Icon'
import { LevelUpModal } from '@/components/modals/LevelUpModal'
import { MyPromptysGrid } from '@/components/profile/MyPromptysGrid'
import { CreditHistorySheet } from '@/components/profile/CreditHistorySheet'

// Unlock description by next level id — what the user is unlocking at each threshold
type UnlockableLevel = 'L2' | 'L3' | 'L4' | 'L5'
const NEXT_LEVEL_COPY: Partial<Record<UnlockableLevel, string>> = {
  L2: 'Buscar promptys e Salvos para depois',
  L3: 'Criar seus próprios Promptys',
  L4: 'Ranking e badges da comunidade',
  L5: 'Modo avançado completo',
}

// eslint-disable-next-line max-lines-per-function, complexity -- page-level shell with edit form; refactor deferred
export function ProfilePage() {
  const { profile, update, recents } = useProfile()
  const { signOut } = useAuth()
  const user = useAuthStore((s) => s.user)
  const nav = useNavigate()

  const lvl = levelOf(profile?.points ?? 0)
  const next = nextLevel(lvl)

  // LevelUp detection (LEVL-03 / LEVL-04)
  const hasShown = useLevelStore((s) => s.hasShown)
  const markShown = useLevelStore((s) => s.markShown)
  const [showLevelUp, setShowLevelUp] = useState<typeof lvl | null>(null)
  useEffect(() => {
    if (lvl.id !== 'L1' && !hasShown(lvl.id)) {
      setShowLevelUp(lvl)
    }
  }, [lvl, hasShown])

  // "Você usou X Promptys" — count of distinct promptys from recents (saves + tests)
  const usedCount = recents.length

  // Credit history sheet state
  const [historyOpen, setHistoryOpen] = useState(false)

  // Edit form state
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setName(profile?.name ?? '')
    setUsername(profile?.username ?? '')
    setBio(profile?.bio ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only reset form fields when profile identity changes, not on every field update
  }, [profile?.id])

  if (!user) {
    // Anonymous L1: minimal CTA to login (Profile is reachable via tab bar)
    return (
      <main
        className="screen"
        style={{ padding: 32, textAlign: 'center', maxWidth: 430, margin: '0 auto' }}
      >
        <Avatar user={{ name: '?' }} size={88} />
        <h1
          style={{
            marginTop: 16,
            fontFamily: 'var(--font-display, sans-serif)',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: -0.4,
          }}
        >
          Você ainda não tem conta
        </h1>
        <p style={{ marginTop: 8, color: 'var(--text-2)', fontSize: 13.5 }}>
          Entre para guardar seu progresso e voltar de onde parou.
        </p>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PrimaryButton
            full
            onClick={() => {
              void nav('/login')
            }}
          >
            Entrar
          </PrimaryButton>
          <SecondaryButton
            full
            onClick={() => {
              void nav('/signup')
            }}
          >
            Criar conta
          </SecondaryButton>
        </div>
      </main>
    )
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const r = await update({ name, username, bio })
    setBusy(false)
    if (!r.ok) {
      setErr(r.error ?? 'Não foi possível salvar.')
      return
    }
    setEditing(false)
  }

  async function onSignOut() {
    await signOut()
    void nav('/', { replace: true })
  }

  return (
    <main
      className="screen"
      style={{ padding: '20px 16px 96px', maxWidth: 430, margin: '0 auto', textAlign: 'center' }}
    >
      <Avatar
        user={{ name: profile?.name ?? null, avatar_url: profile?.avatar_url ?? null }}
        size={88}
      />

      {!editing ? (
        <>
          <h1
            style={{
              marginTop: 16,
              fontFamily: 'var(--font-display, sans-serif)',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: -0.4,
              color: 'var(--text-1)',
            }}
          >
            {profile?.name ?? 'Sem nome'}
          </h1>
          {profile?.username && (
            <p style={{ marginTop: 4, fontSize: 13.5, color: 'var(--text-3)' }}>
              @{profile.username}
            </p>
          )}
          {profile?.bio && (
            <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
              {profile.bio}
            </p>
          )}

          <p style={{ marginTop: 16, fontSize: 13.5, color: 'var(--text-2)' }}>
            Você usou <strong style={{ color: 'var(--text-1)' }}>{usedCount}</strong>{' '}
            {usedCount === 1 ? 'Prompty' : 'Promptys'}
          </p>

          {/* Progress card (no numeric points; feature-unlock copy) */}
          {next && (
            <section
              style={{
                maxWidth: 280,
                margin: '24px auto 0',
                padding: 16,
                borderRadius: 14,
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
              aria-label="Próximo desbloqueio"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="lock" size={14} color="var(--text-3)" />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>
                  Próximo desbloqueio
                </span>
              </div>
              <ProgressBar value={profile?.points ?? 0} max={next.min} height={8} />
              <p
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  fontSize: 13.5,
                  lineHeight: 1.4,
                  color: 'var(--text-2)',
                  textAlign: 'left',
                }}
              >
                {NEXT_LEVEL_COPY[next.id as UnlockableLevel] ? (
                  <>
                    Use mais alguns Promptys para destravar{' '}
                    <strong>{NEXT_LEVEL_COPY[next.id as UnlockableLevel]}</strong>.
                  </>
                ) : (
                  'Continue usando Promptys para avançar de nível.'
                )}
              </p>
            </section>
          )}

          {/* Recents grid */}
          <section style={{ marginTop: 24, textAlign: 'left' }} aria-label="Seus últimos usados">
            <h2
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: 'var(--text-3)',
              }}
            >
              Seus últimos usados
            </h2>
            {recents.length === 0 ? (
              <p
                style={{
                  padding: 24,
                  border: '1px dashed var(--line-strong)',
                  borderRadius: 14,
                  color: 'var(--text-3)',
                  fontSize: 13.5,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}
              >
                {`Você ainda não copiou nenhum Prompty.\nVolte ao feed e experimente um.`}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {recents.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      aspectRatio: '4/5',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: r.cover_url
                        ? `url(${r.cover_url}) center/cover no-repeat`
                        : (r.cover_gradient ?? 'linear-gradient(135deg,#7C3AED,#22D3EE)'),
                      position: 'relative',
                    }}
                    aria-label={r.title}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '32px 8px 8px',
                        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7))',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {r.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          {/* L3-only stats grid (CREAT-03) — component returns null for L1/L2 per LEVL-07 */}
          <MyPromptysGrid />

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SecondaryButton full onClick={() => setHistoryOpen(true)}>
              Histórico de créditos
            </SecondaryButton>
            <SecondaryButton full onClick={() => setEditing(true)}>
              Editar perfil
            </SecondaryButton>
            <SecondaryButton
              full
              onClick={() => {
                void onSignOut()
              }}
            >
              Sair
            </SecondaryButton>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            void onSave(e)
          }}
          style={{ marginTop: 24, textAlign: 'left' }}
        >
          <label style={labelStyle()}>
            Nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              style={inputStyle()}
            />
          </label>
          <label style={labelStyle()}>
            Username
            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
              }
              maxLength={30}
              style={inputStyle()}
            />
          </label>
          <label style={labelStyle()}>
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              style={inputStyle()}
            />
          </label>
          {err && (
            <p role="alert" style={{ color: '#FF3B6B', fontSize: 13.5 }}>
              {err}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SecondaryButton full onClick={() => setEditing(false)}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" full disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar'}
            </PrimaryButton>
          </div>
        </form>
      )}

      <CreditHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {showLevelUp && (
        <LevelUpModal
          level={showLevelUp}
          onDismiss={() => {
            markShown(showLevelUp.id)
            setShowLevelUp(null)
          }}
        />
      )}
    </main>
  )
}

function labelStyle(): React.CSSProperties {
  return {
    display: 'block',
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'var(--text-3)',
  }
}
function inputStyle(): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid var(--line)',
    background: 'var(--surface-2)',
    color: 'var(--text-1)',
    fontSize: 13.5,
    fontFamily: 'var(--font-sans, sans-serif)',
  }
}
