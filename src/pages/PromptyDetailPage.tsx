import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { useSave } from '@/hooks/useSave'
import { useCopy } from '@/hooks/useCopy'
import { useGenerate } from '@/hooks/useGenerate'
import { resolveBeginner, type InputField } from '@/lib/prompty/template'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Toast } from '@/components/ui/Toast'
import { OptionsSheet } from '@/components/ui/OptionsSheet'
import { ReportSheet } from '@/components/feed/ReportSheet'
import { CategorySuggestSheet } from '@/components/feed/CategorySuggestSheet'
import { CommunityResults } from '@/components/feed/CommunityResults'
import { GenerateActions } from '@/components/prompty/GenerateActions'
import { levelOf } from '@/lib/constants/levels'
import type { Database } from '@/types/database.types'

type Prompty = Database['public']['Tables']['promptys']['Row'] & {
  profiles: { name: string | null; username: string | null; avatar_url: string | null } | null
}

const LEVEL_ID_L2 = 'L2'
const LEVEL_ID_L3 = 'L3'
const LEVEL_ID_L4 = 'L4'
const LEVEL_ID_L5 = 'L5'

// eslint-disable-next-line max-lines-per-function, complexity, max-statements -- page shell; refactor deferred
export function PromptyDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [prompty, setPrompty] = useState<Prompty | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    icon: 'check' | 'copy' | 'bookmark'
    iconColor?: string
  } | null>(null)

  // LEVL-07: "..." menu only for L2+ users
  const LEVEL_ORDER: ReadonlyArray<string> = [
    'L1',
    LEVEL_ID_L2,
    LEVEL_ID_L3,
    LEVEL_ID_L4,
    LEVEL_ID_L5,
  ]
  const isL2 = profile
    ? LEVEL_ORDER.indexOf(levelOf(profile.points ?? 0).id) >= LEVEL_ORDER.indexOf(LEVEL_ID_L2)
    : false
  // CREAT-04 / LEVL-07: "Criar variação" only for L3+ users — hidden (not disabled) for L1/L2
  const lvl = levelOf(profile?.points ?? 0)
  const isL3OrAbove = lvl.id === LEVEL_ID_L3 || lvl.id === LEVEL_ID_L4 || lvl.id === LEVEL_ID_L5
  const [showOptions, setShowOptions] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showCategorySuggest, setShowCategorySuggest] = useState(false)

  // Fetch prompty by slug
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!slug) return
      setLoading(true)
      const { data, error } = await supabase
        .from('promptys')
        .select('*, profiles!promptys_author_id_fkey(name, username, avatar_url)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()
      if (cancelled) return
      if (error || !data) {
        setNotFound(true)
      } else {
        setPrompty(data)
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  // Save hook — call unconditionally (Rules of Hooks). Empty id when prompty
  // is not loaded yet keeps the maybeSingle query a no-op; once loaded the
  // hook re-runs on dep change and queries the real id.
  const promptyIdForSave = prompty?.id ?? ''
  const { saved, toggle: toggleSave } = useSave(promptyIdForSave)

  const inputs = (Array.isArray(prompty?.inputs_schema)
    ? prompty?.inputs_schema
    : []) as unknown as InputField[]
  const resolved = useMemo(
    () => (prompty ? resolveBeginner(prompty.template, inputs) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prompty?.template, inputs],
  )

  const { copy } = useCopy()
  const { generate, state: genState, signedUrl, errorMsg, reset: resetGen } = useGenerate()

  async function handleCopy() {
    if (!prompty) return
    const r = await copy(resolved, prompty.id)
    if (r.ok) {
      setCopied(true)
      setToast({ message: 'Prompt copiado', icon: 'check', iconColor: '#34D399' })
    } else {
      setToast({ message: r.error ?? 'Erro ao copiar', icon: 'copy', iconColor: '#FF3B6B' })
    }
  }

  async function handleSave() {
    if (!user) {
      void nav('/login')
      return
    }
    const wasSaved = saved
    await toggleSave()
    setToast({
      message: wasSaved ? 'Removido da biblioteca' : 'Salvo na biblioteca',
      icon: 'bookmark',
      iconColor: wasSaved ? '#FF3B6B' : '#34D399',
    })
  }

  function handleVariation() {
    if (!prompty) return
    void nav(`/criar?from=${prompty.id}`)
  }

  // Loading state
  if (loading) {
    return (
      <main
        className="screen"
        style={{ padding: 32, textAlign: 'center', maxWidth: 430, margin: '0 auto' }}
      >
        <p style={{ color: 'var(--text-3)', fontSize: 13.5 }}>Carregando…</p>
      </main>
    )
  }

  // Not found state
  if (notFound || !prompty) {
    return (
      <main
        className="screen"
        style={{ padding: 32, textAlign: 'center', maxWidth: 430, margin: '0 auto' }}
      >
        <h1
          style={{ fontFamily: 'var(--font-display, sans-serif)', fontWeight: 700, fontSize: 22 }}
        >
          Prompty não encontrado
        </h1>
        <p style={{ marginTop: 8, color: 'var(--text-2)', fontSize: 13.5 }}>
          Este Prompty não existe ou foi removido.{' '}
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Voltar ao feed
          </Link>
        </p>
      </main>
    )
  }

  const author = prompty.profiles
  const cover = prompty.cover_url
    ? undefined
    : (prompty.cover_gradient ?? 'linear-gradient(135deg,#3b1d6e 0%,#7C3AED 50%,#FF6B4A 100%)')

  return (
    <main className="screen" style={{ paddingBottom: 96, maxWidth: 430, margin: '0 auto' }}>
      {/* Back link */}
      <div style={{ padding: '12px 16px 8px' }}>
        <Link
          to="/"
          aria-label="Voltar ao feed"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--text-2)',
            fontSize: 13.5,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <Icon name="chevronL" size={20} />
          <span>Feed</span>
        </Link>
      </div>

      {/* Author header */}
      <header style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar
          user={{ name: author?.name ?? 'Promptys', avatar_url: author?.avatar_url ?? null }}
          size={42}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>
            {author?.name ?? 'Promptys'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>
            compartilhou um Prompty
          </div>
        </div>
        {isL2 && (
          <button
            type="button"
            aria-label="Mais opções"
            aria-haspopup="dialog"
            onClick={() => setShowOptions(true)}
            style={{
              padding: 12,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="moreHorizontal" size={20} />
          </button>
        )}
      </header>

      {/* Title */}
      <h1
        style={{
          margin: 0,
          padding: '8px 16px',
          fontFamily: 'var(--font-display, sans-serif)',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: -0.5,
          lineHeight: 1.2,
          color: 'var(--text-1)',
        }}
      >
        {prompty.title}
      </h1>

      {/* Cover image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '4/5',
          background: prompty.cover_url
            ? `url(${prompty.cover_url}) center/cover no-repeat`
            : cover,
        }}
        aria-label={`Imagem de exemplo do Prompty ${prompty.title}`}
        role="img"
      />

      {/* Full prompt section — NO clamp, NO Ver mais */}
      <section style={{ padding: '16px' }}>
        <p
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}
        >
          Prompt
        </p>
        <div
          data-testid="prompt-text-full"
          style={{
            fontSize: 13.5,
            fontWeight: 400,
            lineHeight: 1.5,
            color: 'var(--text-2)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {resolved}
        </div>
      </section>

      {/* Action buttons — Copiar prompt always; Salvar only for authenticated users */}
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PrimaryButton
          full
          icon={copied ? 'check' : 'copy'}
          onClick={() => {
            void handleCopy()
          }}
        >
          {copied ? 'Copiado!' : 'Copiar prompt'}
        </PrimaryButton>

        {/* Plain <button> styled like SecondaryButton — used here (instead of
            <SecondaryButton>) because we need an aria-label that differs from
            the visible text ("Salvar"/"Salvo"). SecondaryButton's API does
            not accept aria-label and we deliberately do not extend it. */}
        {user && (
          <button
            type="button"
            onClick={() => {
              void handleSave()
            }}
            aria-label={saved ? 'Remover dos salvos' : 'Salvar na biblioteca'}
            className="inline-flex w-full items-center justify-center rounded-[14px] px-4 py-3 font-bold"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--text-1)',
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: 13.5,
              lineHeight: 1.2,
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <Icon name="bookmark" size={18} color={saved ? 'var(--primary)' : 'currentColor'} />
            <span>{saved ? 'Salvo' : 'Salvar'}</span>
          </button>
        )}

        {/* CREAT-04: Criar variação — L3+ only (LEVL-07: hidden for L1/L2) */}
        {isL3OrAbove && (
          <button
            type="button"
            onClick={handleVariation}
            aria-label="Criar variação deste Prompty"
            className="inline-flex w-full items-center justify-center rounded-[14px] px-4 py-3 font-bold"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--text-1)',
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: 13.5,
              lineHeight: 1.2,
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <Icon name="wand" size={18} color="var(--primary)" />
            <span>Criar variação</span>
          </button>
        )}

        {/* GEN-01/03/04/05/06/07: image-generation states */}
        <GenerateActions
          isAnon={!user}
          credits={profile?.credits ?? 0}
          genState={genState}
          signedUrl={signedUrl}
          errorMsg={errorMsg}
          onSignup={() => void nav('/signup')}
          onGenerate={() => void generate(prompty.id, resolved)}
          onCloseModal={resetGen}
        />
      </div>

      {/* CUR-01 surface: community-uploaded result images — L2+ only */}
      {isL2 && prompty && <CommunityResults promptyId={prompty.id} />}

      {/* L2 menu: "..." options + report + category suggest sheets */}
      {isL2 && prompty && (
        <>
          <OptionsSheet
            open={showOptions}
            onClose={() => setShowOptions(false)}
            ariaLabel="Opções para este Prompty"
            options={[
              {
                label: 'Sugerir categoria',
                icon: 'tag',
                onClick: () => setShowCategorySuggest(true),
              },
              {
                label: 'Denunciar',
                icon: 'flag',
                destructive: true,
                onClick: () => setShowReport(true),
              },
            ]}
          />
          <ReportSheet
            open={showReport}
            prompty={{ id: prompty.id, title: prompty.title }}
            onClose={() => setShowReport(false)}
            onSubmitted={() =>
              setToast({ message: 'Denúncia enviada', icon: 'check', iconColor: '#34D399' })
            }
          />
          <CategorySuggestSheet
            open={showCategorySuggest}
            prompty={{ id: prompty.id, title: prompty.title }}
            onClose={() => setShowCategorySuggest(false)}
            onSubmitted={() =>
              setToast({ message: 'Sugestão enviada', icon: 'check', iconColor: '#34D399' })
            }
          />
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          icon={toast.icon}
          {...(toast.iconColor ? { iconColor: toast.iconColor } : {})}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  )
}
