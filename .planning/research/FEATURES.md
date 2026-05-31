# Feature Research

**Domain:** Credit economy + in-app AI image generation for a prompt-library app
**Researched:** 2026-05-31
**Confidence:** MEDIUM-HIGH (credit patterns and UX from live industry sources; anti-abuse from verified implementations; Promptys-specific coupling from direct codebase inspection)

---

## Scope

This research covers ONLY the new v0.3.0 features. Existing features (feed, copy, save/rate, gamification points/levels L1–L5, create/publish, search, reporting) are NOT re-researched.

New features:
1. Credit ledger (`credit_events`) + cached balance (`profiles.credits`)
2. Signup bonus (+1 credit, idempotent, via `handle_new_user`)
3. Earn credits by contributing (level-up, publish, submit quality result) with anti-abuse caps
4. In-app image generation that spends 1 credit (provider-agnostic Edge Function adapter)
5. Credit refund on provider failure

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any credit-gated generation system. Missing these = the system feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visible credit balance in UI | Users need to know what they have before spending; any credit system without a balance display loses trust immediately | LOW | Small persistent indicator in header/profile; updates after each transaction; no polling needed — update from response payload |
| Signup bonus (1 credit, instant, automatic) | Sets the hook: "you signed up and immediately have something real to spend" is the conversion moment; industry standard is 1-25 free credits on signup | LOW | Must be idempotent — `ON CONFLICT DO NOTHING` exactly as `point_events` already does; fires in `handle_new_user` trigger; no separate signup flow |
| Atomic debit before generation starts | Credit deducted at request time, not after success; prevents race conditions and double-spend; industry consensus | MEDIUM | Edge Function must debit first, then call provider; if debit fails (insufficient balance), return error immediately without calling provider |
| Automatic refund on provider failure | Users expect to never be charged for a broken generation; Photoroom, Luma AI, PixAI all do this automatically | MEDIUM | Refund is a `credit_events` row with `event_type = 'refund_provider_failure'`, `amount = +1`; atomicity critical — use Postgres transaction or compensating insert in Edge Function error path |
| Loading state with time expectation during generation | AI image gen takes 5–20s; showing a spinner with no context causes users to refresh/abandon; users tolerate latency if informed | LOW | Progress indicator + estimated range ("~10 seconds"); pulse/skeleton animation; do NOT use generic spinner |
| Display generated image in-context (on the prompty that triggered it) | Result shown immediately after generation completes; user should not have to navigate away to see their image | LOW | Display inline below the generate button or in a result panel; full-size preview on tap |
| Zero-balance nudge (earn-more path, not hard paywall) | Hard paywalls on free apps with engagement-based earning cause drop-off; industry pattern is soft nudge with clear earn path | LOW | Show remaining balance; when 0, show "Earn more by [contributing]" with specific action, not a purchase CTA |
| CTA for anonymous users pointing to signup | Anon users see the generate button disabled with "Create an account and get 1 free credit"; conversion-focused | LOW | Already specified in PROJECT.md; the message must be specific (1 credit, not just "sign up") |

### Differentiators (Competitive Advantage)

