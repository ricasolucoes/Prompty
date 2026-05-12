import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { compressToWebP } from '@/lib/images/compress'
import type { InputField } from '@/lib/prompty/template'

export interface WizardData {
  title: string
  beginner_prompt: string
  category: 'beginner' | 'intermediate' | 'advanced' // wizard "Simples/Guiado/Avançado" maps here
  styleTags?: string[]
  recommendedModel?: string
  coverFile?: File
  // optional advanced
  advancedTemplate?: string
  inputs_schema?: InputField[]
  // variation
  parentId?: string | null
}

export interface PublishResult {
  ok: boolean
  error?: string
  slug?: string
  promptyId?: string
}

// Slug: kebab(title) trimmed to 40 chars + '-' + 6 random alphanumeric chars.
// Mirrors regex from 03-RESEARCH.md.
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}`
}

async function uploadCoverImage(userId: string, slug: string, file: File): Promise<string | null> {
  const blob = await compressToWebP(file, 200, 0.85)
  const path = `${userId}/${slug}-cover.webp`
  const { error } = await supabase.storage
    .from('prompty-covers')
    .upload(path, blob, { contentType: 'image/webp', upsert: true })
  if (error) {
    console.warn('Cover upload failed:', error.message)
    return null
  }
  const { data } = supabase.storage.from('prompty-covers').getPublicUrl(path)
  return data.publicUrl ?? null
}

export function useCreatePrompty() {
  async function publish(form: WizardData): Promise<PublishResult> {
    const user = useAuthStore.getState().user
    if (!user) return { ok: false, error: 'Não autenticado' }

    const slug = generateSlug(form.title)

    let cover_url: string | null = null
    if (form.coverFile) {
      cover_url = await uploadCoverImage(user.id, slug, form.coverFile)
    }

    const insertPayload = {
      author_id: user.id,
      slug,
      title: form.title,
      template: form.beginner_prompt, // beginner_prompt → template column
      difficulty: form.category, // category → difficulty column
      models: form.recommendedModel ? [form.recommendedModel] : [],
      style_tags: form.styleTags ?? [],
      inputs_schema: (form.inputs_schema ?? []) as never,
      cover_url,
      status: 'published',
      parent_id: form.parentId ?? null,
    }

    const { data, error } = await supabase
      .from('promptys')
      .insert(insertPayload)
      .select('id, slug')
      .single()

    if (error || !data) return { ok: false, error: 'Não foi possível publicar.' }

    // If advanced mode used, create version snapshot (best-effort — doesn't block publish)
    if (form.advancedTemplate && form.advancedTemplate.trim().length > 0) {
      await supabase.from('prompty_versions').insert({
        prompty_id: data.id,
        version: 1,
        template: form.advancedTemplate,
        inputs_schema: (form.inputs_schema ?? []) as never,
      })
    }

    return { ok: true, slug: data.slug, promptyId: data.id }
  }

  return { publish }
}
