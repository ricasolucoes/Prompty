import { useEffect } from 'react'
import { useFeed } from '@/hooks/useFeed'
import { useAuthStore } from '@/stores/auth.store'
import { FeedCard } from '@/components/feed/FeedCard'
import { SkeletonCard } from '@/components/feed/SkeletonCard'
import { WelcomeStrip } from '@/components/feed/WelcomeStrip'
import { EndOfFeedNudge } from '@/components/feed/EndOfFeedNudge'

export function FeedPage() {
  const { pages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useFeed()
  const user = useAuthStore((s) => s.user)
  const items = pages.flat()

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
        <FeedCard key={p.id} prompty={p} />
      ))}

      {isFetchingNextPage && <SkeletonCard />}
      {!isLoading && !hasNextPage && items.length > 0 && <EndOfFeedNudge />}
    </section>
  )
}