Features that fit Promptys' specific model and would not be expected from a generic image generator.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Credits earned through contribution, not purchase | Aligns with Promptys' community-library identity; rewards the behaviors that make the library better; reinforces the L1→L2→L3 progression loop | MEDIUM | Tied to existing `point_events` triggers; mirrors the same append-only ledger pattern; earning events: level-up (L2: +2, L3: +3), publish approved prompty (+2), submit approved result (+1); caps per-event-per-day prevent farming |
| Generation scoped to the current prompty's template | "Generate with this prompt" is contextual — the prompt fills in automatically; user isn't starting from a blank text box | LOW | Edge Function receives `prompty_id`; server resolves the prompt template (including variable substitution if any) rather than trusting client-sent prompt text |
| Generated result can be submitted as community result | Generated image can go straight into `prompty_tests` as an L2 contribution; closes the loop from generation → community validation | MEDIUM | Optional "Submit as community result" action on the result display; reuses existing `prompty_tests` + `prompty_results` flow; earns back 1 credit if approved |
| Provider-agnostic adapter (swappable without UI changes) | No commitment to one vendor during MVP; cost/quality optimization later; if Gemini adds native API, swap in one file | MEDIUM | Edge Function takes `PROVIDER` env secret; adapter interface: `generate(prompt: string, options) → { url: string }` |
| Latency transparency (model-specific estimate) | Show "~8s" vs "~15s" depending on the active provider config; reduces abandonment during wait | LOW | Provider config in Edge Function can expose an `estimated_latency_ms` metadata field; UI shows the estimate |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Credit purchase / top-up ("buy more credits") | Users at zero balance; natural monetization path | Introduces payment infrastructure, IAP (Google Play / Apple required for in-app purchase on mobile), refund policy complexity, tax handling — all out of scope for MVP; also contradicts "gratuito, calmo, limpo" brand identity | Earn-more mechanics only in v0.3.0; purchase path deferred explicitly to a future milestone with full monetization decision |
| Quality-based refund requests (user marks result "bad") | Users feel entitled to a refund when the AI produces a poor image | Creates a support burden, is easily abused (every generation can be marked "bad"), and is subjective; Photoroom has this but requires manual approval; at 1 credit cost the economics don't justify the complexity | Auto-refund only on technical/provider failure; for quality dissatisfaction, offer "Regenerate" (spends another credit) |
| Storing generated images server-side long-term | Users may want to access their generation history | Storage cost on free Supabase tier; moderation burden for AI-generated content; copyright ambiguity for AI outputs; history feature requires additional table + CDN + retention policy | Generate and return URL; user saves to device manually via OS share sheet; optional "Submit as community result" is the only server-side persistence path |
| Daily login bonus credits | "Log in every day and earn" is common in games | Creates artificial inflation; incentivizes hollow engagement (open app, close); clashes with Promptys' "gratuito, calmo" identity; makes the economy unpredictable | Earn credits only via actions that directly improve the library (publish, submit quality result, level-up) |
| Referral credits ("invite a friend, earn 1 credit") | Standard growth mechanic | Multi-account farming via self-referral is the #1 abuse vector for referral programs; enforcement requires phone verification or payment method, both out of scope for MVP | Skip referral in v0.3.0; contribution-based earning is the safer growth lever |
| Real-time balance push / WebSocket subscriptions | Credits change server-side (trigger); client should see new balance immediately | Supabase Realtime adds connection overhead for a value that changes infrequently; sufficient to refetch profile after every credit-consuming or credit-earning action | Refetch `profiles.credits` from Edge Function response payload after generate; from point-of-earn in the trigger response flow |
| Multiple images per generation (batch/grid) | Power users want options; Midjourney-style 4-up grid is popular | Costs 4x provider budget per request; at 1-credit-per-generation the math doesn't work; confusing UX for L1/L2 users | Single image per generation; "Regenerate" is the variation mechanism |

---

## Feature Dependencies

```
[Credit Ledger: credit_events + profiles.credits]
    └──required by──> [Signup Bonus]
    └──required by──> [In-app Generation (debit)]
    └──required by──> [Credit Refund on Failure]
    └──required by──> [Earn Credits on Contribution]
    └──required by──> [Balance Display UI]

[Earn Credits on Contribution]
    └──requires──> [Credit Ledger]
    └──depends on──> [point_events trigger pattern] (existing — mirrors, does not modify)
    └──depends on──> [Level-up events: unlock_events] (existing table, new trigger reads it)
    └──depends on──> [Publish trigger: trg_points_on_publish] (existing — analogous credit trigger is new)
    └──depends on──> [prompty_tests: submit result] (existing table — approved result triggers credit)

[In-app Generation]
    └──requires──> [Credit Ledger] (debit must succeed before provider call)
    └──requires──> [Supabase Edge Function] (provider API key must not reach anon client)
    └──requires──> [Provider Adapter] (swappable — Gemini/OpenAI/Replicate)
    └──enhances──> [Earn Credits on Contribution] (generated image → submit as result → earn credit back)

[Credit Refund on Failure]
    └──requires──> [In-app Generation] (only arises when generation is attempted)
    └──requires──> [Credit Ledger] (refund is a +1 credit_event row)

[Balance Display UI]
    └──requires──> [Credit Ledger] (profiles.credits cache column)
    └──enhances──> [Zero-balance Earn-more CTA]

[Zero-balance Earn-more CTA]
    └──requires──> [Balance Display UI]
    └──enhances──> [Earn Credits on Contribution] (tells user exactly what to do)

[Anonymous CTA → Signup]
    └──independent of credit ledger] (rendered server-side from auth state alone)
    └──enhances──> [Signup Bonus] (anon sees "1 free credit" before signing up)
```

