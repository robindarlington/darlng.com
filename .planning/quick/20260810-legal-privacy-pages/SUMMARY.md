---
phase: quick
plan: 20260810-legal-privacy-pages
subsystem: ui
tags: [astro, gdpr, privacy-policy, legal-notice, footer, sitemap]

requires: []
provides:
  - "/privacy — GDPR-facing privacy policy (Listmonk + Resend processors, no cookies/analytics/tracking, rights, retention)"
  - "/legal — legal notice (publisher, Hetzner hosting address)"
  - "Footer 'Privacy · Legal' nav wired into the existing three-column grid"
affects: []

actuals:
  tokens: 1688
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Static prose page pattern from 404.astro reused: single <section class=\"py-12 md:py-16\">, font-display h1/h2, text-text-muted body copy, max-w-prose"
    - "Footer's third grid cell now wraps a policy nav (Privacy · Legal, separator \`·\`) plus the copyright line, keeping the grid container at exactly three direct children"

key-files:
  created:
    - website/src/pages/privacy.astro
    - website/src/pages/legal.astro
  modified:
    - website/src/components/Footer.astro

key-decisions:
  - "Squashed the per-task Task 1 and Task 2 commits into a single final commit before pushing, to satisfy the plan's explicit Task 3 verification (one commit, exact message 'feat: add privacy policy and legal notice pages', exactly 3 files) — the plan's own <verify> block took precedence over the default one-commit-per-task convention."
  - "legal.astro's Publisher section carries a real HTML comment (containing the literal words 'legal name') marking that a full legal name/postal address belongs there if a jurisdiction ever requires it — deliberately no real name/address/phone/tax ID included, per threat T-QUICK-01."

requirements-completed: []

coverage:
  - id: D1
    description: "/privacy page: GDPR-facing content naming Listmonk + Resend as processors, consent basis, rights, retention, no cookies/analytics/tracking, indexable, in sitemap"
    verification:
      - kind: other
        ref: "npm run check && npm run build; grep assertions for title, sitemap entry, no robots meta, Hetzner/Resend/youtube-nocookie/date/mailto strings, footer link presence on dist/index.html and dist/404.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "/legal page: publisher (DARLNG), contact, full Hetzner postal address, indexable, in sitemap, cross-linked with /privacy"
    verification:
      - kind: other
        ref: "npm run check && npm run build; grep assertions for title, sitemap entry, no robots meta, Industriestr./Gunzenhausen/mailto/date/'legal name' comment strings, cross-footer-link presence"
        status: pass
    human_judgment: false
  - id: D3
    description: "Footer 'Privacy · Legal' links reachable and visually correct at 375x812, 768x1024 and 1440x900, no horizontal overflow on /, /privacy/, /legal/, three-column grid intact at md+"
    verification:
      - kind: automated_ui
        ref: "agent-browser eval 'document.documentElement.scrollWidth <= window.innerWidth' at 375x812 and 1440x900 on /, /privacy, /legal (all true); footer click-through nav verified; screenshots at /tmp/darlng-quick-legal/footer-375.png, footer-768.png, footer-1440.png"
        status: pass
    human_judgment: false

duration: ~18min
completed: 2026-08-10
status: complete
---

# Quick Task: Legal & Privacy Pages Summary

**Added `/privacy` and `/legal` static pages plus a footer "Privacy · Legal" nav — GDPR policy naming Listmonk (Hetzner/EU) and Resend (EU) as the only two processors, and a legal notice with the Hetzner hosting address.**

## Performance

- **Duration:** ~18 min
- **Completed:** 2026-08-10
- **Tasks:** 3
- **Files modified:** 3 (website/src/pages/privacy.astro, website/src/pages/legal.astro, website/src/components/Footer.astro)

## Accomplishments

