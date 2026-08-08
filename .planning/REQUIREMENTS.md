# Requirements: DARLNG

**Defined:** 2026-06-26
**Core Value:** A fan landing on darlng.com instantly hits the latest release and can play it / save it / follow DARLNG everywhere in one move.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases. (All P1 table stakes from research.)

### Infrastructure & Deploy

- [x] **INFRA-01**: Astro 5 project scaffolded in `website/` subdirectory, pinned to `astro@^5.18.2` with aligned `@astrojs/mdx@^4.x` + `@astrojs/preact@^4.x` + Tailwind 4, building cleanly to static `dist/`
- [x] **INFRA-02**: Site deploys to existing Coolify-on-Hetzner setup with Base Directory `website/`, a custom `nginx.conf` (correct 404 handling + cache headers), and serves the static build at darlng.com
- [x] **INFRA-03**: Apex/www + HTTPS resolve correctly (Cloudflare SSL "Full (Strict)", www→apex redirect) with no redirect loops
- [x] **INFRA-04**: Self-hosted Listmonk instance is reachable and configured (target list created, double opt-in enabled) so the newsletter form has a live backend

### Brand & Layout

- [x] **BRAND-01**: Dark, moody visual identity (deep black base, single jewel/neon accent, cinematic typography) distinct from robindarlington.com
- [x] **BRAND-02**: Design tokens (color palette + accent) verified to meet WCAG AA contrast (4.5:1 text, 3:1 large text) before component build
- [x] **BRAND-03**: Mobile-first responsive layout — single-column on mobile, grid/flex on desktop
- [x] **BRAND-04**: Base layout, fonts (Fontsource), and shared nav/footer with social-follow anchors

### Hero & Music

- [x] **HERO-01**: Cinematic full-bleed hero featuring the latest release (*Eseriani*, 2026) with artwork, release title, and primary streaming CTAs (Spotify, Apple Music, YouTube)
- [x] **HERO-02**: Spotify player embedded for the latest release, above-the-fold WITHOUT `loading="lazy"` (facade pattern to protect LCP)
- [x] **MUSIC-01**: Discography section presenting the back catalog (Randevu 2024, Brave 2020, Open Wide 2019) as a grid with cover art, title, and year
- [x] **MUSIC-02**: Each back-catalog release links out to its streaming platforms via clean native links (no embeds for back catalog)

### Listen & Fan Capture

- [x] **LISTEN-01**: Native, fully-branded "listen everywhere" page with per-platform buttons (Spotify, Apple Music, YouTube/YouTube Music, Tidal, Amazon Music, Deezer, SoundCloud) for the latest release plus catalog access — no third-party smart link
- [ ] **FAN-01**: Inline newsletter signup (email field) that POSTs to the self-hosted Listmonk `/api/public/subscription` endpoint, with double opt-in and ALTCHA/honeypot spam protection
- [ ] **FAN-02**: Newsletter form shows clear success / error / already-subscribed states to the fan
- [x] **FAN-03**: Social follow links (Spotify artist profile, Instagram, TikTok, YouTube) as plain icon links — no Spotify Follow Button widget

### Discoverability & Performance

- [ ] **SEO-01**: Per-page Open Graph + Twitter Card meta (`og:title`, `og:description`, `og:image` 1200×630 release artwork at absolute production URLs, `og:type` music.album where applicable)
- [ ] **SEO-02**: Sitemap (`@astrojs/sitemap`) and robots.txt generated
- [ ] **PERF-01**: Core Web Vitals pass (LCP <2.5s, CLS <0.1, TBT <200ms) verified via Lighthouse before ship — hero image via Sharp/srcset, fonts preloaded, below-fold embeds lazy-loaded
- [ ] **PERF-02**: Cover art and press images optimized with Sharp (responsive `srcset`, fixed dimensions to prevent CLS)

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap. (P2 — add after v1 is live and stable.)

### Discoverability

- **SCHEMA-01**: Schema.org JSON-LD — `MusicGroup`/`Person` for the artist + `MusicAlbum` per release (with `byArtist`, `datePublished`, `genre`, `sameAs`), validated against Google Rich Results
- **PAGES-01**: Per-release shareable sub-pages (`/eseriani`, `/randevu`, `/brave`, `/open-wide`) with own artwork, platform buttons, and per-release OG image

### Insight & Polish

- **ANALYTICS-01**: Privacy-first, cookieless analytics (self-hosted Umami or Plausible on Coolify) — no cookie banner
- **MOTION-01**: Subtle scroll-reveal / entrance animations respecting `prefers-reduced-motion`

## Out of Scope

Explicitly excluded. Documented to prevent scope creep. (P3 — requires an external trigger.)

| Feature | Reason |
|---------|--------|
| Full EPK / press page | Audience is fans, not bookers/press. Add only if booking/press inquiries arrive via the site. |
| Tour / live dates section | No live shows in scope; a blank dates section is worse than none. Add when shows are booked. |
| Merch / store | Payment/inventory/fulfilment is large scope for a static v1. Link out to Bandcamp/Shopify if demand emerges. |
| Dynamic CMS / blog / news feed | Higher complexity than value; the newsletter covers fan updates. |
| Third-party smart links (Linkfire/Feature.fm/ToneDen) | Catalog is already released — own branded page is strictly better. Revisit only for a future pre-save campaign. |
| Spotify Follow Button widget | Deprecated by Spotify (2021), <0.1% of follows, extra JS. Use a plain profile link. |
| Exit-intent popup / newsletter modal | Intrusive; conflicts with the cinematic aesthetic. Inline section instead. |
| Multi-language / localisation | Maintenance overhead for a solo site; platforms localise on their end. |
| Countdown / pre-save flow | Nothing unreleased in v1 scope. Add per-campaign for a future drop. |
| Video / music-video gallery | YouTube embeds add LCP weight; link to the YouTube channel instead. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| BRAND-01 | Phase 2 | Complete |
| BRAND-02 | Phase 2 | Complete |
| BRAND-03 | Phase 2 | Complete |
| BRAND-04 | Phase 2 | Complete |
| HERO-01 | Phase 3 | Complete |
| HERO-02 | Phase 3 | Complete |
| MUSIC-01 | Phase 3 | Complete |
| MUSIC-02 | Phase 3 | Complete |
| LISTEN-01 | Phase 3 | Complete |
| FAN-01 | Phase 4 | Pending |
| FAN-02 | Phase 4 | Pending |
| FAN-03 | Phase 3 | Complete |
| SEO-01 | Phase 5 | Pending |
| SEO-02 | Phase 5 | Pending |
| PERF-01 | Phase 5 | Pending |
| PERF-02 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 20 total
- Mapped to phases: 20 ✓
- Unmapped: 0

---
*Requirements defined: 2026-06-26*
*Last updated: 2026-06-26 after roadmap creation*
