---
phase: 01-infrastructure-deploy
plan: 02
subsystem: infra
tags: [git-mv, docker, nginx, coolify, listmonk, resend, dns, docs]

requires:
  - phase: 01-01
    provides: "website/Dockerfile and website/nginx.conf that DEPLOY.md's Coolify section instructs the user to build from"
provides:
  - "legacy/ containing the archived 2019 placeholder site, moved via git mv with full git history intact"
  - "website/DEPLOY.md — the complete user-executed runbook for INFRA-02 (Coolify app), INFRA-03 (domain/TLS/redirects), and INFRA-04 (Listmonk + Postgres + Resend SMTP + DNS)"
affects: ["Phase 4 (consumes PUBLIC_LISTMONK_URL / PUBLIC_LISTMONK_LIST_UUID recorded here)", "milestone cleanup (revisit deleting legacy/ entirely)"]

actuals:
  tokens: 3057
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "git mv (not mv + git add) for repo reorganization — preserves git log --follow history across the rename"
    - "DEPLOY.md as a fully human-executed runbook: every credential described as 'where to obtain it, where to paste it', never as a value; account-specific values (DKIM key/selector, list UUID) explicitly marked as copy-from-dashboard, never invented"

key-files:
  created:
    - legacy/README.md
    - website/DEPLOY.md
  modified: []

key-decisions:
  - "D-12's enumerated twelve legacy artifacts (not RESEARCH.md's prose count of ten) is authoritative — all twelve moved by explicit name, none globbed"
  - "DEPLOY.md documents Coolify's built-in Direction/Force-HTTPS setting as the primary www->apex/TLS mechanism, with hand-written Traefik redirect labels named only as a fallback if that UI control is absent"
  - "DEPLOY.md instructs deploying Listmonk via Coolify's one-click service picker, not a hand-modified compose file, per the known private-fork template bug"
  - "Domain-binding collision between an existing Coolify app and the new one is called out as the first, explicit step in Section 1 — the most likely place the live cutover stalls"

patterns-established:
  - "Runbook credential-handling: any file destined for a public repo describes only where to get and where to paste a secret, backed by negative-grep acceptance criteria for key- and password-shaped literals"

requirements-completed: [INFRA-02, INFRA-03, INFRA-04]

coverage:
  - id: D1
    description: "All twelve D-12 legacy artifacts relocated into legacy/ via git mv, preserving 2019 git history, with the repo root reduced to CLAUDE.md, legacy/, website/, and .planning/"
    requirement: "INFRA-02"
    verification:
      - kind: other
        ref: "git status --porcelain (192 file-level R renames, none as delete+add) prior to commit 26463e6"
        status: pass
      - kind: other
        ref: "git log --follow --oneline -- legacy/index.html (reaches faddcaf 'Static placeholder site', 2019)"
        status: pass
      - kind: other
        ref: "npm run build --prefix website (exits 0 after the move)"
        status: pass
    human_judgment: false
  - id: D2
    description: "website/DEPLOY.md documents every live step for INFRA-02/03/04 with concrete Coolify/Listmonk/Resend screens, fields, and values; no secret or invented account-specific value is committed; ends with a roadmap-success-criteria-2-through-5 verification checklist"
    requirement: "INFRA-03"
    verification:
      - kind: other
        ref: "grep-based acceptance criteria: 4 section headings, mail.darlng.com/smtp.resend.com/587/Base Directory/Dockerfile/double opt-in/PUBLIC_LISTMONK_* literals, domain-binding/legacy/master/force-https/direction phrases, 6x 'curl -I' checklist lines, mxtoolbox mention, 183 lines (>=90), two negative-grep secret-shape checks — all pass"
        status: pass
    human_judgment: true
    rationale: "Plan verification step 7 explicitly requires a human read-through of DEPLOY.md sections 1-4 to confirm each step names a concrete screen/field/value rather than a general intention — this is judgment the grep checks cannot fully substitute for, and DEPLOY.md's real test is the user successfully executing it during the live cutover."

duration: 15min
completed: 2026-08-06
status: complete
---

# Phase 1 Plan 2: Legacy Archive + Live Infrastructure Runbook Summary

**Twelve 2019-era legacy artifacts relocated into `legacy/` via `git mv` (history intact), paired with a 183-line `website/DEPLOY.md` runbook that lets the user execute the entire live Coolify/Listmonk/Resend/DNS cutover without further engineering input.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-06T20:22:07Z (approx.)
- **Completed:** 2026-08-06T20:25:38Z
- **Tasks:** 2
- **Files modified:** 2 created (`legacy/README.md`, `website/DEPLOY.md`); 192 files relocated via `git mv`

