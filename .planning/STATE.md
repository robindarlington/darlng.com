---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Phase 1 context gathered
last_updated: "2026-07-07T06:44:11.811Z"
last_activity: 2026-06-26 — Roadmap created; ready to plan Phase 1
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-26)

**Core value:** A fan landing on darlng.com instantly hits the latest release and can play it / save it / follow DARLNG everywhere in one move.
**Current focus:** Phase 1 — Infrastructure & Deploy

## Current Position

Phase: 1 of 5 (Infrastructure & Deploy)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-06-26 — Roadmap created; ready to plan Phase 1

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: Astro 5 + Tailwind 4 + Preact + MDX in `website/` subdirectory; deploy via Coolify/Hetzner nginx static container
- Pre-roadmap: `src/data/releases.ts` (plain TS file) chosen over MDX content collections for typed release catalog driving hero, discography, and listen pages
- Pre-roadmap: Listmonk self-hosted for newsletter; CORS at Traefik/nginx proxy layer (not app layer) to avoid duplicate-header rejection
- Pre-roadmap: Own "listen everywhere" page at `/listen/[slug]` instead of third-party smart link; Spotify Follow Button deprecated — use plain profile link

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

Last session: 2026-07-07T06:44:11.803Z
Stopped at: Phase 1 context gathered
Resume file: .planning/phases/01-infrastructure-deploy/01-CONTEXT.md
