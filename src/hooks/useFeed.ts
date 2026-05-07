import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type FeedItem = Database['public']['Tables']['promptys']['Row'] & {
  profiles: {
    name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

type Cursor = { created_at: string; id: string } | undefined
const PAGE_SIZE = 10

async function fetchPage(pageParam: Cursor): Promise<FeedItem[]> {
  let q = supabase
    .from('promptys')
    .select('*, profiles(name, username, avatar_url)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE)

  if (pageParam) {
    // Cursor pagination: rows strictly older than (created_at, id) tuple — no OFFSET
    q = q.or(
      `created_at.lt.${pageParam.created_at},and(created_at.eq.${pageParam.created_at},id.lt.${pageParam.id})`,
    )
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as FeedItem[]
}

export function useFeed() {
  const query = useInfiniteQuery<FeedItem[], Error, { pages: FeedItem[][]; pageParams: Cursor[] }, ['feed'], Cursor>({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined
      const last = lastPage[lastPage.length - 1]
      if (!last) return undefined
      return { created_at: last.created_at, id: last.id }
    },
  })

  return {
    pages: query.data?.pages ?? [],
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: () => { void query.fetchNextPage() },
    refetch: () => { void query.refetch() },
  }
}
