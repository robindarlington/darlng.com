# DARLNG

## What This Is

The official artist website for **DARLNG**, an Afro/RnB/Pop artist. It's a dark, moody, fan-facing **release hub**: a cinematic landing that spotlights the latest drop, funnels listeners out to every streaming platform, and converts visitors into followers via a self-hosted newsletter. Built for fans (not industry/EPK use), it lives at **darlng.com** and is a fresh rebuild — a clean break in branding from the artist's other identity site, robindarlington.com.

## Core Value

A fan landing on darlng.com instantly hits the latest release and can play it / save it / follow DARLNG everywhere in one move. If everything else fails, the latest-release hero and its streaming links must work.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hero spotlighting the latest release (*Eseriani*, 2026) with an embedded player and primary streaming CTAs
- [ ] Music / discography section covering the back catalog (Randevu 2024, Brave 2020, Open Wide 2019) — a mix of embeds (hero/latest) and clean native streaming links (rest)
- [ ] Native, fully-branded "listen everywhere" page with per-platform buttons (Spotify, Apple Music, YouTube, etc.) — replaces third-party smart links for already-released music
- [ ] Newsletter signup wired to a self-hosted **Listmonk** instance on Coolify (fan capture)
- [ ] Follow/social links (Spotify, Instagram, TikTok, YouTube)
- [ ] Dark & moody visual identity distinct from robindarlington.com — deep blacks, neon/jewel accents, cinematic late-night RnB feel
- [ ] Static Astro build deployable to existing Coolify-on-Hetzner setup, served at darlng.com

### Out of Scope

- Full EPK / press kit (bio, photos, press quotes, tech rider) — audience is fans, not bookers/industry. Revisit if booking demand appears.
- Tour / live dates section — not part of v1 focus (release hub + fan capture).
- Third-party pre-save smart links (Linkfire / Feature.fm / ToneDen) — own branded page is better for already-released catalog. Can slot a service in later for a *future* drop where real pre-save (fan authorizes Spotify, auto-saves on release day) is wanted.
- Merch / store — not in scope for v1.
- Dynamic CMS / blog — content is hand-curated at build time; no posts/news feed for v1.

## Context

- **Artist:** DARLNG (Spotify artist `0uXxSPfLr36OuyGDKiBzV3`). Releases to date: Eseriani (2026, latest), Randevu (2024), Brave (2020), Open Wide (2019). Real release assets are available to build around.
- **Greenfield rebuild in a subdirectory:** new site code lives in `website/`. The repo root currently holds a stale 2018–2019 placeholder (Grunt/SCSS/jQuery, old `index.html`, `randevu.mp3`) that the new site replaces — deliberately not mapped, as the rebuild shares no stack with it.
- **Sibling reference:** `/Users/rob/Desktop/projects/RobinDarlington/robindarlington.com` — same artist, different identity. Reuse its tech stack and patterns, but the DARLNG brand direction is intentionally distinct.
- **Self-hosting bias:** the user runs a Coolify instance on Hetzner and prefers self-hosted/own-infra solutions (Listmonk for email, native listen page) over SaaS where practical.

## Constraints

- **Tech stack**: Astro 5 + Tailwind 4 + Preact + MDX, with `@astrojs/sitemap`, Fontsource fonts, Lucide icons, Sharp — Mirror robindarlington.com so the two sites share tooling and mental model.
- **Location**: All new site code in `website/` subdirectory — keeps it isolated from the legacy placeholder at repo root.
- **Deployment**: Static build deployed via existing Coolify-on-Hetzner setup (Nixpacks or small Dockerfile/nginx serving the static `dist/`) — User's own infrastructure; no new SaaS hosting.
- **Email**: Self-hosted Listmonk on Coolify — Own-infra preference; signup form posts to Listmonk's subscription API/endpoint.
- **Audience**: Fans only — Scope and tone optimize for listener discovery and conversion, not industry credibility.
- **Branding**: Must be visually distinct from robindarlington.com — Separate artist identity; dark/moody vs. whatever the other site is.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro 5 + Tailwind 4 + Preact + MDX (mirror robindarlington.com) | Proven stack the user already runs; shared tooling across both artist sites | — Pending |
| Dark & moody aesthetic | Fits late-night Afro/RnB/Pop identity; differentiates from the other site | — Pending |
| Release hub, not full EPK | Audience is fans; goal is discovery + conversion, not bookings | — Pending |
| Build own "listen everywhere" page vs. third-party smart link | Catalog is already released (no pre-save needed); fully branded, no third party | — Pending |
| Self-hosted Listmonk for newsletter | User's own-infra preference; no SaaS fees or lock-in | — Pending |
| Deploy via Coolify on Hetzner (static build) | Reuses existing infrastructure | — Pending |
| New code in `website/`, leave legacy placeholder at root | Isolates fresh build from unrelated 2019 site | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-26 after initialization*


## Current State (v1.0 — 2026-08-09)

v1.0 Release Hub is code-complete and locally verified: cinematic Eseriani hero with click-to-load nocookie embed, catalog + listen-everywhere pages for all 4 releases, Listmonk-ready newsletter island, launch-grade OG/sitemap/favicon/perf (h2 Lighthouse green, axe clean). Archived: `.planning/milestones/v1.0-ROADMAP.md`.

**Awaiting user:** final visual sign-off + live cutover per `website/DEPLOY.md` (Coolify app, Listmonk+Postgres, Resend SMTP, LWS DNS, env vars, post-cutover checks).

## Next Milestone Goals (candidates)

v2 backlog: SCHEMA-01 (JSON-LD), PAGES-01 (per-release sub-pages), ANALYTICS-01 (self-hosted analytics), MOTION-01 (scroll-reveal animations). Define via `/gsd-new-milestone`.
