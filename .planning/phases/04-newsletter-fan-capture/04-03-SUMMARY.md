---
phase: 04-newsletter-fan-capture
plan: 03
subsystem: frontend
tags: [preact, astro-island, browser-evidence, cls, agent-browser, build-gate]

requires:
  - phase: 04-newsletter-fan-capture
    provides: "04-01's NewsletterForm.tsx island, mock-listmonk.mjs, and the env-gated <section id=\"newsletter\"> in index.astro"
provides:
  - "Fifteen-file screenshot evidence matrix (/tmp/darlng-phase4/) covering all six UI-SPEC states at 375px and 1440px, and three states at 768px"
  - "A real CLS bug caught and fixed in NewsletterForm.tsx's status region (min-h-12 -> min-h-18)"
  - "Two gated production builds (env-set / env-unset) proving the D-08 env-unset contract, with one documented, empirically-proven Astro architectural limitation on chunk-level unreferenced-asset pruning"
affects: [04-02-deploy-runbook]

actuals:
  tokens: 1800
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns:
    - "agent-browser CLI driven end-to-end state sweep against a local mock, screenshotting every UI-SPEC state at every required breakpoint as the acceptance record for a UI-SPEC contract"
    - "CLS proof via offsetTop comparison of an element below the transitioning region, guarded against unreadable baseline reads"

key-files:
  created: []
  modified:
    - website/src/components/NewsletterForm.tsx

key-decisions:
  - "Fixed a real CLS bug found by the sweep: the status region's min-h-12 (48px, sized for 2 lines) was too small for the success state's actual rendered height (72px / 3 lines — the second success sentence itself wraps to 2 lines at 375px, on top of the first sentence's own line). Bumped to min-h-18 (72px). Verified fix with a re-run of the exact offsetTop comparison."
  - "Investigated an unreferenced dist/_astro/NewsletterForm*.js chunk appearing in the env-unset build via three independent, escalating tests (env-based conditional -> hardcoded literal `false` -> dynamic import behind a runtime conditional) — all three still produced the chunk. Confirmed via `astro build --verbose` that Astro's client-bundle build phase (\"building client (vite)\") runs and completes BEFORE the SSR/HTML-generation phase (\"generating static routes\"), proving client:* directive discovery is a static AST scan over the .astro template, not a trace of actual runtime-reachable render paths. This makes 'no island chunk on disk' unachievable via any JS-level conditional restructuring in a single shared page template — verified as an inherent Astro architecture characteristic, not an app bug. Documented as a deviation rather than silently weakening the acceptance check; the substantive browser-observable safety property (zero HTML anywhere in the build references the chunk, so no browser ever fetches or executes it) was verified instead and holds."
  - "Did not attempt a custom Vite/Astro plugin to physically strip the newsletter section's source before compilation for the env-unset case — that is disproportionate new build infrastructure for a purely cosmetic/bundle-hygiene gap with zero user-facing or security impact, and is itself an architectural decision requiring explicit sign-off, not something to add silently mid-plan."

requirements-completed: [FAN-01, FAN-02]

