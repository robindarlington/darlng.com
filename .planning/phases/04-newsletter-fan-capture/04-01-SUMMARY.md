---
phase: 04-newsletter-fan-capture
plan: 01
subsystem: frontend
tags: [preact, astro-island, listmonk, newsletter, tailwind-v4]

requires:
  - phase: 01-foundation
    provides: "@astrojs/preact and preact already installed and wired into astro.config.mjs (never exercised until this plan)"
  - phase: 02-homepage-hero-catalog
    provides: "Design token system (--color-*, --radius-card), :focus-visible rule, sr-only utility usage, contrast gate script"
  - phase: 03-listen-everywhere
    provides: "Established page/section conventions in index.astro (container, heading pattern)"
provides:
  - "Working Preact newsletter signup island (src/components/NewsletterForm.tsx) with the full six-state machine"
  - "Zero-dependency mock Listmonk server (scripts/mock-listmonk.mjs) for local/CI testing"
  - "Env-gated <section id=\"newsletter\"> in index.astro that hides completely when Listmonk env vars are unset"
  - "tsconfig.json JSX compiler options required for any future .tsx file in this project"
affects: [04-02-deploy-runbook, 04-03-if-any-remaining-newsletter-plans]

actuals:
  tokens: 3199
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Env-gated conditional island render with per-variable TS narrowing (repeat the truthiness check inside the JSX conditional, not just a derived boolean, so astro/tsconfigs/strict narrows string | undefined to string for required island props)"
    - "Zero-dependency node:http mock server for local Listmonk-shaped testing (CORS preflight, error trigger email, synthetic already_subscribed via a Set)"
    - "Form novalidate + custom regex validation, because native type=\"email\" + required constraint validation silently swallows the submit event for some invalid input before any JS handler runs"

key-files:
  created:
    - website/src/components/NewsletterForm.tsx
    - website/scripts/mock-listmonk.mjs
  modified:
    - website/tsconfig.json
    - website/package.json
    - website/src/pages/index.astro

key-decisions:
  - "Spot-checked the tsconfig jsx/jsxImportSource requirement against the live Astro docs page before writing it (RESEARCH flagged this as WebFetch-summarized, not verbatim) — confirmed exact match, no divergence."
  - "Added novalidate to the form: native HTML5 email format checking was intercepting the submit event before the custom regex validator could ever run, silently defeating the plan's whole validation-error state."
  - "Nested the input+button flex-row inside its own wrapper div, with the status region as a form-level sibling, rather than applying md:flex directly to the <form> — matches the UI-SPEC's own Section Anatomy diagram and is required for the status region to sit on its own line below the row at md: and up (a form-level flex-row would otherwise pull the status div into the same row)."
  - "Wrapped the island in a <div class=\"mt-6\"> in index.astro instead of passing a class prop, per the task's own fallback since the component's Props interface intentionally doesn't declare one."

patterns-established:
  - "First Preact island in the codebase — tsconfig.json now carries the jsx/jsxImportSource options every future .tsx file needs."

requirements-completed: [FAN-01, FAN-02]