### Dependency Notes

- **Credit Ledger must be Phase 4** (first phase): every other credit feature depends on `credit_events` + `profiles.credits` existing. No other feature can be built in parallel before the ledger is live.
- **Earn on contribution depends on existing unlock_events / publish / test triggers** but does NOT modify them. New credit triggers are additive `AFTER INSERT` on existing events (level-up row in `unlock_events`, publish row in `point_events` or `promptys`, approved test row in `prompty_tests`). The existing gamification system is untouched.
- **In-app Generation requires Edge Function** because the provider API key must never reach the Supabase anon key client. This is the one exception to "no backend" in the PROJECT.md constraints, already pre-approved in Key Decisions.
- **Generated image → community result** is an enhancement with no hard dependency; it can be deferred to a later phase if time-boxed.

---

## Anti-Abuse Coverage

This section is explicit per the research scope because anti-abuse is a first-class requirement.

### One-Bonus-Per-Account (Signup Credit)

**Mechanism:** `ON CONFLICT DO NOTHING` in the `credit_events` insert inside `handle_new_user`. The unique constraint is `(user_id, event_type)` where `event_type = 'signup_bonus'`. A second trigger fire (e.g., on profile re-creation) produces no duplicate row.

**Farming risk:** New email accounts. Mitigation in MVP: no phone/payment verification (out of scope); rely on friction (email confirmation) + per-account caps rather than identity verification. The signup bonus is 1 credit — the farming yield per fake account is low enough that bulk farming is not economical at this scale.

### Daily Caps on Contribution Credits

Each contribution-based credit event has a daily cap enforced server-side (same pattern as `award_points_on_like` which already implements `COUNT... WHERE created_at::date = CURRENT_DATE`).

Recommended caps for v0.3.0:
- Level-up bonus: once per level event (naturally bounded — only 4 level-ups possible per account lifetime)
- Publish approved prompty: max 2 credit awards per day per user
- Submit approved result: max 3 credit awards per day per user

**These caps are enforced in SECURITY DEFINER trigger functions, not in frontend code.** Frontend cannot bypass them.

### Rate Limiting on Generation

The Edge Function enforces server-side:
- Max 5 generations per user per 24-hour window (tracked via `credit_events` count query)
- Max 2 concurrent requests per user (enforced via a `generation_in_progress` flag or by checking for un-resolved pending rows)

This prevents a script that acquires credits and burns them in rapid succession.

### Client-Side Validation Is Insufficient

The industry post-mortem pattern is clear: "We trusted client-side validation. Bots drained our credits in 3 hours." (Medium/CodeToDeploy, 2026). All balance checks, debit logic, and cap enforcement happen exclusively in the Edge Function and SECURITY DEFINER triggers. The frontend only reads `profiles.credits` for display — it never writes to `credit_events`.

### Multi-Account Detection (Future)

Not in v0.3.0 scope. At 1 credit = 1 generation, the abuse yield is low. If abuse becomes measurable, next steps are: device fingerprint correlation (Tauri native), email domain blocking for known disposable providers, or admin-flagged suspicious accounts via the existing `profiles.is_admin`-adjacent moderation path.

---

## Loading UX for AI Image Generation (5–20s Latency)

### What the research shows

- Modern image generation latency ranges from ~3s (small models, GPU-cached) to ~20s (high-quality models, cold start). The 5–20s range in the project scope is realistic and consistent with industry data.
- Users tolerate up to ~20s if given a clear progress indicator with a time estimate. Without an estimate, abandonment rises sharply after ~5s.
- The critical UX mistake is a blank spinner — users interpret it as "the app is frozen" and tap away.

### Required Loading UX (Table Stakes)

1. **Immediately disable the generate button** when tapped — prevent double-submission before the Edge Function confirms the debit.
2. **Show a progress/skeleton state** in the result area: animated placeholder the same size as the expected image.
3. **Show a time estimate**: "Generating... (~10 seconds)" — use the provider adapter's `estimated_latency_ms` metadata.
4. **Do NOT navigate away** during generation — the user stays on the prompty detail page; the result appears inline.
5. **On completion**: animate the image in (fade-in or reveal transition); show action buttons (Save to device, Share, Submit as community result) below the image.
6. **On failure**: show inline error message + automatic refund confirmation ("Your credit was returned") in the same area, not a modal.