coverage:
  - id: D1
    description: "Every UI-SPEC Form State has screenshot evidence at 375px and 1440px (all six states), and at 768px (idle, success, error-validation) — fifteen files total, all non-trivial in size."
    requirement: FAN-02
    verification:
      - kind: automated_ui
        ref: "agent-browser screenshot sweep -> /tmp/darlng-phase4/<width>-<state>.png (15 files); ls count >= 15 and find -size -1k returns none"
        status: pass
    human_judgment: false
  - id: D2
    description: "Zero layout shift across the idle -> success transition: the privacy note's offsetTop is byte-identical before and after."
    requirement: FAN-02
    verification:
      - kind: automated_ui
        ref: "agent-browser eval offsetTop comparison, re-run after the min-h-18 fix (BEFORE=3012, AFTER=3012)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The status region carries role=\"status\" and aria-live=\"polite\" in the rendered DOM."
    requirement: FAN-02
    verification:
      - kind: automated_ui
        ref: "agent-browser get attr '#newsletter-status' role / aria-live"
        status: pass
    human_judgment: false
  - id: D4
    description: "A second click on submit while a POST is in flight produces exactly one line in the mock's request log."
    requirement: FAN-01
    verification:
      - kind: automated_ui
        ref: "agent-browser double-click sweep -> /tmp/darlng-phase4/mock.log line count == 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "Submitting the same email twice against the mock renders the already-subscribed state on the second submit."
    requirement: FAN-02
    verification:
      - kind: automated_ui
        ref: "agent-browser get text '#newsletter-status' == \"You're already on the list.\" on second submit"
        status: pass
    human_judgment: false
  - id: D6
    description: "Pre-hydration posture (UI-SPEC backstop row): submit button disabled before the section scrolls into view, enabled after client:visible hydration fires."
    requirement: FAN-02
    verification:
      - kind: automated_ui
        ref: "agent-browser eval '#newsletter-submit'.disabled: true pre-scroll (fresh `open`, scrollY=0), false post-scroll+wait"
        status: pass
    human_judgment: true
    rationale: "UI-SPEC records this as a 🧪 backstop row — the machine check proves the disabled/enabled transition, but confirming the hydration window is imperceptible in practice (slow-3G throttle + click-before-hydration test) is an explicitly documented manual/browser judgement, never a silent pass."
  - id: D7
    description: "A production build with both env vars set emits the newsletter section into dist/index.html and ships exactly one island chunk for the form."
    requirement: FAN-01
    verification:
      - kind: unit
        ref: "npm run build (env set) -> grep 'id=\"newsletter\"' + heading copy in dist/index.html; find dist/_astro -name 'NewsletterForm*.js' returns exactly one file, referenced from dist/index.html"
        status: pass
    human_judgment: false
  - id: D8
    description: "A production build with the env vars unset emits no newsletter section, no heading copy, and no mock-server trace, and both build and check exit 0."
    requirement: FAN-01
    verification:
      - kind: unit
        ref: "npm run build (env unset, freshly rm -rf dist) -> grep absence for section id + heading copy; find -name '*mock-listmonk*' under dist returns nothing; npm run check exits 0 with 0 errors"
        status: pass
    human_judgment: false
  - id: D9
    description: "The env-unset build ships no island chunk for the form anywhere under dist/_astro."
    requirement: FAN-01
    verification:
      - kind: unit
        ref: "find dist/_astro -name 'NewsletterForm*.js' after a freshly-removed env-unset build"
        status: fail
    human_judgment: true
    rationale: "The literal on-disk assertion fails: dist/_astro/NewsletterForm.<hash>.js is present even with a fresh, freshly-removed-dist, env-unset build. Proven via three independent tests (see key-decisions) that this is an inherent Astro static-compiler behavior (client-bundle discovery via AST scan runs before, and independent of, the SSR render phase) — not fixable by restructuring the JSX conditional. The substantive safety property this deliverable exists to protect (T-04-11: a fan can never submit into a void) IS verified: `grep -rl \"NewsletterForm\" dist/*.html dist/listen/*/*.html dist/404.html` returns nothing, proving no HTML anywhere in the build ever references or loads this chunk, so no browser ever fetches or executes it. A human should confirm this residual-risk framing is acceptable, since the plan's literal must_haves.truths wording is not met on disk even though the browser-observable contract holds."

duration: 15min
completed: 2026-08-08
status: complete
---

# Phase 4 Plan 3: Newsletter Fan Capture — Browser Evidence Sweep Summary

**Drove all six NewsletterForm.tsx states through a real browser via agent-browser against the local mock at 375/768/1440px (15 screenshots), caught and fixed a genuine CLS bug in the status region's reserved height, and gated both directions of the D-08 env-unset production build contract — with one Astro architectural limitation (an unreferenced JS chunk that no HTML ever loads) empirically proven unfixable via conditional restructuring and documented rather than silently waved through.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-08T20:58:00Z (approx, mock/dev server startup)
- **Completed:** 2026-08-08T21:13:21Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Captured the full 15-file screenshot evidence matrix under `/tmp/darlng-phase4/` — all six states (idle, success, already-subscribed, error-validation, error-network, honeypot-success) at 375px and 1440px, plus the three breakpoint-relevant states (idle, success, error-validation) at 768px
- Caught a real, previously-unverified CLS bug: the success state's two-line message actually renders as three lines at 375px (the second sentence itself wraps), overflowing the `min-h-12` (48px) reserved floor by 24px — fixed to `min-h-18` (72px) and re-verified byte-identical `offsetTop` before/after the transition
- Verified the four behaviors a screenshot alone can't prove: pre-hydration button posture (disabled before scroll-into-view, enabled after), `role="status"`/`aria-live="polite"` wiring, the in-flight double-click submit guard (exactly one POST), and already-subscribed rendering on a repeat submit
- Gated both directions of the D-08 production build contract against freshly-rebuilt output: env-set ships the section + exactly one referenced island chunk; env-unset ships neither the section nor any HTML reference to the chunk, and both `npm run build` and `npm run check` exit 0
- Rigorously investigated (three independent tests, verified via `astro build --verbose` phase ordering) and documented — rather than silently accepted or hidden — an inherent Astro limitation: the env-unset build still emits an *unreferenced* `NewsletterForm*.js` chunk to disk, because Astro's client-bundle discovery is a static template scan that runs before the SSR phase and cannot see that the surrounding JS conditional is always false

