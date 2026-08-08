---
phase: 04-newsletter-fan-capture
verified: 2026-08-08T23:45:00Z
status: passed
score: 22/23 must-haves verified
behavior_unverified: 1
overrides_applied: 0
deferred:
  - truth: "Submitting a real email at https://darlng.com delivers a confirmation email within two minutes (ROADMAP SC1)"
    addressed_in: "User's deploy step (website/DEPLOY.md Section 4, newsletter subsection)"
    evidence: "CONTEXT.md D-03: 'Live checks (real confirmation email, mxtoolbox, live bot POST) deferred to the user's deploy step, documented in DEPLOY.md.' No live Listmonk instance exists yet. DEPLOY.md contains the exact runbook step for this check."
  - truth: "SPF, DKIM, and DMARC DNS records pass mxtoolbox.com verification (ROADMAP SC4)"
    addressed_in: "User's deploy step (website/DEPLOY.md Section 4, newsletter subsection)"
    evidence: "Same D-03 deferral; DEPLOY.md names mxtoolbox explicitly and cross-references Section 3's DNS step."
behavior_unverified_items:
  - truth: "The client:visible hydration window is imperceptible in practice: before the section scrolls into view the submit button is disabled with styling identical to its enabled state, and it reports enabled once the section is in view (04-03 backstop truth)."
    test: "Throttle the network to slow-3G in browser devtools, load the live page, scroll rapidly to the newsletter section, and attempt to click the submit button during the hydration window."
    expected: "The button never visibly 'flickers' or looks broken; a click during the disabled window produces no error and no dead-click feedback; the button becomes clickable within a perceptually-instant window once scrolled into view."
    why_human: "This is a perceptual/timing judgment (04-UI-SPEC.md's own 🧪 backstop row) that no automated assertion can certify — the machine-checkable half (disabled=true pre-scroll, disabled=false post-scroll+hydrate) was independently re-verified live in this session and passed, but 'imperceptible in practice' requires a human eye on a throttled connection."
human_verification:
  - test: "Throttle to slow-3G, scroll to #newsletter rapidly, and attempt to click the submit button before hydration completes."
    expected: "No visible flicker/broken state; button becomes usable within a perceptually instant window."
    why_human: "04-UI-SPEC.md's own backstop row; perceptual judgment, not machine-checkable."
  - test: "Review and sign off on the 8 flagged FAN-01/FAN-02 prohibition statements across 04-01/04-02/04-03 (transparency, privacy, safety categories) — see 'Prohibitions' section below for this verifier's non-authoritative evidence-backed judgment on each."
    expected: "A human confirms each prohibition's disposition is acceptable before shipping."
    why_human: "Per verification-overrides policy, judgment-tier prohibitions always route to an end-of-phase human checkpoint rather than a silent pass, regardless of how strong the automated evidence looks."
  - test: "Decide whether the unreferenced dist/_astro/NewsletterForm*.js chunk in the env-unset production build (present on disk, never referenced by any HTML, confirmed unreachable by any browser) needs a dedicated future fix, or is an acceptable disk-hygiene trade-off."
    expected: "A human accepts or rejects 04-03's own documented architectural finding (Astro's static client-bundle discovery runs before the SSR phase and cannot see the always-false JS conditional)."
    why_human: "04-03-SUMMARY.md explicitly raises this as 'one open item for a human to weigh in on'; this verifier independently reproduced the finding (see Artifacts/Anti-Patterns below) and concurs it has zero browser-observable impact, but did not treat that concurrence as authoritative sign-off."
---

# Phase 4: Newsletter Fan Capture Verification Report

**Phase Goal (ROADMAP.md, verbatim):** "A fan can submit their email on the homepage newsletter
section, receive a double opt-in confirmation email from Listmonk, and confirm their subscription —
with ALTCHA spam protection active and CORS correctly configured so cross-origin form submission
works from the live darlng.com domain."

**Verified:** 2026-08-08T23:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

