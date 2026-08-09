# Roadmap: DARLNG

## Overview

A five-phase build for the DARLNG artist release hub at darlng.com. Infrastructure and Listmonk backend go first — both must be live before any fan-facing work can be fully tested. Design tokens and the typed release data model land second, establishing the visual system and single source of truth that every component depends on. The core fan experience (hero, discography, listen pages, social links) builds third on top of those foundations. Newsletter fan-capture follows as its own integration phase, isolated because it is the only external-dependency integration that fails silently (CORS). The final phase polishes SEO metadata, Open Graph cards, and Core Web Vitals before launch.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Infrastructure & Deploy** - Scaffold Astro project, wire Coolify deploy, confirm darlng.com resolves, and get Listmonk running (completed 2026-08-06)
- [x] **Phase 2: Brand, Data & Base Layout** - Establish WCAG-verified dark palette, base layout, and typed releases.ts data model (completed 2026-08-07)
- [x] **Phase 3: Core Fan Experience** - Build hero, discography, listen-everywhere pages, and social follow links (completed 2026-08-08)
- [x] **Phase 4: Newsletter Fan Capture** - Wire NewsletterForm to Listmonk with CORS, ALTCHA, and double opt-in (completed 2026-08-08)
- [ ] **Phase 5: SEO & Launch Polish** - Per-page Open Graph, sitemap, robots.txt, and Core Web Vitals green

## Phase Details

### Phase 1: Infrastructure & Deploy

**Goal**: The Astro project builds and deploys cleanly to darlng.com via Coolify, with correct TLS/redirects, nginx cache headers, and a live Listmonk instance ready for newsletter wiring.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):

  1. `npm run build` inside `website/` produces a clean `dist/` with an `_astro/` directory and no errors
  2. Visiting `https://darlng.com` serves the new Astro build (not the legacy 2019 placeholder) — confirmed by the absence of the old jQuery/Grunt markup
  3. `curl -I https://www.darlng.com` returns a 301 redirect to `https://darlng.com` with no redirect loop; `curl -I http://darlng.com` returns 301 to HTTPS
  4. `curl -I https://darlng.com/index.html` shows `Cache-Control: no-cache`; `curl -I https://darlng.com/_astro/` shows `Cache-Control: public, max-age=31536000, immutable`
  5. Listmonk admin panel is reachable at its subdomain, logged in with a non-default password, and has a fan list created with double opt-in enabled

**Content inputs needed:** Confirm which subdomain Listmonk runs on (e.g. `mail.darlng.com`); confirm Coolify application name and Base Directory is set to `website/`.

**Plans**: 2/2 plans executed

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md

**UI hint**: yes

### Phase 2: Brand, Data & Base Layout

**Goal**: A verified dark/moody design token system is in place with all color pairs passing WCAG AA contrast, the base layout renders correctly with Fontsource fonts, and `src/data/releases.ts` contains complete typed data for all four releases including cover art, embed configs, and platform links — ready for every page to consume.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04
**Success Criteria** (what must be TRUE):

  1. Every color token pair (body text on background, accent on background, heading on background) measures at least 4.5:1 contrast ratio — verified with a contrast checker, not by eye
  2. A skeleton page at `https://darlng.com` renders the base layout with correct fonts, dark background, and responsive single-column mobile / multi-column desktop behavior
  3. `src/data/releases.ts` contains all four releases (Eseriani 2026, Randevu 2024, Brave 2020, Open Wide 2019) with complete `links[]` arrays and cover art imported as `ImageMetadata` from `src/assets/releases/`
  4. `npm run build` still produces a clean build with Sharp-processed cover art WebP/AVIF output in `dist/`

**Content inputs needed (must be gathered before or during this phase):**

- High-resolution cover art for all four releases → committed to `src/assets/releases/`
- Final streaming URLs (Spotify, Apple Music, YouTube, Tidal, Amazon Music, Deezer, SoundCloud) for every release
- Embed iframe src URLs (YouTube for Eseriani; confirm embed sources for Randevu, Brave, Open Wide)
- Brand font decision (typeface(s) for DARLNG identity — not yet specified in PROJECT.md)

**Plans**: 2/2 plans executed

Plans:

- [x] 02-01-PLAN.md — Tracer: design tokens, self-hosted fonts, typed `releases.ts` contract, base Layout/Header/Footer, skeleton page with Sharp-processed cover art, and the WCAG AA `check:contrast` build gate
- [x] 02-02-PLAN.md — Full four-release catalog with all 22 platform links, `BrandIcon` + five-platform social-follow rows in header and footer, Layout-wrapped 404, and browser verification at 375/768/1440

**UI hint**: yes

### Phase 3: Core Fan Experience

**Goal**: A fan landing on darlng.com encounters the full cinematic hero for Eseriani with embed player and streaming CTAs, can browse the back-catalog discography, navigate to a per-release listen-everywhere page with branded platform buttons, and follow DARLNG on all social platforms.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: HERO-01, HERO-02, MUSIC-01, MUSIC-02, LISTEN-01, FAN-03
**Success Criteria** (what must be TRUE):

  1. The hero on `https://darlng.com` shows the Eseriani cover art full-bleed with title, artist name, and visible streaming CTA buttons for at minimum Spotify, Apple Music, and YouTube — all links open the correct destination
  2. A Spotify/YouTube embed player is present in the hero section and plays Eseriani on click; the page's LCP element is the hero image (not the iframe) as confirmed by PageSpeed Insights
  3. The discography section displays Randevu, Brave, and Open Wide as cards with cover art, title, year, and working outbound streaming links — no embeds for back catalog
  4. `https://darlng.com/listen/eseriani` (and `/listen/randevu`, `/listen/brave`, `/listen/open-wide`) renders a branded per-platform listen page with buttons for all configured platforms
  5. Social follow links for Spotify artist profile, Instagram, TikTok, and YouTube are present in the site header or footer and open the correct profiles

