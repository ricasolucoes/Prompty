import { useEffect, useState } from 'react'
import { useFeed, type FeedItem } from '@/hooks/useFeed'
import { useAuthStore } from '@/stores/auth.store'
import { FeedCard } from '@/components/feed/FeedCard'
import { SkeletonCard } from '@/components/feed/SkeletonCard'
import { WelcomeStrip } from '@/components/feed/WelcomeStrip'
import { EndOfFeedNudge } from '@/components/feed/EndOfFeedNudge'
import { RateSheet } from '@/components/feed/RateSheet'
import { Toast } from '@/components/ui/Toast'
import { useCopy } from '@/hooks/useCopy'
import { useLike } from '@/hooks/useLike'
import { resolveBeginner, type InputField } from '@/lib/prompty/template'

function FeedCardWithLike({
  p,
  copied,
  rated,
  onCopy,
  onRate,
}: {
  p: FeedItem
  copied: boolean
  rated: boolean
  onCopy: () => void
  onRate: () => void
}) {
  const { liked, toggle, isAuthenticated } = useLike(p.id)
  return (
    <FeedCard
      prompty={p}
      liked={liked}
      copied={copied}
      rated={rated}
      {...(isAuthenticated ? { onLike: toggle } : {})}
      onCopy={onCopy}
      onRate={onRate}
    />
  )
}

interface ToastState {
  message: string
  icon?: 'check' | 'copy'
  iconColor?: string
  points?: string
}

export function FeedPage() {
  const { pages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useFeed()
  const user = useAuthStore((s) => s.user)
  const items: FeedItem[] = pages.flat()

  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())
  const [rateOpenFor, setRateOpenFor] = useState<FeedItem | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const { copy } = useCopy()

  // Infinite scroll: trigger fetchNextPage when sentinel approaches viewport
  useEffect(() => {
    function onScroll() {
      if (!hasNextPage || isFetchingNextPage) return
      const nearBottom = window.innerHeight + window.scrollY > document.body.offsetHeight - 600
      if (nearBottom) fetchNextPage()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  async function handleCopy(p: FeedItem) {
    const inputs = (Array.isArray(p.inputs_schema) ? p.inputs_schema : []) as unknown as InputField[]
    const text = resolveBeginner(p.template, inputs)
    const r = await copy(text, p.id)
    if (r.ok) {
      setCopiedIds((s) => new Set(s).add(p.id))
      setToast({ message: 'Prompt copiado', icon: 'check', iconColor: '#34D399' })
    } else {
      setToast({ message: r.error ?? 'Erro ao copiar', icon: 'copy', iconColor: '#FF3B6B' })
    }
  }

  function handleRate(p: FeedItem) {
    if (!user) {
      setToast({ message: 'Entre para avaliar', icon: 'copy', iconColor: '#FF3B6B' })
      return
    }
    setRateOpenFor(p)
  }

  function onRateSubmitted() {
    if (rateOpenFor) {
      setRatedIds((s) => new Set(s).add(rateOpenFor.id))
      setToast({ message: 'Avaliação enviada', icon: 'check', iconColor: '#34D399', points: '+5p' })
    }
    setRateOpenFor(null)
  }

  return (
    <section className="screen" style={{ paddingBottom: 16 }}>
      {!user && <WelcomeStrip />}

      {isLoading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {!isLoading && items.length === 0 && (
        <p style={{ padding: 16, color: 'var(--text-3)', textAlign: 'center' }}>
          Nada por aqui ainda. Volte mais tarde.
        </p>
      )}

      {items.map((p) => (
        <FeedCardWithLike
          key={p.id}
          p={p}
          copied={copiedIds.has(p.id)}
          rated={ratedIds.has(p.id)}
          onCopy={() => handleCopy(p)}
          onRate={() => handleRate(p)}
        />
      ))}

      {isFetchingNextPage && <SkeletonCard />}
      {!isLoading && !hasNextPage && items.length > 0 && <EndOfFeedNudge />}

      {rateOpenFor && (
        <RateSheet
          open={!!rateOpenFor}
          prompty={{ id: rateOpenFor.id, title: rateOpenFor.title }}
          onClose={() => setRateOpenFor(null)}
          onSubmitted={onRateSubmitted}
        />
      )}

      {toast && (
        <Toast
          key={toast.message + Date.now()}
          message={toast.message}
          icon={toast.icon ?? 'check'}
          {...(toast.iconColor ? { iconColor: toast.iconColor } : {})}
          {...(toast.points ? { points: toast.points } : {})}
          onDismiss={() => setToast(null)}
        />
      )}
    </section>
  )
}