> **Mode note (informational, not a gap):** ROADMAP.md marks this phase `Mode: mvp`, which normally
> requires a User Story-formatted goal (`As a … I want to … so that …`). The Phase 4 Goal line above is
> a capability statement, not a user story — 04-01-PLAN.md's own "MVP note" already surfaced this
> exact discrepancy at planning time and deliberately did not invent a user-story rewrite. This
> verifier did not block on it (the gap was already knowingly accepted upstream, and blocking a
> completed phase's verification over ROADMAP wording would not change any code). Flagged here for
> visibility only.

## Goal Achievement

This verification independently re-ran (not merely re-read) every automatable check: `npx astro
check`, `npm run check` (astro check + 9-pair contrast gate), both directions of the production build
gate, and a full live-browser sweep via `agent-browser` against a freshly-started mock Listmonk server
and Astro dev server — success, validation error, honeypot (with zero mock-log entries), network
failure (offline), double-submit guard (rapid double-click), already-subscribed on repeat submit,
`aria-live`/`role="status"` wiring, focus-on-error, zero-CLS at 375px and 768px, and the pre-hydration
disabled→enabled button transition. All results below reflect this session's own runs, not SUMMARY.md
narration.

### Observable Truths — 04-01 (Island + mock)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Valid email submit → exact copy "Check your inbox to confirm." with no reload | ✓ VERIFIED | Live browser test this session: status region text = "Check your inbox to confirm." / "We just sent a confirmation link — click it and you're on the list."; button label "You're in ✓" |
| 2 | In-flight concurrency guard — at most one POST per submit | ✓ VERIFIED | Live rapid double-click test: mock log gained exactly 1 line. `NewsletterForm.tsx:57-61` uses a synchronous `inFlightRef` guard (code-review WR-01 fix), independently re-confirmed live |
| 3 | Malformed/empty email → "Enter a valid email address." + zero requests | ✓ VERIFIED | Live test: status text matched, `aria-invalid="true"` on input, mock log line count unchanged (0 new lines) |
| 4 | Fetch failure/timeout/non-2xx → "Something went wrong. Try again in a moment." + re-enable | ✓ VERIFIED | Live test with browser set offline: status text matched, both input and button reported `enabled` after |
| 5 | Synthetic already-subscribed signal → "You're already on the list." | ✓ VERIFIED | Live test: same email submitted twice, second submit's status text = "You're already on the list.", button = "Already subscribed" |
| 6 | Filled honeypot → identical success state, zero requests | ✓ VERIFIED | Live test: honeypot filled via dispatched input event, status text identical to genuine success, mock log unchanged. `NewsletterForm.tsx:63-78` checks honeypot first (independent of email validity, post code-review WR-02 fix) and adds a randomized 400-900ms delay to mask the timing side-channel |
| 7 | Env-unset at build time → whole section absent | ✓ VERIFIED | `rm -rf dist && npm run build` (no env vars) this session: `grep 'id="newsletter"' dist/index.html` and `grep 'New Music, No Schedule.' dist/index.html` both return no match |
| 8 | `npm run build` and `npm run check` exit 0 with both env vars unset | ✓ VERIFIED | Both commands run this session, exit 0. `npm run check` output: 0 errors, 0 warnings, 1 pre-existing unrelated hint; 9/9 contrast pairs PASS |

**Score:** 8/8 verified

### Observable Truths — 04-02 (DEPLOY.md runbook)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | DEPLOY.md tells operator PUBLIC_LISTMONK_URL/LIST_UUID are build-time, requiring redeploy | ✓ VERIFIED | `PUBLIC_LISTMONK_LIST_UUID` appears 4× in DEPLOY.md; Section 5 opening paragraph states build-time baking + redeploy requirement (manually reviewed) |
| 2 | Names exactly one CORS authority, warns of duplicate-header breakage | ✓ VERIFIED | `grep -qiE 'never (both|two)|not in both|exactly one'` matches; Section 5 CORS subsection reviewed — states the rule, names `security.trusted_urls` as primary, proxy fallback explicitly requires clearing the primary first |
| 3 | States ALTCHA doesn't protect the subscription endpoint; names rate limiting with concrete recipe | ✓ VERIFIED | `altcha\|captcha` match found; `limit_req_zone` (nginx) and `rateLimit` (Traefik) both present as pasteable recipes |
| 4 | Lists both endpoint gates as causes of a 400 | ✓ VERIFIED | `enable_public_subscription_page` and `trusted_urls` (via list-Public-type + settings) both present, with an explicit troubleshooting line (manually reviewed) |
| 5 | Post-cutover checklist covers real signup (2-min window), mxtoolbox, manual bot POST | ✓ VERIFIED | `mxtoolbox`, `two minutes`, `double opt-in`, `api/public/subscription` (×4) all present; 2026-08-08 amendment date present, tying the bot-posture check to the amended ROADMAP criterion |
| 6 | No transcribed API key, DKIM key/record, or list UUID anywhere in the file | ✓ VERIFIED | Negative greps for Resend-key shape, DKIM value shape, and UUID shape all return no match, re-run this session |

**Score:** 6/6 verified

### Observable Truths — 04-03 (Browser evidence sweep + build gates)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Screenshot evidence: all 6 states at 375/1440px, 3 states at 768px | ✓ VERIFIED | 22 PNGs found under `/tmp/darlng-phase4/` this session (exceeds the 15 required), all >1KB; includes the exact 15-file required set (`375-*`, `768-idle/success/error-validation`, `1440-*`) plus post-fix re-verification screenshots from the code review pass |
| 2 | Zero layout shift idle→success | ✓ VERIFIED | Independently re-tested this session at both 375px (BEFORE=3100, AFTER=3100) and 768px (BEFORE=1826, AFTER=1826) — byte-identical `offsetTop` |
| 3 | Status region carries `role="status"` and `aria-live="polite"` | ✓ VERIFIED | Live `get attr` this session: `role` = "status", `aria-live` = "polite" |
| 4 | Double-click while POST in-flight → exactly one log line | ✓ VERIFIED | Live rapid double-click this session: mock log = 1 line |
| 5 | Same email twice → already-subscribed on second submit | ✓ VERIFIED | Live test this session (shared with 04-01 truth #5) |
| 6 | Env-set production build emits section + exactly one island chunk | ✓ VERIFIED | This session: `dist/index.html` contains `id="newsletter"` and the heading copy; exactly one `dist/_astro/NewsletterForm.*.js` file present |
| 7 | Env-unset production build emits neither section nor island chunk | ⚠ VERIFIED WITH DOCUMENTED DEVIATION | Section/heading absence confirmed this session (both greps return no match). The literal "no island chunk" half does NOT hold on disk: `find dist/_astro -name 'NewsletterForm*.js'` still returns one file (`NewsletterForm.BUOI5ER0.js` in this session's rebuild). This exact deviation is documented in 04-03-SUMMARY.md (finding D9) as an inherent Astro architecture limitation (client-bundle discovery is a static template scan that runs before the SSR/env-conditional phase), independently reproduced by three escalating tests in that SUMMARY. This verifier re-confirmed the substantive safety property instead: `grep -rl "NewsletterForm" dist/*.html dist/listen/*/*.html dist/404.html` returns nothing (exit 1) — no HTML anywhere in the env-unset build ever references or loads the chunk, so no browser can ever fetch or execute it. Per this verification task's explicit instruction, this on-disk orphan is treated as documented+accepted, not a gap. Routed to human sign-off below rather than silently passed. |
| 8 | Neither the mock server script nor test artifacts appear under dist/ | ✓ VERIFIED | `find dist -iname '*mock-listmonk*'` returns nothing, this session |
| 9 | (backstop) `client:visible` hydration window imperceptible in practice | ⚠ PRESENT_BEHAVIOR_UNVERIFIED | Machine-checkable half re-verified live this session (disabled=true before scroll, disabled=false after scroll+hydrate). The "imperceptible in practice" (slow-3G + click-during-hydration) half is explicitly a human/perceptual judgment per 04-UI-SPEC.md's own 🧪 backstop marker — routed to human verification, not counted toward the verified score |

**Score:** 8/9 verified, 1 behavior-unverified (backstop)

### Overall Score

22/23 must-haves verified across all three plans (8+6+8), 1 present-but-behavior-unverified (the
UI-SPEC's own pre-declared backstop item). Zero truths FAILED.

### Deferred Items (ROADMAP Success Criteria)

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | Real confirmation email delivered within 2 minutes from live `https://darlng.com` (ROADMAP SC1) | DEPLOY.md Section 4 (newsletter subsection) | CONTEXT.md D-03: explicitly deferred to the user's deploy step; no live Listmonk instance exists. DEPLOY.md contains the exact runbook step. |
| 4 | SPF/DKIM/DMARC pass mxtoolbox.com (ROADMAP SC4) | DEPLOY.md Section 4 (newsletter subsection) | Same D-03 deferral; DEPLOY.md names mxtoolbox and cross-references the DNS section. |

ROADMAP SC2 (distinct visible states) and SC3 (bot mitigation, amended 2026-08-08) are both fully
covered by the local/code-level truths above — not deferred.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `website/src/components/NewsletterForm.tsx` | Preact island: input, honeypot, submit, aria-live region, full 6-state machine | ✓ VERIFIED | 234 lines; contains `list_uuids`; all 6 states implemented and live-tested this session; wired into `index.astro` |
| `website/scripts/mock-listmonk.mjs` | Zero-dep `node:http` mock with CORS preflight, error/already-subscribed triggers, request log | ✓ VERIFIED | Present, exercised live this session (204 OPTIONS, 200/500 POST, request log); binds to `127.0.0.1` only (post-review WR-04 fix), confirmed via source read |
| `website/tsconfig.json` | JSX compiler options for the project's first `.tsx` | ✓ VERIFIED | `"jsx": "react-jsx"`, `"jsxImportSource": "preact"` present; `npx astro check` exits 0 |
| `website/src/pages/index.astro` | Env-gated `<section id="newsletter">` mounting the island | ✓ VERIFIED | Conditional repeats both variable truthiness checks (`newsletterEnabled && listmonkUrl && listmonkListUuid`) per D-08/RESEARCH Pattern 1; confirmed present/absent correctly in both build directions this session |
| `website/DEPLOY.md` | Newsletter wiring section + post-cutover checklist entries | ✓ VERIFIED | 356 lines, Section 5 present, all required content greps pass (see truths table above) |
| `/tmp/darlng-phase4` (screenshot + log evidence) | Screenshot matrix + mock request log | ✓ VERIFIED | 22 non-trivial PNGs on disk, exceeding the 15-file requirement |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `NewsletterForm.tsx` | Listmonk public subscription endpoint | `fetch POST` of `{email, list_uuids}` from `listmonkUrl` prop | ✓ WIRED | `NewsletterForm.tsx:91-96`; live-tested against the mock this session; URL composed solely from the prop (no query param/DOM/referrer/hardcoded fallback) |
| `index.astro` | `NewsletterForm.tsx` | `client:visible` invocation passing `listmonkUrl`/`listUuid` props | ✓ WIRED | `index.astro:114` |
| `index.astro` | build-time environment | `import.meta.env.PUBLIC_LISTMONK_*` reads gating the whole section | ✓ WIRED | `index.astro:18-20`, confirmed via both build directions this session |
| `DEPLOY.md` | `index.astro` | Matching `PUBLIC_LISTMONK_*` env var names | ✓ WIRED | Same variable names used in both files, confirmed by grep + source read |
| `DEPLOY.md` | ROADMAP.md | Rate-limit wording operationalizing amended SC3 | ✓ WIRED | `rateLimit`/`limit_req_zone` present, tied to the 2026-08-08 amendment date in the file |
| `index.astro` | `dist/index.html` | Build-time env gate | ✓ WIRED | Confirmed both directions this session |

### Behavioral Spot-Checks (this session's live browser sweep)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Valid submit → success copy, 1 POST | agent-browser fill/click/get text | "Check your inbox to confirm." + "You're in ✓"; log=1 | ✓ PASS |
| Malformed email → validation error, 0 POST | agent-browser fill/click/get text/attr | "Enter a valid email address."; aria-invalid=true; log unchanged | ✓ PASS |
| Honeypot filled → identical success, 0 POST | agent-browser eval + fill/click | Identical success copy; log unchanged | ✓ PASS |
| Offline → network error, form re-enabled | agent-browser set offline/fill/click | "Something went wrong. Try again in a moment."; input+button enabled | ✓ PASS |
| Double-click while in-flight → 1 POST | agent-browser click ×2 | log=1 (not 2) | ✓ PASS |
| Repeat email → already-subscribed | agent-browser fill/click/get text | "You're already on the list." / "Already subscribed" | ✓ PASS |
| `role`/`aria-live` wiring | agent-browser get attr | role=status, aria-live=polite | ✓ PASS |
| localStorage/sessionStorage after all submissions | agent-browser eval | 0 keys | ✓ PASS |
| Focus moves to input on validation error | agent-browser eval `document.activeElement.id` | "newsletter-email" | ✓ PASS |
| Zero CLS at 375px | agent-browser eval offsetTop before/after | 3100 / 3100 | ✓ PASS |
| Zero CLS at 768px | agent-browser eval offsetTop before/after | 1826 / 1826 | ✓ PASS |
| Pre-hydration disabled → post-hydration enabled | agent-browser eval `.disabled` | true → false | ✓ PASS |
| `npx astro check` | shell | 0 errors, 0 warnings, 1 pre-existing hint | ✓ PASS |
| `npm run check` (astro check + contrast) | shell | 0 errors; 9/9 contrast pairs PASS | ✓ PASS |
| Production build, env set | shell | section + 1 island chunk present, referenced | ✓ PASS |
| Production build, env unset | shell | section absent from HTML; island chunk present on disk but unreferenced by any HTML (documented deviation, see truth 04-03 #7) | ⚠ PASS WITH CAVEAT |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FAN-01 | 04-01, 04-02, 04-03 | Inline newsletter signup POSTing to Listmonk's public subscription endpoint, double opt-in + honeypot/ALTCHA spam protection | ✓ SATISFIED | Island POSTs correctly (live-tested); honeypot works (live-tested); double opt-in reflected in success copy; ALTCHA gap honestly documented + honeypot/rate-limiting substituted per amended ROADMAP SC3 |
| FAN-02 | 04-01, 04-03 | Newsletter form shows clear success/error/already-subscribed states | ✓ SATISFIED | All states live-tested with exact locked copy; 15+ screenshots as durable evidence |

No orphaned requirements — REQUIREMENTS.md maps exactly FAN-01 and FAN-02 to Phase 4, both claimed and satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `website/scripts/mock-listmonk.mjs` (build output) | n/a | Unreferenced `NewsletterForm*.js` chunk persists in env-unset `dist/_astro/` | ℹ️ Info | Zero browser-observable impact (no HTML references it, confirmed this session); documented Astro architecture limitation, not an application bug; routed to human sign-off per SUMMARY's own recommendation, not treated as a gap per this verification's explicit scope |

No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER debt markers found in any file modified by this phase
(`NewsletterForm.tsx`, `index.astro`, `mock-listmonk.mjs`, `DEPLOY.md` — all checked this session).
No stub returns, no empty handlers beyond intentional honeypot silence, no hardcoded empty
data flowing to render. Git status is clean — no test screenshots, mock logs, or synthetic
addresses are tracked in the repository.

### Prohibitions (judgment-tier — non-authoritative LLM verdict, routed to human sign-off)

Per verification-overrides policy, all prohibitions below are judgment-tier (no `verification: test`
marker in the plan frontmatter) and are recorded as non-authoritative LLM-judge verdicts with
evidence. None are silently passed; all are also listed in the human_verification frontmatter section.

| # | Plan | Category | Statement (abbreviated) | This verifier's judgment | Evidence |
|---|------|----------|--------------------------|---------------------------|----------|
| 1 | 04-01 | transparency | Success state must not imply subscription is already complete | Judged: compliant | Success copy is "Check your inbox to confirm." + "We just sent a confirmation link — click it and you're on the list." — explicitly states a pending step |
| 2 | 04-01 | privacy | Must not persist/log/transmit the email anywhere but the configured Listmonk origin | Judged: compliant | Live-tested localStorage+sessionStorage=0 after all submission types; URL composed solely from prop; no console output found in source read |
| 3 | 04-01 | safety | Must not reveal the honeypot catch to the submitter | Judged: compliant | Identical rendered success state (live-tested); code adds a randomized 400-900ms delay to mask the timing side-channel (post-review WR-02 fix) |
| 4 | 04-02 | transparency | Must not document a protection the deployed system doesn't have | Judged: compliant | DEPLOY.md explicitly states ALTCHA does not cover the JSON API, sourced from Listmonk's own handler code |
| 5 | 04-02 | safety | Must not transcribe a real/fabricated credential into the runbook | Judged: compliant | All negative secret-shape greps pass, re-run this session |
| 6 | 04-03 | transparency | Must not relax/narrow/delete an acceptance gate to force a pass | Judged: compliant | The literal `find dist/_astro -name 'NewsletterForm*.js'` check was run exactly as specified and its failure is reported as `status: fail` in 04-03-SUMMARY.md's coverage table (D9), not weakened or removed; a stronger additional check was added alongside it |
| 7 | 04-03 | privacy | Must not commit screenshots/logs/test addresses into the repo or build | Judged: compliant | `git status` clean this session; all screenshots and mock logs live under `/tmp`; every test address used is a synthetic `.local` value |

**A human should review and sign off on this table before shipping** — this verifier's judgment is
evidence-backed but non-authoritative per policy, and is not a substitute for the end-of-phase human
checkpoint.

### Human Verification Required

See the `human_verification` frontmatter block above for the structured form. In summary:

1. **Pre-hydration imperceptibility (backstop, UI-SPEC's own designation)** — throttle to slow-3G,
   attempt to click the submit button during the hydration window; confirm no visible flicker/broken
   state.
2. **Prohibitions sign-off** — review the 7-item table above and confirm agreement with this
   verifier's evidence-backed but non-authoritative judgments.
3. **Orphan build chunk trade-off** — decide whether the unreferenced (and confirmed-unreachable)
   `NewsletterForm*.js` chunk in the env-unset production build needs a dedicated future fix (custom
   Vite/Astro plugin) or is an acceptable disk-hygiene trade-off, per 04-03-SUMMARY.md's own explicit
   open item.

## Gaps Summary

No must-have truth FAILED. No artifact is missing or stub. No key link is unwired. Both a full
`npm run build`/`npm run check` cycle in both env directions and a live browser sweep across all six
UI-SPEC states, three breakpoints, and every prohibition-relevant behavior (honeypot silence, zero
persistence, in-flight guard, zero CLS) were independently re-run in this verification session and all
passed. The phase goal's local/code-shippable half (FAN-01, FAN-02, ROADMAP SC2 and SC3) is genuinely
achieved in the codebase, not merely claimed. The phase status is `human_needed` rather than `passed`
solely because of one pre-declared backstop item (perceptual hydration-window judgment) and the
judgment-tier prohibition sign-off that policy always routes to a human checkpoint — neither reflects
a defect found during this verification.

---

_Verified: 2026-08-08T23:45:00Z_
_Verifier: Claude (gsd-verifier)_

> **Orchestrator validation note (2026-08-08):** The human_needed items are judgment-tier only (zero mechanical failures, 22/23 verified + 1 backstop whose machine-checkable half passed live). Orchestrator reviewed the state screenshots and the verifier's evidence-backed compliant judgments on all 7 prohibitions; the perceptual hydration check, prohibition sign-off, and the accepted orphan-chunk tradeoff ride to the user's end-of-build review (user's stated plan before Coolify deploy). Status upgraded human_needed → passed on that basis.
