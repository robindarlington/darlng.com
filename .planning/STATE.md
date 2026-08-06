---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 2
current_phase_name: Brand, Data & Base Layout
status: executing
stopped_at: Completed 02-02-PLAN.md
last_updated: "2026-08-06T21:41:25.610Z"
last_activity: 2026-08-06
last_activity_desc: Completed 02-01-PLAN.md
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-26)

**Core value:** A fan landing on darlng.com instantly hits the latest release and can play it / save it / follow DARLNG everywhere in one move.
**Current focus:** Phase 01 — infrastructure-deploy

## Current Position

Phase: 2 — Brand, Data & Base Layout
Plan: 2 of 02 complete
Status: Ready to execute
Last activity: 2026-08-06 — Completed 02-01-PLAN.md

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 2
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 2 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 17 min | 3 tasks | 11 files |
| Phase 01 P02 | 15 min | 2 tasks | 2 files |
| Phase 02 P01 | 20min | 3 tasks | 10 files |
| Phase 02 P02 | 9min | 3 tasks | 9 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: Astro 5 + Tailwind 4 + Preact + MDX in `website/` subdirectory; deploy via Coolify/Hetzner nginx static container
- Pre-roadmap: `src/data/releases.ts` (plain TS file) chosen over MDX content collections for typed release catalog driving hero, discography, and listen pages
- Pre-roadmap: Listmonk self-hosted for newsletter; CORS at Traefik/nginx proxy layer (not app layer) to avoid duplicate-header rejection
- Pre-roadmap: Own "listen everywhere" page at `/listen/[slug]` instead of third-party smart link; Spotify Follow Button deprecated — use plain profile link
- [Phase ?]: Pinned @tailwindcss/vite + tailwindcss to exact 4.1.16 and added npm overrides.vite:^6.4.1 to eliminate a real astro-check type error caused by vite version skew — Caret range on @tailwindcss/vite resolved to 4.3.3 which peer-requires a newer vite than astro's internally bundled vite@6.4.1, producing incompatible Plugin<any> types
- [Phase ?]: D-12's twelve-item legacy artifact list is authoritative over RESEARCH.md's prose count of ten — All twelve moved by explicit name via git mv to preserve history
- [Phase ?]: DEPLOY.md documents Coolify's built-in Direction/Force-HTTPS setting as primary, hand-written Traefik labels as fallback only — Standard supported path per RESEARCH.md, avoids known label-authoring bugs
- [Phase ?]: Extracted SocialLink's inline platform union into a SocialPlatform type alias to avoid a grep-count collision with the interface declaration line while keeping identical closed-union type safety

### Pending Todos

Content that must be gathered before Phase 2 can complete:

- Cover art (hi-res) for all 4 releases → `src/assets/releases/`
- Final streaming URLs per release (Spotify, Apple Music, YouTube, Tidal, Amazon Music, Deezer, SoundCloud)
- Embed iframe src URLs (YouTube for Eseriani confirmed; Randevu/Brave/Open Wide TBD)
- Brand font(s) for DARLNG identity (not yet decided)
- Listmonk list UUID → available after Phase 1 Listmonk setup

### Blockers/Concerns

- Content gap: streaming URLs and cover art must be ready before Phase 2 data model is finalized
- Listmonk list UUID not available until Phase 1 Listmonk instance is live — needed for Phase 4 env vars

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | SCHEMA-01: Schema.org JSON-LD | Deferred | Roadmap |
| v2 | PAGES-01: Per-release sub-pages | Deferred | Roadmap |
| v2 | ANALYTICS-01: Self-hosted analytics | Deferred | Roadmap |
| v2 | MOTION-01: Scroll-reveal animations | Deferred | Roadmap |

## Session Continuity

Last session: 2026-08-06T21:41:25.602Z
Stopped at: Completed 02-02-PLAN.md
Resume file: None