coverage:
  - id: D1
    description: "A fan types a valid email, submits, and sees 'Check your inbox to confirm.' with no page reload; exactly one POST reaches the endpoint."
    requirement: FAN-01
    verification:
      - kind: automated_ui
        ref: "agent-browser E2E (Task 1 <verify>): fill valid email -> click submit -> status text contains 'Check your inbox to confirm.', button reads \"You're in\", mock log has exactly 1 line"
        status: pass
    human_judgment: false
  - id: D2
    description: "In-flight concurrency guard — a second click while a POST is outstanding cannot start a second request."
    requirement: FAN-01
    verification:
      - kind: automated_ui
        ref: "agent-browser E2E: double-click submit while pending -> mock log gains exactly 1 line, not 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "Malformed/empty email renders 'Enter a valid email address.' with aria-invalid=true and sends zero requests."
    requirement: FAN-02
    verification:
      - kind: automated_ui
        ref: "agent-browser E2E (Task 2 <verify>): fill 'not-an-email' -> submit -> status text + aria-invalid attribute checked, mock log stays at 0 lines"
        status: pass
    human_judgment: false
  - id: D4
    description: "Fetch failure/offline renders 'Something went wrong. Try again in a moment.' and re-enables the form for retry."
    requirement: FAN-02
    verification:
      - kind: automated_ui
        ref: "agent-browser E2E: browser set offline -> submit -> status text + submit button enabled-state checked, mock log stays at 0 lines"
        status: pass
    human_judgment: false
  - id: D5
    description: "A response carrying the mock's synthetic already-subscribed signal renders 'You're already on the list.' with a neutral (non-accent, non-error) color."
    requirement: FAN-02
    verification:
      - kind: automated_ui
        ref: "agent-browser E2E: same email submitted twice -> second submit's status text and button label checked"
        status: pass
    human_judgment: false
  - id: D6
    description: "A filled honeypot renders the identical success state as a genuine signup and sends zero requests."
    requirement: FAN-01
    verification:
      - kind: automated_ui
        ref: "agent-browser E2E (Task 2 <verify>): fill hp_website via eval, submit -> status text identical to success copy, mock log stays at 0 lines"
        status: pass
    human_judgment: false
  - id: D7
    description: "When either PUBLIC_LISTMONK_URL or PUBLIC_LISTMONK_LIST_UUID is unset at build time, the whole newsletter section is absent and npm run build / npm run check both exit 0."
    requirement: FAN-01
    verification:
      - kind: unit
        ref: "npm run build && npm run check with both env vars unset — 0 grep matches for id=\"newsletter\" in dist/index.html, both commands exit 0"
        status: pass
    human_judgment: false
  - id: D8
    description: "No client-side persistence of the entered email address anywhere (localStorage/sessionStorage/cookies/console)."
    requirement: FAN-01
    verification:
      - kind: automated_ui
        ref: "agent-browser eval: Object.keys(localStorage).length + Object.keys(sessionStorage).length === 0 after validation, honeypot, offline, and repeat-email submissions"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-08-08
status: complete
---

# Phase 4 Plan 1: Newsletter Fan Capture Summary