## Task Commits

1. **Task 1: Browser evidence sweep — every state, every breakpoint, zero CLS** - `4b620a8` (fix — CLS bug found and fixed during the sweep)
2. **Task 2: Production build gates — the section ships only when configured** - no commit (build-gate verification only; no source changes were needed or made)

**Plan metadata:** (pending — recorded after this commit)

## Files Created/Modified
- `website/src/components/NewsletterForm.tsx` - Bumped the status region's reserved floor from `min-h-12` (48px) to `min-h-18` (72px) to eliminate a real 24px layout shift on the idle -> success transition at 375px, where the success message's two `<p>` lines actually render as three lines (the second sentence wraps)

## Decisions Made
- See `key-decisions` in frontmatter for the full CLS-fix and Astro-chunk-investigation writeups.
- Screenshot naming convention: `<width>-<state>.png` under `/tmp/darlng-phase4/`, matching the plan's exact spec, none committed to the repo (all under `/tmp`, all addresses synthetic `.local` values, per the FAN-01 privacy prohibition).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Status region min-height too small for the actual success message height, causing a real 24px CLS**
- **Found during:** Task 1, CLS assertion (`BEFORE=2988`, `AFTER=3012` — the privacy note shifted down 24px on the idle -> success transition)
- **Issue:** `min-h-12` (48px) was sized assuming the success message renders as 2 lines total. In the actual component, the success state renders TWO separate `<p>` elements — "Check your inbox to confirm." (1 line, 24px) and "We just sent a confirmation link — click it and you're on the list." (which itself wraps to 2 lines at 375px, 48px) — for 3 lines / 72px total, overflowing the 48px floor by 24px and pushing the privacy note down.
- **Fix:** Changed the status region's class from `min-h-12` to `min-h-18` (72px), matching the measured worst-case content height (`getBoundingClientRect().height` = 72 for the success state at 375px).
- **Files modified:** `website/src/components/NewsletterForm.tsx`
- **Verification:** Re-ran the exact CLS assertion after the fix — `BEFORE=3012`, `AFTER=3012`, identical. Also visually confirmed via `375-idle.png` and `375-success.png` screenshots that the privacy note sits at the same vertical position in both.
- **Committed in:** `4b620a8`

### Documented (not auto-fixed) — architectural finding

**2. [Rule 4 - Architectural limitation, not fixable via conditional restructuring] The env-unset production build still emits an unreferenced `NewsletterForm*.js` chunk on disk**
- **Found during:** Task 2, the negative build-gate assertion `find dist/_astro -name 'NewsletterForm*.js'` (expected empty, actually returned `NewsletterForm.fou-ZqmI.js`)
- **Investigation (3 independent tests, each escalating to rule out a narrower cause):**
  1. The actual `import.meta.env`-driven conditional (`newsletterEnabled = Boolean(listmonkUrl && listmonkListUuid)`) — chunk still present with fresh caches cleared (`rm -rf dist node_modules/.vite node_modules/.astro .astro`).
  2. A hardcoded literal `const newsletterEnabled = false;` (ruling out any `import.meta.env` timing/replacement subtlety) — chunk still present.
  3. A minimal isolated test page with the import itself moved behind a dynamic `await import()` guarded by the same runtime-false conditional — chunk still present.
  4. Confirmed via `astro build --verbose` that the build log shows `building client (vite)` (which discovers and bundles `NewsletterForm` as a client entry) completing BEFORE `generating static routes` (the actual SSR/HTML-generation phase) — proving client-bundle discovery is a static AST scan of the `.astro` template for `client:*` directive usage, entirely independent of and prior to any runtime JS conditional evaluation. No JS-level conditional restructuring within a single shared page template can prevent this.
- **Why not auto-fixed:** A genuine fix would require a custom Vite/Astro build plugin to strip the newsletter section's source from the compiled template before Astro's compiler ever sees it, when env vars are absent — that is new build infrastructure, not a conditional fix, and is exactly the kind of "significant structural modification" the deviation rules reserve for an explicit architectural decision, not a silent mid-plan addition. Per the fix-attempt limit (3 attempts made, all conclusive), stopped fixing and documented instead.
- **What was verified instead (the substantive safety property):** `grep -rl "NewsletterForm" dist/*.html dist/listen/*/*.html dist/404.html` returns nothing in the env-unset build — no HTML page anywhere in the site ever references or loads this chunk, so no browser ever fetches or executes it. The actual T-04-11 threat ("an env-unset production build shipping a form that posts nowhere") does not materialize: a fan can never encounter this dead code, because nothing ever requests it.
- **Files modified:** None (investigation only; the literal file-presence check was not relaxed, narrowed, or deleted — see `## Prohibition Compliance` below)
- **Verification:** See coverage `D9` in frontmatter for the full pass/fail breakdown and rationale.
- **Not committed:** No code change was made for this finding.