**Plans**: 3/3 plans executed

Plans:

- [x] 03-01-PLAN.md — Tracer: full-bleed Eseriani hero (LCP `<Picture>`, scrim, CTA pills) wired end-to-end through `platform-icons.ts` and `PlatformButton.astro` to four `getStaticPaths`-generated `/listen/[slug]` pages, browser-verified at 375/768/1440
- [x] 03-02-PLAN.md — Zero-JS-until-click `YouTubeFacade.astro` mounted in the hero: local Sharp thumbnail, accent play button, click-injected `youtube-nocookie` embed, proven third-party-request-free pre-click
- [x] 03-03-PLAN.md — "The Catalog" discography grid (`DiscographyCard.astro`), FAN-03 follow-anchor audit plus the phase-wide `target="_blank"`/`rel` invariant gate, and the full-phase browser sweep

**UI hint**: yes

### Phase 4: Newsletter Fan Capture

**Goal**: A fan can submit their email on the homepage newsletter section, receive a double opt-in confirmation email from Listmonk, and confirm their subscription — with ALTCHA spam protection active and CORS correctly configured so cross-origin form submission works from the live darlng.com domain.
**Mode:** mvp
**Depends on**: Phase 1, Phase 3
**Requirements**: FAN-01, FAN-02
**Success Criteria** (what must be TRUE):

  1. Submitting a real email in the newsletter form at `https://darlng.com` delivers a confirmation email to that inbox within two minutes — verified from the live deployed domain, not localhost
  2. The form shows distinct success ("Check your inbox to confirm"), error (network/API failure), and already-subscribed states — each visible without refreshing the page
  3. Bot mitigation active: honeypot field silently drops bot submissions client-side, double opt-in prevents list pollution server-side, and DEPLOY.md documents proxy-layer rate limiting for the subscription endpoint. (AMENDED 2026-08-08: Listmonk's public API endpoint does not support ALTCHA — verified from Listmonk source, cmd/public.go; ALTCHA only guards its hosted /subscription/form page. Original criterion unsatisfiable as worded.)
  4. SPF, DKIM, and DMARC DNS records for the Listmonk sending domain pass mxtoolbox.com verification — confirmation emails do not land in spam

**Content inputs needed:** Listmonk list UUID (available after Phase 1 list creation) → set as `PUBLIC_LISTMONK_LIST_UUID` in Coolify environment variables.

**Plans**: 2/3 plans executed

Plans:

- [x] 04-01-PLAN.md — Tracer: `NewsletterForm.tsx` Preact island wired end-to-end to a zero-dependency `node:http` Listmonk mock, then the full six-state machine (validation, network failure, already-subscribed, silent honeypot, `<noscript>`), mounted behind the build-time env gate in `index.astro`
- [x] 04-02-PLAN.md — `DEPLOY.md` newsletter runbook: endpoint gates, exactly one CORS authority (`trusted_urls` primary), the honest ALTCHA finding plus pasteable proxy rate-limit recipes, and the deferred live checklist (real confirmation email, mxtoolbox, manual bot POST)
- [x] 04-03-PLAN.md — Browser evidence sweep of every state at 375/768/1440 with zero-CLS, pre-hydration, live-region and in-flight-guard assertions, plus both production build gates (section + island ship only when both env vars are set)

### Phase 5: SEO & Launch Polish

**Goal**: Every page has correct per-page Open Graph and Twitter Card meta with absolute production URLs, the sitemap and robots.txt are generated and discoverable, and the site passes Core Web Vitals targets (LCP <2.5s, CLS <0.1, TBT <200ms) on the live domain.
**Mode:** mvp
**Depends on**: Phase 3, Phase 4
**Requirements**: SEO-01, SEO-02, PERF-01, PERF-02
**Success Criteria** (what must be TRUE):

  1. Pasting `https://darlng.com` and `https://darlng.com/listen/eseriani` into opengraph.xyz shows the correct 1200x630 release artwork, title, and description — no "image not found" or relative-URL failures
  2. `https://darlng.com/sitemap.xml` and `https://darlng.com/robots.txt` return 200 with correct content
  3. Lighthouse run on the live `https://darlng.com` homepage shows LCP <2.5s, CLS <0.1, and TBT <200ms in the lab data
  4. Axe automated scan on the live site shows zero color contrast violations and zero critical accessibility failures

**Plans**: 1/3 plans executed

Plans:

- [x] 05-01-PLAN.md — Tracer: build-time Sharp OG card generator wired as a `prebuild` hook, `Layout.astro` extended with absolute-URL Open Graph + Twitter Card meta, and all six pages carrying their own card (`music.album` + `music:musician` on listen pages, `noindex` on 404)
- [ ] 05-02-PLAN.md — Hand-authored DARLNG `D` favicon rasterized into `.ico` (hand-rolled container, no new dep) and a 180x180 apple-touch icon, plus `robots.txt` pointing at the sitemap index and an nginx `/sitemap.xml` route
- [ ] 05-03-PLAN.md — Lighthouse against the built `dist/` served by the real `nginx.conf` (LCP/CLS/TBT green across four runs), impact-filtered axe scan on three pages, and the DEPLOY.md live-domain deferred checks

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure & Deploy | 2/2 | Complete    | 2026-08-06 |
| 2. Brand, Data & Base Layout | 2/2 | Complete    | 2026-08-07 |
| 3. Core Fan Experience | 3/3 | Complete    | 2026-08-08 |
| 4. Newsletter Fan Capture | 3/3 | Complete    | 2026-08-08 |
| 5. SEO & Launch Polish | 1/3 | In Progress|  |