**Preact island (`NewsletterForm.tsx`) POSTing to Listmonk's public subscription endpoint, with a six-state machine (idle/submitting/success/already-subscribed/error-validation/error-network) exercised end-to-end in a real browser against a zero-dependency `node:http` mock, plus the env-gated section wiring in `index.astro` and the tsconfig JSX options this codebase's first `.tsx` file needed.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-08-08T21:56:00Z (approx, see commit timestamps)
- **Completed:** 2026-08-08T22:51:00Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Shipped the site's first Preact island, hydrated with `client:visible`, wired to a real `fetch` POST against Listmonk's public subscription API shape
- Full six-state machine implemented and driven in a real browser against `scripts/mock-listmonk.mjs`: idle, submitting, success, already-subscribed, client-validation error, network error
- Honeypot spam mitigation (`hp_website`) that silently renders the identical success UI to a caught bot, with zero network requests
- Env-gated conditional render — the entire `<section id="newsletter">` (including the island's hydration script) is absent from the build output when either `PUBLIC_LISTMONK_URL` or `PUBLIC_LISTMONK_LIST_UUID` is unset, and `npm run build`/`npm run check` both stay green either way
- Zero new npm dependencies; `@tailwindcss/vite`/`tailwindcss` pins and the `overrides.vite` block survive byte-identical

## Task Commits

1. **Task 1: End-to-end "a fan subscribes" — one path only** - `68bc72a` (feat)
2. **Task 2: Complete the state machine — validation, network failure, already-subscribed, honeypot, no-JS** - `f724393` (feat)

**Plan metadata:** (pending — recorded after this commit)

_Note: Task 2 (`tdd="true"`) does not have a separate `test(...)` commit — see "TDD Gate Compliance" below for why, and the RED-phase evidence that stands in its place._

## Files Created/Modified
- `website/tsconfig.json` - Added `jsx: "react-jsx"` and `jsxImportSource: "preact"` compiler options (spot-checked against live Astro docs, exact match, no divergence from RESEARCH's WebFetch-sourced claim)
- `website/package.json` - Added the `mock:listmonk` script; dependencies/pins untouched
- `website/scripts/mock-listmonk.mjs` - Zero-dependency `node:http` mock of Listmonk's public subscription endpoint: CORS preflight, `error@test.local` trigger, synthetic `already_subscribed` on repeat email, request log for POST-count assertions
- `website/src/components/NewsletterForm.tsx` - The Preact island: email input, honeypot, submit button, `aria-live` status region, full six-state machine
- `website/src/pages/index.astro` - Env-gated `<section id="newsletter">` mounting the island in the reserved slot, plus the `<noscript>` fallback

## Decisions Made
- Spot-checked the tsconfig `jsx`/`jsxImportSource` requirement against `docs.astro.build` before writing it (RESEARCH flagged this as a WebFetch summary, not a verbatim read) — confirmed an exact match, no divergence to record.
- Added `novalidate` to the `<form>`: without it, the browser's native `type="email"` constraint validation silently intercepts the submit event for some invalid input (e.g. `test@test`, which has an `@` but no dot) before the JS handler ever runs — this would have silently defeated the plan's client-validation error state for a subset of malformed input.
- Nested the input+button row in its own wrapper `<div class="md:flex md:flex-row ...">` inside the form, with the status region as a form-level sibling after it, rather than applying the flex classes directly to the `<form>` element as the task text literally listed. The UI-SPEC's own Section Anatomy ASCII diagram groups "input + button row" as one unit distinct from the status region; applying flex-row to the form itself would have pulled the status `<div>` into the same row at `md:` and up (flex children don't wrap onto a new line without `flex-wrap`), directly violating the UI-SPEC's explicit "status region sits on its own line below the row at all breakpoints" requirement.
- Wrapped the island invocation in a `<div class="mt-6">` in `index.astro` instead of passing `class="mt-6"` directly to `<NewsletterForm>`, per the task's own documented fallback — the component's `Props` interface intentionally only declares `listmonkUrl` and `listUuid`, and passing an undeclared prop would fail `astro check` under `astro/tsconfigs/strict`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `novalidate` to the newsletter form**
- **Found during:** Task 2, RED-phase browser probe (run before implementing Task 2, to confirm the missing-validation behavior)
- **Issue:** Without `novalidate`, the browser's native HTML5 `type="email"` constraint validation intercepts the submit event for some invalid strings before the custom JS validator (or even `handleSubmit`) ever executes. Confirmed live: submitting `test@test` (passes native email format checking, fails the plan's required `^[^\s@]+@[^\s@]+\.[^\s@]+$` regex because it has no dot) produced a real POST to the mock and a false success state — the custom validation state specified by the UI-SPEC would never have fired for this class of input.
- **Fix:** Added the `novalidate` boolean attribute to the `<form>` element so the JS `handleSubmit` always receives the submit event and is the sole authority on validation, matching the UI-SPEC's exact locked copy/behavior.
- **Files modified:** `website/src/components/NewsletterForm.tsx`
- **Verification:** Re-ran the browser probe with `not-an-email` (no `@` at all — previously blocked by native validation too) and confirmed `Enter a valid email address.` renders, `aria-invalid="true"` is set, and the mock's request log gains zero lines.
- **Committed in:** `f724393` (Task 2 commit)

**2. [Rule 3 - Blocking] Restructured DOM to nest the input+button row separately from the status region**
- **Found during:** Task 1 authoring, before running the browser verify
- **Issue:** The task's literal action text describes applying `md:flex md:flex-row md:items-start md:gap-3` directly to the `<form>` element, with the status region as a further direct child. Since flex containers lay out all direct children as flex items in the same row (without `flex-wrap`, which was not specified), this would have pulled the status `<div>` into the same horizontal row as the input and button at `md:` and up — contradicting the UI-SPEC's explicit "State message region: full-width, sits on its own line below the input+button row (not inline beside it) at all breakpoints" requirement, and contradicting its own Section Anatomy ASCII diagram, which groups "input + button row" as one visual unit distinct from the status region.
- **Fix:** Applied the flex-row classes to a wrapper `<div>` around just the input and button, with the status region as a sibling of that wrapper (both direct children of the `<form>`, which itself carries only `max-w-lg`).
- **Files modified:** `website/src/components/NewsletterForm.tsx`
- **Verification:** Confirmed at 1440x900 viewport that the status region renders full-width on its own line below the input+button row in every state (screenshots captured to `/tmp/darlng-phase4/`).
- **Committed in:** `68bc72a` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both were necessary for the shipped behavior to actually match the UI-SPEC's locked contract. No scope creep — no new files, no new dependencies, no architecture change.

