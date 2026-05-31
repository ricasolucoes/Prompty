---
phase: 5
slug: ganhar-creditos-contribuindo
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-31
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | psql SQL smoke scripts (`supabase/tests/`, pattern from Phase 4) |
| **Config file** | none — direct `psql "$DATABASE_URL" -f <file>` |
| **Quick run command** | `psql "$DATABASE_URL" -f supabase/tests/earn01_level_up.sql` |
| **Full suite command** | `for f in supabase/tests/earn0*.sql; do psql "$DATABASE_URL" -f "$f"; done` (+ Phase 4 `cred0*` regression) |
| **Estimated runtime** | ~10s |

---

## Sampling Rate

- **After every task commit:** quick psql smoke for the trigger being written
- **After every plan wave:** full `earn0*.sql` suite
- **Before `/gsd:verify-work`:** full `earn0*` + `cred0*` (Phase 4 regression) green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Req | Behavior | Test Type | Automated Command | File Exists | Status |
|-----|----------|-----------|-------------------|-------------|--------|
| EARN-01 | Level-up awards +2; duplicate unlock row does not double-award | SQL smoke | `psql "$DATABASE_URL" -f supabase/tests/earn01_level_up.sql` | ❌ W0 | ⬜ pending |
| EARN-02 | Publish awards +1; repeated UPDATE on same prompty does not double-award | SQL smoke | `psql "$DATABASE_URL" -f supabase/tests/earn02_publish.sql` | ❌ W0 | ⬜ pending |
| EARN-02 | Lifetime cap 20: 21st publish gives no credit | SQL smoke | included in earn02 | ❌ W0 | ⬜ pending |
| EARN-03 | Approved result awards +1; daily cap stops at 10 | SQL smoke | `psql "$DATABASE_URL" -f supabase/tests/earn03_approved_result.sql` | ❌ W0 | ⬜ pending |
| EARN-03 | Non-approved result (approved=false) gives no credit | SQL smoke | included in earn03 | ❌ W0 | ⬜ pending |
| EARN-04 | point_events row count unchanged after all three credit triggers fire | SQL smoke | `psql "$DATABASE_URL" -f supabase/tests/earn04_no_interference.sql` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `supabase/tests/earn01_level_up.sql` — EARN-01 (+2 delta + idempotency on ref_id)
- [ ] `supabase/tests/earn02_publish.sql` — EARN-02 (ON CONFLICT + lifetime cap 20)
- [ ] `supabase/tests/earn03_approved_result.sql` — EARN-03 (daily cap 10 + approved=false guard)
- [ ] `supabase/tests/earn04_no_interference.sql` — EARN-04 (point_events count before == after)

*Reuses the `supabase/tests/` dir + smoke pattern created in Phase 4 (04-01). No new framework.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| credit_events event_type CHECK constraint actual name before DROP/ADD | EARN-02 | PostgreSQL auto-names inline CHECK; verify at apply time | Run `SELECT conname FROM pg_constraint WHERE conrelid='credit_events'::regclass AND contype='c';` and use the real name in the ALTER |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