### Regenerate UX

- "Regenerate" button appears after result is shown (costs 1 more credit; balance shown inline).
- Tapping Regenerate replaces the current result — user sees the same loading state again.
- The previous result is NOT preserved server-side (no history in v0.3.0).

---

## Generated Image Storage and Attribution

### Storage strategy for v0.3.0

**Do NOT store generated images in Supabase Storage** unless the user explicitly submits them as a community result. The Edge Function returns a URL (provider-hosted CDN URL or base64 for small images) and the client renders it directly. The user saves to their device via Tauri's native share/save API.

**Rationale:**
- Free Supabase storage tier: 1 GB; AI-generated images can be 500KB–2MB each; even a few hundred generations fills the tier.
- Moderation burden: server-side storage of AI-generated content requires a moderation pipeline.
- The existing `prompty_tests.image_url` path already handles the "submit as community result" case with the `prompty-results` storage bucket.

### Attribution

- Generated images carry no copyright (U.S. Copyright Office position confirmed 2025: AI-generated images without substantial human creative input are not copyrightable).
- No watermark needed in v0.3.0 (not required by any provider at this scale).
- When submitted as community result, the `prompty_tests` row records `user_id` — attribution is to the submitter, not the provider.

---

## MVP Definition

### Launch With (v0.3.0)

- [x] Credit ledger: `credit_events` table (append-only, SECURITY DEFINER, never client-writable) + `profiles.credits` cached balance column
- [x] Signup bonus: +1 credit in `handle_new_user`, idempotent via `ON CONFLICT DO NOTHING` on `(user_id, 'signup_bonus')`
- [x] Balance display: credit counter in profile header / top nav, updates after each transaction
- [x] Earn credits on contribution (level-up, publish, approved result) with server-side daily caps
- [x] In-app generation: Edge Function with provider-agnostic adapter; atomic debit; returns image URL
- [x] Auto-refund on provider failure: compensating `credit_events` row in Edge Function error path
- [x] Loading UX: progress skeleton + time estimate; inline result display; inline error + refund confirmation
- [x] Zero-balance earn-more nudge: specific message listing the earning actions (not a purchase CTA)
- [x] Anonymous CTA: "Create an account, get 1 free credit" in place of the generate button

### Add After Validation (v0.3.x)

- [ ] Generated image → submit as community result (one-tap submit path from result view) — trigger: if users are generating but not submitting, closing the loop increases community content
- [ ] Per-provider latency calibration in UI — trigger: once a provider is chosen and generation latency data is available
- [ ] Daily generation remaining counter ("3 of 5 generations used today") — trigger: if abuse becomes a support issue

### Future Consideration (v1.x+)

- [ ] Credit purchase / top-up — trigger: explicit monetization milestone decision; requires IAP integration (Google Play / App Store) + payment processor; cannot be added without brand/legal decisions
- [ ] Credit gifting / transfer between users — trigger: social mechanics milestone
- [ ] Generation history page — trigger: users consistently request it; requires storage + moderation strategy decision
- [ ] Referral program — trigger: organic growth plateau; requires identity verification (phone) to prevent self-referral abuse

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Credit ledger (foundation) | HIGH | MEDIUM | P1 |
| Signup bonus | HIGH | LOW | P1 |
| Balance display UI | HIGH | LOW | P1 |
| In-app generation (Edge Function + adapter) | HIGH | MEDIUM | P1 |
| Auto-refund on failure | HIGH | LOW | P1 |
| Generation loading UX (skeleton + estimate) | HIGH | LOW | P1 |
| Zero-balance earn-more nudge | MEDIUM | LOW | P1 |
| Anonymous CTA → signup | MEDIUM | LOW | P1 |
| Earn credits on contribution | MEDIUM | MEDIUM | P1 |
| Anti-abuse daily caps (server-side) | HIGH | LOW | P1 — must ship with contribution earning |
| Submit generated image as community result | MEDIUM | LOW | P2 |
| Per-provider latency estimate in UI | LOW | LOW | P2 |
| Generation history | LOW | HIGH | P3 |
| Credit purchase | LOW (brand risk) | HIGH | P3 |

---

## Dependencies on Existing Gamification System

