---
phase: 02-l2-curador-descoberta
plan: 05
subsystem: hooks + ui
tags: [hooks, supabase, reports, community-results, options-sheet, tdd]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [useReport, useCommunityResults, OptionsSheet]
  affects: [02-06, 02-07]
tech_stack:
  added: []
  patterns: [useAuthStore.getState()-inside-async, cancelled-flag-useEffect, options-array-sheet]
key_files:
  created:
    - src/hooks/useReport.ts
    - src/hooks/useReport.test.ts
    - src/hooks/useCommunityResults.ts
    - src/hooks/useCommunityResults.test.ts
    - src/components/ui/OptionsSheet.tsx
    - src/components/ui/OptionsSheet.test.tsx
  modified: []
decisions:
  - "OptionsSheet test uses `not.toContain('1px solid')` for last-option border assertion — JSDOM expands `borderBottom: 'none'` shorthand to empty string, not the string 'none'"
  - "useCommunityResults filter uses `.filter(r => ...).map(r => ({ image_url: r.image_url as string }))` cast instead of type predicate — TS2677 prevents predicate narrowing when profiles union type is wider than expected intersection"
metrics:
  duration: 5min
  completed_date: "2026-05-12"
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 02 Plan 05: Hooks + OptionsSheet Summary

**One-liner:** Two Supabase-backed hooks (useReport, useCommunityResults) and a generic OptionsSheet bottom sheet — all TDD with 15 tests passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | useReport + useCommunityResults hooks with tests | babfe1a | useReport.ts, useReport.test.ts, useCommunityResults.ts, useCommunityResults.test.ts |
| 2 | OptionsSheet generic bottom sheet with tests | edaa5ef | OptionsSheet.tsx, OptionsSheet.test.tsx |

## Artifacts Delivered

### `src/hooks/useReport.ts`

**Interface:**
```typescript
export interface ReportSubmitInput {
  prompty_id: string
  type: 'report' | 'category_suggestion'
  reason: string
  notes?: string
}
export function useReport(): { submit: (input: ReportSubmitInput) => Promise<{ ok: boolean; error?: string }> }
```

**Payload inserted** into `reports` table: `{ reporter_id, prompty_id, type, reason, notes: input.notes ?? null }`.

**Error handling:** returns `{ok:false, error:'Faça login para enviar.'}` when user is null (no insert); returns `{ok:false, error:'Não foi possível enviar.'}` on any Supabase error (unique constraint, RLS denial, etc.).

**Tests (5 passing):**
1. Returns `{ok:false}` when user is null — does NOT call supabase.insert
2. CUR-05/MODR-01: type='report' inserts correct payload
3. CUR-04: type='category_suggestion' inserts correct payload
4. notes field omitted → payload has `notes: null`
5. Supabase error → `{ok:false, error:'Não foi possível enviar.'}`

---

### `src/hooks/useCommunityResults.ts`

**Interface:**
```typescript
export interface CommunityResult {
  id: string; image_url: string; rating: number | null; notes: string | null
  created_at: string; user: { id: string; name: string | null; avatar_url: string | null } | null
}
export function useCommunityResults(promptyId: string | null): { results: CommunityResult[]; loading: boolean }
```

**Query shape:** `.from('prompty_tests').select('id, image_url, rating, notes, created_at, user_id, profiles(id, name, avatar_url)').eq('prompty_id', id).not('image_url', 'is', null).order('created_at', { ascending: false })`

**Profile-join unwrap:** `unwrapProfile` handles both array and object return shapes from Supabase foreign key join; returns `null` if profile is absent.

**Cancellation:** `cancelled` flag in useEffect prevents setState after component unmount.

**Tests (4 passing):**
1. Returns `{results:[], loading:false}` when promptyId is null
2. Calls supabase with correct `.eq`, `.not`, `.order` filters
3. Select string contains `profiles(id, name, avatar_url)`
4. Maps raw rows to CommunityResult shape with `user` field derived from joined profile

---

### `src/components/ui/OptionsSheet.tsx`

**Interface:**
```typescript
export interface OptionsSheetOption { label: string; icon: IconName; onClick: () => void; destructive?: boolean }
export interface OptionsSheetProps { open: boolean; onClose: () => void; options: OptionsSheetOption[]; ariaLabel?: string }
export function OptionsSheet(props: OptionsSheetProps): JSX.Element | null
```

**Behavior:**
- Returns `null` when `open=false` (no DOM elements)
- Renders `role="dialog" aria-modal="true"` with provided `ariaLabel` (default: `'Opções'`)
- Option click order: `opt.onClick()` THEN `onClose()` — caller receives event before sheet closes
- Destructive option: `color: '#FF3B6B'` on both label span and Icon
- Border separator: `1px solid var(--line)` on all buttons except the last
- Backdrop click: `e.target === e.currentTarget` guard on outer div calls `onClose()`
- Animation: `slideUp .25s cubic-bezier(.2, .8, .2, 1)` matching RateSheet pattern

**Tests (6 passing):**
1. Returns null when open=false
2. Renders dialog with aria-label and option labels
3. Destructive label has color `rgb(255, 59, 107)` (JSDOM renders hex as rgb)
4. Option click calls onClick AND onClose
5. Backdrop click calls onClose
6. First option has `1px solid` border-bottom; last option does not

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type predicate TS2677 on useCommunityResults filter**
- **Found during:** Task 1, type-check phase
- **Issue:** `(r): r is RawRow & { image_url: string }` failed TS2677 because `RawRow` has `profiles` as a union type (array | object | null), which is not assignable to the intersection type expected by the predicate
- **Fix:** Changed filter to plain callback `.filter(r => typeof r.image_url === 'string' && ...)` with `r.image_url as string` cast in the map
- **Files modified:** `src/hooks/useCommunityResults.ts`

**2. [Rule 1 - Bug] JSDOM `borderBottom: 'none'` assertion mismatch**
- **Found during:** Task 2, GREEN phase test run
- **Issue:** Test expected `lastButton?.style.borderBottom` to be `'none'` but JSDOM expands the `borderBottom` shorthand property — when unset or set to `'none'`, `style.borderBottom` returns `''` not `'none'`
- **Fix:** Changed assertion to `not.toContain('1px solid')` which correctly captures "no 1px solid border" regardless of JSDOM normalization
- **Files modified:** `src/components/ui/OptionsSheet.test.tsx`

## Self-Check

## Self-Check: PASSED

Files exist:
- src/hooks/useReport.ts: FOUND
- src/hooks/useReport.test.ts: FOUND
- src/hooks/useCommunityResults.ts: FOUND
- src/hooks/useCommunityResults.test.ts: FOUND
- src/components/ui/OptionsSheet.tsx: FOUND
- src/components/ui/OptionsSheet.test.tsx: FOUND

Commits exist:
- babfe1a (task 1): FOUND
- edaa5ef (task 2): FOUND

## Plan 02-06 Import Readiness

All three artifacts are ready for Plan 02-06 (PromptyDetailPage menu wiring):

```typescript
import { useReport } from '@/hooks/useReport'
import { useCommunityResults } from '@/hooks/useCommunityResults'
import { OptionsSheet, type OptionsSheetOption } from '@/components/ui/OptionsSheet'
```