## Accomplishments
- All twelve D-12 legacy artifacts (`index.html`, `randevu.mp3`, `Gruntfile.js`, `package.json`, `yarn.lock`, `scss/`, `js/`, `css/`, `fonts/`, `img/`, `json/`, `files/`) moved into `legacy/` via `git mv`, confirmed as git renames (not delete+add), with `git log --follow` reaching the original 2019 commits
- `legacy/README.md` documents the archive's purpose, its exclusion from the Docker build context, and that deletion is deferred to milestone cleanup
- Repo root reduced to exactly `CLAUDE.md`, `legacy/`, `website/`, `.planning/` (plus untracked scratch files, unaffected)
- `website/DEPLOY.md` (183 lines) authored as a complete, checkbox-driven runbook covering all four required sections — Coolify static site application, Listmonk + Postgres, Resend domain & DNS, and post-cutover verification
- Zero secret values or invented account-specific placeholders committed — verified by two negative-grep acceptance criteria (API-key-shaped and password-assignment-shaped literals)
- `npm run build --prefix website` still exits 0 after the legacy move, confirming Plan 01's pipeline is unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Archive the 2019 placeholder into legacy/** - `26463e6` (feat)
2. **Task 2: Author website/DEPLOY.md — the complete user-executed live runbook** - `8b5564a` (docs)

**Plan metadata:** pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS)

## Files Created/Modified
- `legacy/README.md` - archive purpose, build-context isolation, deferred-deletion note
- `website/DEPLOY.md` - the complete live-cutover runbook (Coolify app, Listmonk+Postgres, Resend/DNS, verification checklist)
- `legacy/index.html`, `legacy/randevu.mp3`, `legacy/Gruntfile.js`, `legacy/package.json`, `legacy/yarn.lock`, `legacy/scss/`, `legacy/js/`, `legacy/css/`, `legacy/fonts/`, `legacy/img/`, `legacy/json/`, `legacy/files/` - relocated via `git mv`, contents untouched

## Decisions Made
- Followed D-12's authoritative twelve-item enumeration over RESEARCH.md's prose count of ten — moved all twelve by explicit name.
- DEPLOY.md presents Coolify's built-in Direction/Force-HTTPS setting as the primary redirect mechanism, naming hand-written Traefik labels only as a fallback for an older Coolify version lacking that UI control (per RESEARCH.md assumption A3).
- DEPLOY.md instructs the Listmonk one-click service picker over a hand-modified compose file, per the documented Coolify private-fork template bug (RESEARCH.md Pitfall 4).
- DEPLOY.md places the domain-binding collision check as the very first Section 1 step, flagged as the most likely stall point in the cutover.
- Resend SMTP values (host/port/auth) are recorded with an explicit "cross-check before saving" instruction, since RESEARCH.md sourced them at LOW confidence from WebSearch synthesis (assumption A2).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** See [website/DEPLOY.md](../../../website/DEPLOY.md) for:
- Coolify static site application setup (domain-binding collision check, Base Directory, Build Pack, Domains, Direction, Force HTTPS)
- Listmonk + Postgres one-click deploy at `mail.darlng.com`, admin password change, SMTP configuration, fan list creation with double opt-in
- Resend domain verification and DNS records (SPF/DKIM/DMARC) at LWS
- Where to paste `PUBLIC_LISTMONK_URL` / `PUBLIC_LISTMONK_LIST_UUID` into Coolify's environment-variable UI for Phase 4
- A copy-pasteable post-cutover verification checklist covering roadmap success criteria 2 through 5

This is the local-only scope revision's expected outcome: all live infrastructure work is deferred to the user, executed from this runbook.

## Next Phase Readiness

- Phase 1 is code-complete: the Astro scaffold, Dockerfile/nginx pipeline (Plan 01), legacy archive, and live-cutover runbook (Plan 02) are all in place.
- `website/` is unambiguously the site at the repo level; nothing further is needed from engineering before the user executes `website/DEPLOY.md`.
- Blocker for full roadmap completion: roadmap success criteria 2-5 (live domain serving, redirects, cache headers, Listmonk reachability) remain unverified until the user completes the live cutover — this is expected per the 2026-08-04 scope revision, not a phase defect.
- Phase 4's `PUBLIC_LISTMONK_URL` / `PUBLIC_LISTMONK_LIST_UUID` env vars now have both a documented origin (Listmonk list creation in DEPLOY.md Section 2) and a documented destination (Coolify env vars for the static site app).
- No blockers for starting Phase 2 (Brand, Data & Base Layout) — it does not depend on the live cutover being complete.

---
*Phase: 01-infrastructure-deploy*
*Completed: 2026-08-06*

## Self-Check: PASSED

Verified on disk: `legacy/index.html`, `legacy/Gruntfile.js`, `legacy/README.md`, `website/DEPLOY.md` all present. Verified in git log: commits `26463e6` and `8b5564a` both present.
