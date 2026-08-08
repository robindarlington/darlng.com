---
phase: 04-newsletter-fan-capture
plan: 02
subsystem: infra
tags: [listmonk, cors, rate-limiting, deploy-runbook, altcha, documentation]

requires:
  - phase: 04-newsletter-fan-capture
    provides: "Plan 01's env-gated Preact island (PUBLIC_LISTMONK_URL / PUBLIC_LISTMONK_LIST_UUID contract) that this runbook wires up server-side"
provides:
  - "website/DEPLOY.md Section 5: Listmonk endpoint gates, single-CORS-authority rule, and the honest ALTCHA-does-not-cover-this-endpoint bot mitigation with pasteable nginx/Traefik rate-limit recipes"
  - "website/DEPLOY.md Section 4 extension: the three live checks (real signup, mxtoolbox deliverability, bot-posture curl) deferred out of Plan 01's local build"
affects: [ship-readiness]

actuals:
  tokens: 2723
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Doc-only plan: no code, no dependencies — verification is entirely grep-based assertions against committed Markdown prose"

key-files:
  created: []
  modified:
    - website/DEPLOY.md

key-decisions:
  - "Named the source-verified Listmonk config keys (enable_public_subscription_page, security.trusted_urls) explicitly in the runbook text, while hedging only the admin-UI tab/label — per RESEARCH Assumption A1, the config keys are confirmed from source but the UI location was never screenshot-verified against a live instance."
  - "Recommended Listmonk's native Trusted URLs CORS middleware as primary over proxy-level CORS, with proxy-level headers demoted to an explicit fallback that must clear the primary first — matches RESEARCH Pitfall 4's finding that Listmonk registers its own CORS middleware whenever trusted_urls is non-empty, correcting the STATE.md decision that predated that source read."
  - "Documented ALTCHA's real scope (HTML form handler only, never the JSON API) without hedging, and gave the curl-returns-200-is-expected framing in the bot-posture check so an operator doesn't misread a passing endpoint test as a broken mitigation."

patterns-established: []

requirements-completed: [FAN-01]

coverage:
  - id: D1
    description: "DEPLOY.md tells the operator PUBLIC_LISTMONK_URL/LIST_UUID are build-time values requiring a redeploy after being set."
    requirement: FAN-01
    verification:
      - kind: other
        ref: "grep assertion in Task 1 <verify>: PUBLIC_LISTMONK_LIST_UUID count >= 2 in website/DEPLOY.md, plus manual review of Section 5's opening paragraph"
        status: pass
    human_judgment: false
  - id: D2
    description: "DEPLOY.md names exactly one CORS authority and warns duplicate-header breakage from configuring both."
    requirement: FAN-01
    verification:
      - kind: other
        ref: "grep assertion in Task 1 <verify>: 'never (both|two)|not in both|exactly one' matches website/DEPLOY.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "DEPLOY.md states ALTCHA does not protect /api/public/subscription and names proxy rate limiting as the real mitigation, with pasteable nginx and Traefik recipes."
    requirement: FAN-01
    verification:
      - kind: other
        ref: "grep assertions in Task 1 <verify>: limit_req_zone and rateLimit both present; altcha|captcha present"
        status: pass
    human_judgment: false
  - id: D4
    description: "DEPLOY.md lists both endpoint gates (public-subscription-page setting, list Public type) as causes of a 400."
    requirement: FAN-01
    verification:
      - kind: other
        ref: "grep assertions in Task 1 <verify>: enable_public_subscription_page and trusted_urls both present; manual review of Section 5's Endpoint gates checkboxes"
        status: pass
    human_judgment: false
  - id: D5
    description: "DEPLOY.md's post-cutover checklist covers a real signup with two-minute confirmation window, mxtoolbox SPF/DKIM/DMARC, and a manual bot POST."
    requirement: FAN-01
    verification:
      - kind: other
        ref: "grep assertions in Task 2 <verify>: mxtoolbox, 'two minutes'/'2 minutes', double opt-in, and api/public/subscription count >= 2 all present"
        status: pass
    human_judgment: false
  - id: D6
    description: "DEPLOY.md contains no transcribed API key, DKIM key/record, or list UUID anywhere in the file."
    requirement: FAN-01
    verification:
      - kind: other
        ref: "negative grep assertions in both Task <verify> blocks: re_[A-Za-z0-9]{12,}, v=DKIM1|p=MI..., and UUID-shaped hex pattern all absent"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-08-08
status: complete
---

# Phase 4 Plan 2: Newsletter Deploy Runbook Summary

