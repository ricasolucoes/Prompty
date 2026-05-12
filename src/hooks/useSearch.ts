import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type SearchItem = Database['public']['Tables']['promptys']['Row'] & {
  profiles: {
    name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

type Cursor = { created_at: string; id: string } | undefined
const PAGE_SIZE = 10

async function fetchSearchPage(
  query: string,
  category: string | null,
  model: string | null,
  pageParam: Cursor,
): Promise<SearchItem[]> {
  let q = supabase
    .from('promptys')
    .select('*, profiles(name, username, avatar_url)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE)

  if (query) {
    // FTS via the generated `fts` tsvector column from migration 006.
    // `simple` config is used in the migration; `websearch` syntax handles partial words.
    q = q.textSearch('fts', query, { type: 'websearch', config: 'simple' })
  }
  if (category) {
    q = q.eq('category', category)
  }
  if (model) {
    q = q.contains('models', [model])
  }
  if (pageParam) {
    q = q.or(
      `created_at.lt.${pageParam.created_at},and(created_at.eq.${pageParam.created_at},id.lt.${pageParam.id})`,
    )
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as SearchItem[]
}

export function useSearch(query: string, category: string | null, model: string | null) {
  const enabled = query.length > 0 || !!category || !!model
  const result = useInfiniteQuery<
    SearchItem[],
    Error,
    { pages: SearchItem[][]; pageParams: Cursor[] },
    ['search', string, string | null, string | null],
    Cursor
  >({
    queryKey: ['search', query, category, model],
    queryFn: ({ pageParam }) => fetchSearchPage(query, category, model, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined
      const last = lastPage[lastPage.length - 1]
      if (!last) return undefined
      return { created_at: last.created_at, id: last.id }
    },
    enabled,
  })

  return {
    pages: result.data?.pages ?? [],
    isLoading: result.isLoading,
    isFetchingNextPage: result.isFetchingNextPage,
    hasNextPage: !!result.hasNextPage,
    fetchNextPage: () => { void result.fetchNextPage() },
    enabled,
  }
}