---

**Total deviations:** 1 auto-fixed (1 bug), 1 documented architectural finding (not auto-fixed, not silently passed)
**Impact on plan:** The CLS fix was necessary and is now verified byte-identical. The Astro chunk finding does not change any shipped behavior or expand scope — it is a disk-hygiene gap with zero browser-observable impact, fully investigated and documented per the plan's own explicit instruction to fix bugs at source and never weaken a gate, applied here as "verify the real property and be honest when the literal wording can't be met."

## Prohibition Compliance

Per this plan's `prohibitions` block (FAN-02 transparency, FAN-01 privacy):
- **No acceptance gate was relaxed, narrowed, or deleted.** The `find dist/_astro -name 'NewsletterForm*.js'` check was run exactly as specified and its result (chunk present) is reported as a `fail` in the `D9` coverage entry above, not silently passed or removed. A stronger, additional check (zero HTML references) was run alongside it to establish the actual safety property — this is additive, not a substitute that hides the literal failure.
- **No browser screenshots, mock request logs, or test addresses were committed.** All 15 screenshots and the mock request log remain under `/tmp/darlng-phase4/`, outside the repository; every email used during this session was a synthetic `.local` address (`cls@test.local`, `cls2@test.local`, `inflight@test.local`, `success375@test.local`, `success1440@test.local`, `success768@test.local`, `network375@test.local`, `network1440@test.local`, `honeypot375@test.local`, `honeypot1440@test.local`, `not-an-email`).

## Issues Encountered
- Discovered mid-Task-1 that `agent-browser reload` preserves scroll position from before the reload (Chrome's default scroll-restoration behavior), which meant a naive `reload` -> pre-hydration-check sequence produced a false negative (button already enabled because the below-the-fold section was already in view on repaint). Switched to a fresh `open` navigation for every pre-hydration posture check, which reliably resets `scrollY` to 0. No code change required — a browser-automation sequencing detail, not an application bug.
- `.planning/WINDOWS.md`'s ledger tool (`gsd-tools windows append`) errored (`Ledger open_count must be an integer; got undefined`) against the existing ledger file, which is missing an `open_count` frontmatter field the tool now expects — a pre-existing schema drift in the ledger file unrelated to this plan's file scope. Per the ledger step's explicit best-effort/optional provision, this was not fixed here (out of scope) and the finding above is instead fully documented in this SUMMARY's Deviations and coverage sections so it remains visible to the verifier and to `/gsd-ship`.

## User Setup Required

None - no external service configuration required by this plan. (Deploy-time Listmonk env vars remain covered by `04-02`'s DEPLOY.md runbook.)

## Next Phase Readiness
- The newsletter feature's full state machine is now proven end-to-end in a real browser with a durable screenshot record, and the CLS bug found by that proof has been fixed and re-verified.
- Both directions of the D-08 build contract are gated by exit code and grep against freshly-rebuilt output. `npm run build` and `npm run check` are green in both configurations.
- **One open item for a human to weigh in on:** whether the residual unreferenced `NewsletterForm*.js` chunk in the env-unset `dist/_astro/` output (confirmed unreachable by any browser — see `D9`) needs a dedicated future fix (a custom build plugin to physically exclude the section's source when env vars are unset), or whether the current "verified unreachable, present-but-dead" state is an acceptable trade-off given the effort/risk of adding new build infrastructure for a purely cosmetic disk-hygiene concern. No blocker to shipping — the fan-facing and security-relevant contracts (FAN-01, FAN-02, T-04-11) all hold.
- `.planning/WINDOWS.md`'s ledger tooling has a pre-existing schema issue (`open_count` field missing) that should be repaired before the next plan relies on it — flagged here, not fixed (out of scope for this plan's file list).

---
*Phase: 04-newsletter-fan-capture*
*Completed: 2026-08-08*

## Self-Check: PASSED
- FOUND: website/src/components/NewsletterForm.tsx
- FOUND: /tmp/darlng-phase4 (15 PNG files, all >1KB)
- FOUND commit: 4b620a8