The credit system mirrors the `point_events` pattern but does NOT replace or modify it. The two ledgers coexist:

| Aspect | point_events (existing) | credit_events (new) |
|--------|------------------------|---------------------|
| Table | `point_events` | `credit_events` |
| Cache | `profiles.points` + `profiles.level` | `profiles.credits` |
| Writes | SECURITY DEFINER triggers only | SECURITY DEFINER triggers + Edge Function |
| Frontend writes | Blocked by RLS | Blocked by RLS |
| Idempotency | `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` | Same pattern |
| Balance recalc | `update_profile_points(user_id)` function | New `update_profile_credits(user_id)` function |
| Debit | N/A (points only ever increase) | New: negative `amount` rows for generation spend |
| Refund | N/A | New: positive `amount` row with `event_type = 'refund'` |

**Coupling points:**
- `award_credits_on_levelup`: fires AFTER INSERT on `unlock_events` (existing table, new trigger)
- `award_credits_on_publish`: fires AFTER INSERT on `point_events WHERE event_type = 'publish'` OR AFTER INSERT on `promptys WHERE status = 'published'` (analogous to existing `trg_points_on_publish`)
- `award_credits_on_approved_result`: fires AFTER UPDATE on `prompty_tests WHERE approved = true` (existing column, new trigger)

The existing triggers (`trg_points_on_publish`, `trg_points_on_test`, etc.) are untouched. Credit award triggers are additive, listening to the same source events.

---

## Sources

- Stigg: "We Built AI Credits and it Was Harder Than We Expected" — https://www.stigg.io/blog-posts/weve-built-ai-credits-and-it-was-harder-than-we-expected (ledger design, idempotency, real-time enforcement, balance transparency)
- Kinde: "Freemium to Premium: Converting Free AI Tool Users with Smart Billing Triggers" — https://www.kinde.com/learn/billing/conversions/freemium-to-premium-converting-free-ai-tool-users-with-smart-billing-triggers/ (zero-balance UX, soft vs hard paywall, earn-more nudge)
- Photoroom Help: "Refund AI credits for unsuccessful generations" — https://help.photoroom.com/en/articles/14737019-refund-ai-credits-for-unsuccessful-generations (auto-refund on failure as table stakes)
- Luma AI Help: "Credit refund, failed generation" — https://lumaai-help.freshdesk.com/support/solutions/articles/151000223091 (automatic credit return industry standard)
- PixAI: "Refund Policy for Failed Generation Tasks" — https://pixai.art/articles/en/pixai-refund-policy-for-failed-generation-tasks (conditions for auto-refund)
- Shape of AI: Variations pattern — https://www.shapeof.ai/patterns/variations (result display UX: grid, regenerate, branch)
- Medium/CodeToDeploy: "We Trusted Client-Side Validation. Bots Drained Our Credits in 3 Hours." — https://medium.com/codetodeploy/we-trusted-client-side-validation-bots-drained-our-credits-in-3-hours-0eb10a89cd43 (server-side enforcement imperative)
- GeeTest: "Bonus Abuse in 2025: Types, Risks & Prevention Strategies" — https://www.geetest.com/en/article/bonus-abuse-in-2025-types-risks-prevention-strategies (multi-account, device spoofing, self-referral patterns)
- AIJourn: "Free AI Image Generators in 2026: What You Actually Get Without Paying" — https://aijourn.com/free-ai-image-generators-in-2026-what-you-actually-get-without-paying/ (market context: free tier competition)
- Dodo Payments: "How to Add Credits-Based Billing to Your AI App" — https://dodopayments.com/blogs/add-credits-billing-ai-app (credit lifecycle, warning on zero balance)
- Freemius: "AI app pricing models: Subscription, credits, or hybrid?" — https://freemius.com/blog/ai-app-pricing-model/ (credit model for variable/bursty usage)
- WaveSpeed: "Complete Guide to AI Image Generation APIs in 2026" — https://wavespeed.ai/blog/posts/complete-guide-ai-image-apis-2026/ (latency, queue design)
- Direct codebase inspection: `/supabase/migrations/` — `point_events` schema, `handle_new_user` trigger, `award_points_on_like` daily cap pattern, `update_profile_points` function (HIGH confidence — source of truth for existing patterns)

---
*Feature research for: Promptys v0.3.0 — Credits + In-app Image Generation*
*Researched: 2026-05-31*