## TDD Gate Compliance

Task 2 carries `tdd="true"`, but this project has no unit-test framework installed (Task 1's own `success_criteria` explicitly locks "no new npm dependency" as a hard constraint, and the plan's entire verification design — `scripts/mock-listmonk.mjs` plus `agent-browser` — is a real-browser E2E harness, not a unit-test harness). Installing a framework (e.g. vitest + `@testing-library/preact`) to satisfy a literal `test(...)` commit would have violated the plan's own no-new-dependency constraint and been out of scope for this plan.

In place of a `test(...)` commit, RED-phase evidence was gathered by running the exact behavior described in `<behavior>` against the Task-1-only build, before writing any Task 2 code: submitting `test@test` (passes native `type="email"` checking, fails the plan's required validation regex) produced a real POST and a false success state — proving the missing validation guard existed. This is documented above as deviation #1. GREEN was then the `f724393` `feat(04-01)` commit, followed by a full re-run of every `<behavior>` case in a real browser (all passed, see Coverage above).

**Gate status:** RED — evidence gathered, no dedicated commit (no test file exists to commit). GREEN — `f724393`. REFACTOR — not needed, no cleanup pass required.

## Issues Encountered
- The plan's own Task 2 `<verify>` script has the `get attr` argument order reversed relative to `agent-browser`'s actual `get attr <selector> <attribute>` signature (the plan wrote `get attr aria-invalid '#newsletter-email'`). Used the correct order (`get attr '#newsletter-email' aria-invalid`) when running the check manually; the assertion itself passed (`aria-invalid` reads `"true"` in the validation-error state). No code change required — this is a plan-script typo, not an application bug.
- `npm run build` with env vars unset still emits an unreferenced `preact.module.*.js` chunk into `dist/_astro/` (confirmed via `grep`: zero HTML files reference it). This does not violate the "island hydration script not shipped" invariant in any browser-observable sense — nothing ever requests that file — but it is a minor build-output cleanliness note for a future phase if bundle-size auditing becomes a concern.

## User Setup Required

**External services require manual configuration before this form goes live.** No `04-USER-SETUP.md` was generated by this plan (the `user_setup` block in the plan frontmatter documents `PUBLIC_LISTMONK_URL` and `PUBLIC_LISTMONK_LIST_UUID`, both deploy-time-only and covered by `04-02`'s DEPLOY.md runbook, not a standalone setup doc for this plan). Until those two env vars are set in Coolify, the entire newsletter section is absent from the deployed site by design (verified this session).

## Next Phase Readiness
- The island, mock server, and env-gated section are complete and verified end-to-end locally. Ready for `04-02` (Listmonk deploy runbook: CORS via `security.trusted_urls`, `EnablePublicSubPage` + list type checks, honeypot-complementary proxy rate limiting, and the ROADMAP Success Criterion #3 rewording flagged by RESEARCH).
- No blockers. The already-subscribed UI branch is confirmed reachable only against the local mock (by design, documented in code comments) — real Listmonk will always render the Success state, which is the correct fallback per the UI-SPEC's own documented caveat.

---
*Phase: 04-newsletter-fan-capture*
*Completed: 2026-08-08*

## Self-Check: PASSED
- FOUND: website/tsconfig.json, website/package.json, website/scripts/mock-listmonk.mjs, website/src/components/NewsletterForm.tsx, website/src/pages/index.astro
- FOUND commit: 68bc72a
- FOUND commit: f724393