- `/privacy` — plain-language GDPR policy: email-only collection via double opt-in, consent as legal basis (withdrawable via unsubscribe), Listmonk (self-hosted, Hetzner Online GmbH, Germany/EU) and Resend Inc. (EU sending region) named as the only two processors, "no cookies, no analytics, no tracking" stated flatly, youtube-nocookie.com click-to-load embed explained, all GDPR rights listed, hello@darlng.com as single contact, retention rule, dated 10 August 2026.
- `/legal` — publisher (DARLNG, independent artist) with contact, full Hetzner Online GmbH postal address (Industriestr. 25, 91710 Gunzenhausen, Germany), and a real HTML comment placeholder (containing "legal name") for a future registered legal name/address, with no real PII in it.
- Footer's existing three-column grid (brand / social nav / copyright) kept at exactly three direct children — the third cell now wraps a `Site policies` nav (`Privacy · Legal`) above the copyright line, verified visually intact at 375px, 768px, and 1440px with no horizontal overflow anywhere.
- Sitemap (`dist/sitemap-0.xml`) contains both `https://darlng.com/privacy/` and `https://darlng.com/legal/`; neither page carries a robots noindex meta tag.
- External-link security invariant (`rel="noopener noreferrer"` count == `target="_blank"` count on `dist/index.html`) verified unchanged before and after the footer edit.

## Task Commits

Per the executor's default protocol, Task 1 and Task 2 were initially committed atomically. Task 3's own `<verify>` block explicitly requires a single final commit with an exact message and file count, so those two commits were squashed (`git reset --soft` back to the pre-existing plan commit, then re-committed) before the final push — this is documented under Deviations below.

**Final commit:** `cfaf2f1` — `feat: add privacy policy and legal notice pages` (website/src/components/Footer.astro, website/src/pages/legal.astro, website/src/pages/privacy.astro)

Pushed to `origin/master`: `16b2b0d..cfaf2f1`.

## Files Created/Modified

- `website/src/pages/privacy.astro` — new GDPR privacy policy page
- `website/src/pages/legal.astro` — new legal notice page (publisher + hosting)
- `website/src/components/Footer.astro` — third grid cell now wraps a `Site policies` nav (Privacy · Legal) plus the copyright line

## Decisions Made

- Squashed the two per-task commits into one before pushing, honoring the plan Task 3's explicit `<verify>` requirement (single commit, exact message, exactly 3 files) over the default per-task atomic-commit convention. No content was altered by the squash — only commit history was consolidated.
- Kept the footer's `·` separator present after the Privacy link even mid-Task-1 (as instructed), then appended the Legal anchor after it in Task 2 without touching anything else in the footer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, plan self-consistency] Squashed Task 1 + Task 2 commits into Task 3's required single commit**
- **Found during:** Task 3 (commit and push)
- **Issue:** The executor's default task_commit_protocol commits after every task, so Task 1 and Task 2 had already produced two separate commits by the time Task 3 began. Task 3's own `<verify>` block asserts the *latest* commit has the exact message `feat: add privacy policy and legal notice pages` and touches exactly 3 files — which two separate commits could not satisfy.
- **Fix:** `git reset --soft` to the commit immediately preceding Task 1's work (the pre-existing `docs(quick): plan legal-privacy-pages` commit), which preserved the working tree/index exactly as it stood after Task 2, then made one commit with the plan's required message.
- **Files modified:** No content changes — commit-history consolidation only, of website/src/pages/privacy.astro, website/src/pages/legal.astro, website/src/components/Footer.astro.
- **Verification:** Task 3's full automated `<verify>` command (commit message match, clean `website/src` status, exactly 3 files in the latest commit, HEAD == origin/master, no unpushed commits) passed.
- **Committed in:** `cfaf2f1`

---

**Total deviations:** 1 auto-fixed (1 blocking — plan self-consistency)
**Impact:** No functional or content change; consolidates history to match the plan's explicit verification contract. No scope creep.

## Issues Encountered

None — an unrelated pre-existing dev server (from `template/`, an untracked directory outside this task's scope) happened to be bound to the same default port 4321 that `astro preview` also defaults to; confirmed via `lsof`/process inspection that it was a different, older process, left untouched, and my own `npm run preview` server was independently started, verified, and cleanly stopped.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `/privacy` and `/legal` are live in the built site, indexable, in the sitemap, and reachable from the footer of every page at all three verified breakpoints (375, 768, 1440).
- Pushed to `origin/master` (`cfaf2f1`) — ready for the next Coolify deploy to pick up.
- No blockers or concerns.

---
*Task: 20260810-legal-privacy-pages*
*Completed: 2026-08-10*

## Self-Check: PASSED

- FOUND: website/src/pages/privacy.astro
- FOUND: website/src/pages/legal.astro
- FOUND: cfaf2f1 (final commit, pushed to origin/master)
