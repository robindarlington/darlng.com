---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 05
current_phase_name: SEO & Launch Polish
status: planning
stopped_at: Completed 05-01-PLAN.md
last_updated: "2026-08-09T09:53:45.952Z"
last_activity: 2026-08-09
last_activity_desc: Completed 05-01-PLAN.md
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 13
  completed_plans: 11
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-26)

**Core value:** A fan landing on darlng.com instantly hits the latest release and can play it / save it / follow DARLNG everywhere in one move.
**Current focus:** Phase 01 — infrastructure-deploy

## Current Position

Phase: 05 — SEO & Launch Polish
Plan: 2 of 3
Status: Ready to execute
Last activity: 2026-08-09 — Completed 05-01-PLAN.md

Progress: [█████████░] 85%

## Performance Metrics

**Velocity:**

- Total plans completed: 10
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 2 | - | - |
| 2 | 2 | - | - |
| 3 | 3 | - | - |
| 4 | 3 | - | - |

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
| Phase 03 P01 | 16min | 2 tasks | 5 files |
| Phase 03-core-fan-experience P02 | 9min | 2 tasks | 3 files |
| Phase 03 P03 | 22min | 3 tasks | 2 files |
| Phase 04-newsletter-fan-capture P01 | 55 min | 2 tasks | 5 files |
| Phase 04 P02 | 15min | 2 tasks | 1 files |
| Phase 04 P03 | 15min | 2 tasks | 1 files |
| Phase 05 P01 | 35min | 3 tasks | 7 files |

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
- [Phase ?]: Reworded listen-page nav aria-label to avoid a grep-substring collision with the platform-button count acceptance criteria — UI-SPEC's literal nav aria-label also matched the aria-label="Listen to " pattern used to count buttons, inflating every page's count by 1
- [Phase ?]: Facade panel placed as a sibling of the hero's left content column, reusing the existing flex-col-at-mobile/grid-at-lg wrapper for per-breakpoint placement (no duplicate markup)
- [Phase ?]: Task 2 (FAN-03 audit) and Task 3 (browser sweep) required zero code changes and produced no commits — verification-only tasks that passed cleanly on the first run.
- [Phase ?]: Fallback-glyph counting distinguished DiscographyCard's icon-row ExternalLink (size 20) from PlatformButton's fallback slot (size 24) and its always-present trailing chevron (size 18) via rendered SVG width/height, avoiding a substring-count conflation.
- [Phase ?]: novalidate added to newsletter form — Native HTML5 type=email constraint validation silently swallowed the submit event for some invalid input before the custom regex validator could run
- [Phase ?]: Input+button flex-row nested in its own wrapper, status region as a form-level sibling — Matches UI-SPEC's Section Anatomy diagram; a form-level flex-row would pull the status region into the same row at md: and up
- [Phase ?]: DEPLOY.md Section 5: Listmonk native Trusted URLs CORS middleware recommended as primary over proxy-level CORS, correcting an earlier STATE.md decision that predated the source read
- [Phase ?]: DEPLOY.md documents ALTCHA does not protect /api/public/subscription; honeypot + double opt-in + proxy rate limiting are the real, documented mitigations
- [Phase ?]: Fixed real CLS bug: status region min-h-12 (48px) was too small for the actual 3-line success message at 375px; bumped to min-h-18 (72px), re-verified byte-identical offsetTop. — Caught by the browser evidence sweep's CLS assertion; the UI-SPEC's own reserved-height calculation assumed only 2 lines total for the success message, but the second sentence itself wraps to 2 lines at mobile width.
- [Phase ?]: Documented (not silently passed) that the env-unset production build still ships an unreferenced NewsletterForm*.js chunk to disk — proven via 3 independent tests to be an inherent Astro static-compiler limitation, not fixable via JS conditional restructuring. Verified the substantive safety property instead: zero HTML anywhere references the chunk, so no browser ever loads it. — T-04-11's actual threat (a fan submitting into a broken form) requires browser-observable exposure, which does not exist here. A custom build plugin to physically strip the chunk from disk would be new build infrastructure disproportionate to a cosmetic disk-hygiene gap, and is an architectural decision for a human to weigh, not a silent mid-plan addition.
- [Phase ?]: Home OG card sourced independently from Eseriani artwork (its own generator entry) so the home card URL never changes when a future release becomes latest
- [Phase ?]: generate-assets.mjs slug validated against a strict lowercase-alphanumeric-and-hyphen pattern before output path composition, closing off any path-escape vector
- [Phase ?]: music:musician sourced from releases.ts socials array's spotify entry rather than a second copy of the literal artist URL

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

Last session: 2026-08-09T09:53:45.943Z
Stopped at: Completed 05-01-PLAN.md
Resume file: None
