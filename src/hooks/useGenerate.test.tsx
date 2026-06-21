import { describe, it, expect } from 'vitest'

// Phase 6 Wave 0 scaffold — RED until plan 06-03 implements src/hooks/useGenerate.ts.
// Per STATE.md Phase 02 decision, we do NOT statically import the not-yet-existing
// module (Vite static resolution fails even in catch()). Plan 06-03 will:
//   1. delete these anchors,
//   2. add `import { useGenerate } from './useGenerate'`,
//   3. mock `@/lib/supabase` functions.invoke and `@/stores/auth.store`,
//   4. assert the GEN-03 / GEN-05 behaviors below.
describe('useGenerate (GEN-03, GEN-05)', () => {
  it.todo('GEN-05: state goes idle → loading → done with signedUrl when invoke returns { data: { signed_url } }')
  it.todo('GEN-05: state goes idle → loading → error with errorMsg when invoke returns an error or data.error')
  it.todo('GEN-03: calling generate() twice while state===loading does not start a second invoke (button-disable + guard)')
  it.todo('GEN-01/05: refetchProfile is called after invoke resolves (badge decrement)')

  it('scaffold anchor present (RED until 06-03)', () => {
    expect(true).toBe(true)
  })
})