**Extended `website/DEPLOY.md` with a Section 5 newsletter-wiring guide (endpoint gates, single-CORS-authority rule, honest ALTCHA-does-not-cover-this-endpoint posture with nginx/Traefik rate-limit recipes) and a Section 4 live-verification subsection covering the three checks CONTEXT.md deferred to deploy time.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-08T20:41:00Z (approx)
- **Completed:** 2026-08-08T20:56:34Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added `## 5. Newsletter Wiring — Listmonk Public Subscription` to `website/DEPLOY.md`, documenting the two independent endpoint gates (`enable_public_subscription_page`, fan list Public type), the single-CORS-authority rule (Listmonk's native `security.trusted_urls` middleware as primary, proxy-level headers as an explicit fallback), and the honest bot-mitigation posture (ALTCHA covers only the HTML form handler, not this JSON endpoint — honeypot + double opt-in + proxy rate limiting are the real mitigations) with pasteable nginx `limit_req_zone` and Traefik `ratelimit` middleware recipes
- Extended `## 4. Post-Cutover Verification` with a newsletter subsection covering the three live checks deferred from Plan 01: real signup with a two-minute confirmation-email window, mxtoolbox SPF/DKIM/DMARC deliverability, and a direct `curl` POST at the endpoint that correctly expects `200` (not a failure) while verifying the rate limit and double opt-in actually fire
- Tied the bot-posture check explicitly to the 2026-08-08 ROADMAP criterion 3 amendment so an operator reading an older note isn't left hunting for a nonexistent ALTCHA setting on this endpoint
- Zero fabricated or transcribed secrets — every account-specific value is instructed to be copied verbatim from its own dashboard, matching Section 3's existing convention

## Task Commits

1. **Task 1: Newsletter wiring section — endpoint gates, one CORS authority, real bot mitigation** - `a18391f` (docs)
2. **Task 2: Live verification checklist — the three checks this phase deferred** - `16f6b39` (docs)

**Plan metadata:** (pending — recorded after this commit)

## Files Created/Modified
- `website/DEPLOY.md` - Added Section 5 (newsletter wiring: endpoint gates, CORS, bot mitigation, API-surface summary) and extended Section 4 (three deferred live checks); file grew from 197 to 356 lines, unchecked checkbox count grew from 31 to 43

## Decisions Made
- Named both source-verified Listmonk config keys (`enable_public_subscription_page`, `security.trusted_urls`) explicitly in the runbook text so a moved UI label can't block the operator, while hedging only the admin-UI tab/field location per RESEARCH Assumption A1 (config keys confirmed from source, UI placement never screenshot-verified against a live instance).
- Recommended Listmonk's native Trusted URLs CORS middleware as the primary mechanism, demoting proxy-level CORS headers to an explicit fallback that requires clearing the primary first — this corrects STATE.md's earlier "CORS at the proxy layer only" decision, which predated the source read (RESEARCH Pitfall 4) that found Listmonk registers its own app-layer CORS middleware whenever `trusted_urls` is non-empty.
- Framed the bot-posture verification check so a `200` from a direct `curl` POST reads as the expected, correct result rather than a failure — the endpoint has no captcha hook at all (verified from Listmonk source, RESEARCH Pitfall 3), so the check instead verifies the rate limit fires on repetition and the subscriber stays unconfirmed.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' automated `<verify>` grep assertions passed on the first attempt with no rework needed.

## Issues Encountered
None.

## User Setup Required

None from this plan directly — this plan *is* the user-facing runbook. The `user_setup` block in this plan's frontmatter documents that every step in the new Section 5 (Listmonk admin settings, reverse-proxy rate-limit rules) is executed by the operator by hand against a live Listmonk instance that does not yet exist (CONTEXT.md D-03); no `04-USER-SETUP.md` was generated because `website/DEPLOY.md` already is that document.

## Next Phase Readiness
- `website/DEPLOY.md` now fully covers the newsletter's server-side wiring end-to-end: an operator with a bare Listmonk instance can follow Section 2 (list + env vars) → Section 5 (endpoint gates, CORS, rate limiting) → Section 4's newsletter subsection (live verification) without guessing at a single setting.
- Phase 4 (Newsletter Fan Capture) is now complete across both plans: Plan 01 shipped the working island and mock-tested state machine; Plan 02 shipped the deploy runbook that makes it live-verifiable. No further plans are scoped for this phase.
- No blockers. The ROADMAP criterion 3 amendment (2026-08-08, ALTCHA → honeypot + double opt-in + rate limiting) is now fully operationalized in the runbook, closing the gap RESEARCH flagged as an open question.

---
*Phase: 04-newsletter-fan-capture*
*Completed: 2026-08-08*

## Self-Check: PASSED
- FOUND: website/DEPLOY.md
- FOUND commit: a18391f
- FOUND commit: 16f6b39
