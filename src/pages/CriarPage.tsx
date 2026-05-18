import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCreatePrompty, type WizardData } from '@/hooks/useCreatePrompty'
import { CreateWizard } from '@/components/create/CreateWizard'

export function CriarPage() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const parentId = searchParams.get('from')
  const { publish } = useCreatePrompty()

  const [initialData, setInitialData] = useState<Partial<WizardData> | null>(null)
  const [loading, setLoading] = useState<boolean>(!!parentId)

  useEffect(() => {
    let cancelled = false
    async function loadParent() {
      if (!parentId) {
        setInitialData({})
        return
      }
      setLoading(true)
      const { data, error } = await supabase
        .from('promptys')
        .select('id, title, template, difficulty, cover_url, style_tags, models')
        .eq('id', parentId)
        .maybeSingle()
      if (cancelled) return
      if (error || !data) {
        // Graceful degrade — start with empty wizard
        setInitialData({})
        setLoading(false)
        return
      }
      setInitialData({
        title: (data as { title: string }).title,
        beginner_prompt: (data as { template: string }).template,
        category:
          ((data as { difficulty: string | null }).difficulty as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | null) ?? 'beginner',
        styleTags: (data as { style_tags: string[] }).style_tags ?? [],
        recommendedModel: ((data as { models: string[] }).models ?? [])[0] ?? '',
        parentId,
      })
      setLoading(false)
    }
    void loadParent()
    return () => {
      cancelled = true
    }
  }, [parentId])

  async function handlePublish(form: WizardData) {
    const r = await publish(form)
    if (r.ok && r.slug) {
      void nav(`/p/${r.slug}`, { replace: true })
    }
    return r
  }

  function handleClose() {
    void nav('/', { replace: true })
  }

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

  // initialData is guaranteed non-null here (loadParent always sets it)
  return (
    <CreateWizard initialData={initialData ?? {}} onClose={handleClose} onPublish={handlePublish} />
  )
}
