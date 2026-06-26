# Project Research Summary

**Project:** DARLNG — artist release hub (darlng.com)
**Domain:** Fan-facing music release hub, static site + self-hosted newsletter
**Researched:** 2026-06-26
**Confidence:** HIGH

## Executive Summary

DARLNG.com is a static fan-facing release hub for an Afro/RnB/Pop artist: a cinematic hero spotlighting the latest release, streaming links across all platforms, a self-hosted newsletter for fan capture, and a back-catalog discography — nothing more. The research confirms this is a well-understood domain with established patterns. The recommended approach is an Astro 5 static build (pinned to `^5.18.2` to match the sibling site, robindarlington.com) with Tailwind 4, Preact islands only for the newsletter form and embed player, and deployment as a static nginx container on Coolify-on-Hetzner. Fan capture uses a self-hosted Listmonk instance. All data — four releases, their platform links, embed configs, and cover art — lives in a single typed TypeScript file (`src/data/releases.ts`) that drives every page: the hero, discography grid, and per-release listen pages. The build is entirely static with two small interactive islands; everything else is zero-JavaScript.

The primary technical risk is the cross-origin Listmonk newsletter integration: the static site at `darlng.com` must POST to a separate `mail.darlng.com` subdomain, which requires CORS headers at the nginx/Traefik reverse-proxy layer (not in both places). A secondary risk is Core Web Vitals: the Spotify/YouTube iframe in the hero will tank LCP if embedded naively above the fold, and unoptimised cover-art JPEGs will destroy mobile performance. Both are solved with well-documented patterns (iframe facade or `client:visible` deferral; Astro's `<Picture>` component with Sharp). The aesthetic risk — neon/jewel accents on near-black backgrounds failing WCAG contrast — must be addressed at the design-token stage, not retrofitted after component build.

The scope is intentionally narrow. No EPK, no tour dates, no CMS, no merch. The anti-feature list is as important as the feature list: the Spotify Follow Button widget is deprecated, third-party smart-link services add cost and lock-in for a catalog that has already released (pre-save is irrelevant), exit-intent popups conflict with the premium cinematic aesthetic, and dynamic CMS machinery is unnecessary complexity for four static releases. The newsletter (Listmonk, double opt-in, ALTCHA CAPTCHA) is the only server-side dependency and the only integration that requires external infrastructure to be running before the form is functional.

---

## Key Findings

### Recommended Stack

The stack is locked by constraint (PROJECT.md) and validated by research. Astro 5.x is the right pin — Astro 6 and 7 are both stable but require Node 22.12+ and break integration compatibility with the sibling site. Tailwind 4 requires the `@tailwindcss/vite` Vite plugin (the old `@astrojs/tailwind` integration is deprecated and broken with v4). Preact replaces React for islands because the only interactive components are a newsletter form and an embed wrapper — Preact's 3 KB vs React's ~40 KB is a clear win. The deployment target is a static Docker container (nginx:alpine) on Coolify, with the site code in `website/` inside the repo — Coolify's Base Directory must be set to `website/` or it will serve the legacy 2019 placeholder from the repo root.

**Core technologies:**
- `astro@^5.18.2`: Static site framework — zero-JS by default, island hydration for interactive components; pinned to 5.x to match sibling site
- `@tailwindcss/vite@^4.1.16`: CSS framework via Vite plugin — CSS-first `@theme {}` config, no `tailwind.config.js`; the Astro integration is deprecated
- `preact@^10.27.2` + `@astrojs/preact@^4.1.3`: Lightweight interactive islands — newsletter form and embed player only; 3 KB runtime
- `sharp@^0.34.5`: Image processing — required by Astro's `<Image>`/`<Picture>` for WebP/AVIF generation at build time; must be in direct dependencies, not devDependencies
- `lucide-astro@^0.556.0`: SVG icon components — inline SVG, no JS bundle; use this package (not `@lucide/astro`) to match sibling site
- Listmonk (self-hosted on Coolify): Newsletter backend — `POST /api/public/subscription` public endpoint; CORS must be set at the reverse proxy, not in app config

**Critical version notes:**
- `@astrojs/mdx@^4.x` and `@astrojs/preact@^4.x` are the Astro 5-era versions; the `^5.x` variants target Astro 6+
- Fontsource: use Astro 5's native font API (`fontProviders.fontsource()` in `astro.config.mjs`) rather than manual CSS imports

### Expected Features

**Must have (table stakes) — launch blockers:**
- Cinematic hero — Eseriani (2026) with full-bleed cover art, release title, streaming CTAs (Spotify, Apple Music, YouTube minimum)
- Spotify embed in the hero — above-fold placement, no `loading="lazy"` (that kills LCP); use facade pattern or `client:visible` to defer the iframe
- Discography section — Randevu (2024), Brave (2020), Open Wide (2019); cover art + per-platform links, no embeds needed for back catalog
- "Listen Everywhere" page (`/listen`) — branded per-platform buttons, on-domain, replaces third-party smart links
- Social follow links — Spotify artist profile, Instagram, TikTok, YouTube (plain icon links; the Spotify Follow Button widget is deprecated since 2021)
- Newsletter signup — inline section, single email field, POSTs to Listmonk; double opt-in required
- Open Graph meta tags — `og:image` must be an absolute URL pointing to 1200x630 artwork; per-page, not site-generic
- Dark/moody visual identity — deep black base (`#0a0a0a`), single jewel/neon accent, cinematic typography
- Accessible contrast — WCAG AA (4.5:1) on all text including accent-on-black; verified before component build
- Core Web Vitals pass — LCP <2.5s, CLS <0.1; Lighthouse green before first deploy

**Should have (add after v1 launches):**
- Schema.org JSON-LD (MusicGroup + MusicAlbum per release) — low effort, boosts SERP visibility; add once production domain is live
- Per-release sub-pages (`/listen/eseriani`, `/listen/randevu`, etc.) — shareable branded pages for each release
- Privacy-first analytics (Plausible or self-hosted Umami) — cookieless, no consent banner required; fits self-hosting preference
- Scroll-reveal entrance animations — polish pass; `prefers-reduced-motion` must be respected

**Defer to v2+ (requires external trigger):**
- Tour / live dates — trigger: shows are actually booked
- EPK / press page — trigger: booking/press requests arrive via the site
- Merch integration — trigger: merch exists; link out to Bandcamp/Shopify, do not build custom
- Pre-save campaign page — trigger: next unreleased drop is scheduled

**Anti-features (do not build):**
- Spotify Follow Button widget (deprecated 2021; use a plain artist profile link)
- Third-party smart-link services (Linkfire, Feature.fm, ToneDen) for already-released catalog
- Exit-intent popup / modal newsletter capture (conflicts with premium aesthetic)
- Dynamic CMS — four static releases, no CMS needed; newsletter handles updates
- Video gallery section — link to YouTube channel; embedded gallery adds LCP weight

### Architecture Approach

The site is fully static at build time. A single TypeScript data file (`src/data/releases.ts`) is the single source of truth for all release data — title, year, cover art (`ImageMetadata` imported for Sharp processing), per-platform links, and embed config. Pages import typed exports from this file; components receive typed props. Only two components are Preact islands: `NewsletterForm.tsx` (`client:load`) and `EmbedPlayer.tsx` (`client:visible`). Everything else — hero text, cover art, discography grid, platform link buttons, social links, header, footer — is zero-JS static Astro. The Listmonk form POSTs cross-origin via `fetch()`; CORS headers live at the nginx/Traefik proxy in front of Listmonk on Coolify. Static output is served via nginx:alpine in a multi-stage Dockerfile (not Nixpacks' default static mode) to get correct 404 routing, cache headers, and gzip.

**Major components:**
1. `src/data/releases.ts` — typed release catalog; single source of truth driving all three views
2. `layouts/BaseLayout.astro` — HTML shell, meta tags, Fontsource font imports, global Tailwind styles
3. `components/HeroRelease.astro` — full-bleed hero using `featuredRelease`; contains `EmbedPlayer` island and `ListenLinks`
4. `components/EmbedPlayer.tsx` (Preact island, `client:visible`) — Spotify/YouTube/Bandcamp iframe, deferred until scrolled into view
5. `components/DiscographyGrid.astro` + `components/ReleaseCard.astro` — back catalog grid with cover art and streaming links
6. `components/NewsletterForm.tsx` (Preact island, `client:load`) — controlled form, `fetch()` POST to Listmonk, honeypot field, success/error states
7. `components/SEO.astro` — Open Graph + Twitter card meta tags, per-page structured data
8. `pages/listen/[slug].astro` — SSG dynamic route; `getStaticPaths()` generates one static page per release

**Key patterns:**
- Static-first, islands only where interaction is required (two islands total)
- Single data import to multiple consumers (releases.ts drives hero, discography, listen pages)
- Cross-origin form submission via Listmonk public API (no SSR proxy — `output: 'static'` forbids server endpoints)
- Cover art in `src/assets/` (not `public/`) so Sharp processes it; pass `cover.src` string (not `ImageMetadata`) across the static/island boundary

### Critical Pitfalls

1. **Listmonk CORS rejection** — Configure CORS at exactly one place: the nginx/Traefik reverse proxy in front of Listmonk on Coolify. Both nginx and Listmonk's `config.toml` emitting the header causes duplicate-header browser rejection. Handle OPTIONS preflight explicitly (return 204). Always use the `always` flag on `add_header`. Test from the live deployed domain — it works locally (same-origin) but fails in production.

2. **Spotify/YouTube iframe tanking LCP and CLS** — Above-fold embeds must not use `loading="lazy"` (it defers the element that becomes LCP). Use the facade pattern: render static cover art + play icon, inject the real iframe only on click. Always wrap iframes in an `aspect-ratio` container to reserve layout space and prevent CLS. Use `client:visible` on the Preact island so the iframe does not load on page load at all.

3. **Neon accent colors failing WCAG contrast** — Saturated mid-range hues on near-black look vivid but often test at 2.8-3.2:1 luminance ratio, below the 4.5:1 AA threshold. Test all color tokens against the background before any component is built. Audit all four interaction states (default, hover, active, focus). Run Axe on the deployed site, not just the dev server.

4. **Coolify wrong base directory serving the legacy 2019 placeholder** — The Astro code lives in `website/`; the repo root contains a stale `index.html` and Grunt setup. If Coolify's Base Directory is left at `/`, Nixpacks will detect the wrong project and may serve the old placeholder. Set Base Directory to `website/`, Publish Directory to `dist`. Use a Dockerfile (not the Nixpacks static mode) to get correct 404 routing and cache headers.

5. **Listmonk bot signups without CAPTCHA** — The public subscription endpoint is unauthenticated by design. Without protection, bots will hammer it, burning mail relay reputation. Enable ALTCHA (Listmonk's self-hosted proof-of-work CAPTCHA) in Listmonk Settings before any public URL is exposed. Also enable double opt-in on the list. Rate-limit the subscription endpoint at the nginx layer as a secondary defence.

---

## Implications for Roadmap

Based on the combined research, the build has a clear dependency ordering. Infrastructure must precede newsletter integration; data model and design tokens must precede components; components must precede pages; pages must precede deploy.

### Phase 1: Infrastructure and Project Scaffold

**Rationale:** Two pre-conditions must be in place before any feature work: (a) Listmonk must be running and accessible on Coolify so the newsletter integration can be tested end-to-end, and (b) the `website/` Astro project must exist with the correct stack installed. Both are blocking dependencies for everything downstream. This phase also hardens Listmonk admin access and validates the Coolify deploy path so the wrong base directory does not silently serve the legacy placeholder at go-live.
**Delivers:** Running Listmonk instance on Coolify with hardened admin; Astro 5 project scaffolded in `website/` with all packages installed and `astro.config.mjs` configured; Dockerfile + nginx.conf written; first deploy to darlng.com confirms correct build path; www-to-apex redirect and Cloudflare Full (Strict) TLS in place
**Addresses:** Stack installation, Coolify deploy configuration, Listmonk setup
**Avoids:** Wrong Coolify base directory (Pitfall 7), Listmonk admin exposure (Pitfall 6), www/apex redirect loop (Pitfall 8)

### Phase 2: Design Tokens and Base Layout

**Rationale:** Design tokens (color palette, typography, spacing) must be established and contrast-verified before any component is built. Retrofitting failed contrast across all components is expensive. The `BaseLayout.astro`, global CSS with `@theme {}` block, font imports, and the `src/config/meta.ts` site config are shared dependencies of every page.
**Delivers:** Verified dark palette (background, surface, accent, text — all WCAG AA tested), Fontsource fonts integrated via Astro's font API, `BaseLayout.astro` with SEO component slot, Tailwind 4 `@theme` design token system, mobile-first responsive base
**Addresses:** Dark/moody visual identity, accessible contrast requirement
**Avoids:** Neon contrast failures (Pitfall 1), text-over-image legibility failures (Pitfall 2)

### Phase 3: Data Model and Release Assets

**Rationale:** `src/data/releases.ts` is the single source of truth that every page and component depends on. All cover art must be gathered and placed in `src/assets/releases/` so they can be imported as `ImageMetadata`. Building this before any UI component prevents the data shape from being driven by UI convenience rather than correctness.
**Delivers:** Typed `releases.ts` with all four releases (Eseriani, Randevu, Brave, Open Wide), complete platform links per release, embed configs, cover art imported and Sharp-ready, `featuredRelease` and `sortedReleases` derived exports
**Addresses:** Discography data, per-platform links, embed configuration
**Avoids:** Storing release data in MDX content collections (anti-pattern), cover art in `public/` bypassing Sharp

### Phase 4: Hero and Core Pages

**Rationale:** The hero exercises the most complex interaction of concerns: image optimization, embed performance, streaming CTAs, and mobile layout. Building it after the data model and base layout means all dependencies exist. The discography and listen pages share the same data and component patterns, so they build naturally in sequence.
**Delivers:** `index.astro` with cinematic full-bleed hero (Eseriani artwork, embed player with facade pattern, Spotify/Apple Music/YouTube CTAs); `music.astro` with back-catalog discography grid; `/listen/[slug].astro` SSG routes for all four releases; `SocialLinks.astro` in header/footer; newsletter inline section stub (form renders, Listmonk wiring in next phase)
**Addresses:** Hero, Spotify embed, streaming CTAs, discography, listen-everywhere pages, social follow links, Core Web Vitals pass
**Avoids:** Above-fold embed tanking LCP (Pitfall 3), unoptimised cover art

### Phase 5: Newsletter Integration

**Rationale:** Newsletter integration is the only server-side dependency and the only piece that requires the Listmonk instance from Phase 1 to be running. Isolating it to its own phase means the rest of the site is shippable without it, and the integration can be tested properly (real cross-origin POST from the deployed domain, not localhost) before the form is live. CAPTCHA must be in place before any public URL is exposed.
**Delivers:** `NewsletterForm.tsx` Preact island fully wired to Listmonk `POST /api/public/subscription`; CORS configured at Coolify Traefik/nginx proxy; ALTCHA CAPTCHA enabled in Listmonk settings; double opt-in confirmed; SPF/DKIM/DMARC DNS records for the sending domain; end-to-end test: form submit triggers confirmation email
**Addresses:** Newsletter signup, fan capture
**Avoids:** Listmonk CORS rejection (Pitfall 4), bot signups without CAPTCHA (Pitfall 5)

### Phase 6: SEO, Meta, and Polish

**Rationale:** Open Graph and Schema.org require the production domain to be live and crawlable. These are high-value but non-blocking for launch. Scroll-reveal animations, nginx cache headers, and a final Lighthouse/Axe audit complete production readiness.
**Delivers:** Per-page Open Graph tags with absolute URLs; Schema.org JSON-LD (MusicGroup + MusicAlbum per release); `sitemap.xml`; `robots.txt`; nginx cache headers (HTML: `no-cache`, `_astro/`: `immutable`); scroll-reveal animations with `prefers-reduced-motion` support; Lighthouse CWV targets met; Axe scan clean
**Addresses:** Open Graph, Schema structured data, performance, accessibility audit
**Avoids:** OG image relative URL mistake, nginx caching misconfiguration (Pitfall 9)

### Phase 7: Analytics (Post-Launch)

**Rationale:** Privacy-first analytics (Plausible or self-hosted Umami) can be added any time after launch — it is a snippet in `<head>` with no user-facing change. Doing it post-launch avoids blocking the launch and allows Coolify infrastructure to be confirmed stable first.
**Delivers:** Self-hosted Umami (or Plausible) deployed on Coolify; tracking snippet in `BaseLayout.astro`; no cookie consent UI needed; data visible for release-traffic analysis
**Addresses:** Analytics requirement (v1.x post-launch)
**Avoids:** GA4 (requires cookie consent banner, conflicts with brand experience)

---

### Phase Ordering Rationale

- Phases 1-2 (infrastructure + design tokens) have no fan-visible deliverable but block everything downstream; running them first prevents expensive rework
- Phase 3 (data model) must precede Phase 4 (pages) because every component depends on the typed release interface; starting UI before data shape is set causes interface churn
- Phase 4 (hero + pages) is deliberately the largest phase because the hero, discography, and listen pages share the same data flow and component patterns
- Phase 5 (newsletter) is isolated because it is the only external-infrastructure dependency and the only integration that silently fails (CORS) in production
- Phase 6 (SEO/polish) comes last because OG images and Schema.org require the production domain to be live and crawlable
- Phase 7 (analytics) is post-launch; it adds no value to the build process itself

### Research Flags

Phases that may benefit from deeper research during planning:

- **Phase 5 (Newsletter):** Listmonk CORS + ALTCHA CAPTCHA configuration is community-sourced and version-sensitive. The ALTCHA integration changed with a recent Listmonk version; custom form templates must be updated to include the ALTCHA widget. Confirm exact config against the installed Listmonk version before build.
- **Phase 6 (SEO):** Schema.org `MusicGroup` vs `Person` for a solo artist with collaborations (e.g. "DARLNG x TOBIKO" on Eseriani) has edge cases. Validate JSON-LD against Google's Rich Results Test before shipping.

Phases with well-documented standard patterns (no additional research needed):

- **Phase 1 (Infrastructure):** Astro installation and Coolify deploy are thoroughly documented in STACK.md with exact commands and settings
- **Phase 2 (Design tokens):** Tailwind 4 `@theme` and Fontsource via Astro's font API are documented with working config snippets in STACK.md
- **Phase 3 (Data model):** TypeScript typing and Astro image imports are standard patterns; full schema defined in ARCHITECTURE.md
- **Phase 4 (Core pages):** All component patterns are specified in ARCHITECTURE.md with clear build order and anti-patterns documented

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry 2026-06-26; config patterns verified against Context7/official Astro docs |
| Features | HIGH (table stakes) / MEDIUM (differentiators) | Table stakes confirmed across multiple musician-website sources; differentiator priority is pattern-based |
| Architecture | HIGH | Patterns verified against official Astro, Listmonk, and Coolify docs, plus the sibling site as direct reference |
| Pitfalls | HIGH (most) / MEDIUM (Listmonk-specific) | Most pitfalls confirmed across authoritative sources; Listmonk CORS/ALTCHA items sourced from GitHub issues |

**Overall confidence:** HIGH

### Gaps to Address

- **Streaming URLs for all releases:** Real Spotify, Apple Music, YouTube, Tidal, Deezer, and Amazon Music URLs per release must be gathered before Phase 3. Eseriani's Spotify artist ID is known (`0uXxSPfLr36OuyGDKiBzV3`); per-album/track URLs need to be collected.
- **Cover art assets:** High-resolution cover art for all four releases must be collected and committed to `src/assets/releases/` before Phase 3.
- **Listmonk list UUID:** Only available after Phase 1 Listmonk setup is complete. Cannot be hardcoded until the instance is running.
- **Brand fonts:** Specific typefaces for the DARLNG identity are not specified in PROJECT.md. Font selection must happen in Phase 2 before components are built.
- **Listmonk sending domain:** SPF/DKIM/DMARC records must be configured for the domain Listmonk sends from before Phase 5. Confirm which domain (may differ from `darlng.com`).

---

## Sources

### Primary (HIGH confidence)
- `/withastro/docs` via Context7 — static output, image optimization, Preact islands, Tailwind 4 setup, Fontsource font API
- `/knadh/listmonk` via Context7 — `POST /api/public/subscription` endpoint and parameters
- [Astro Configuration Reference](https://docs.astro.build/en/reference/configuration-reference/) — `output: 'static'`, `site` option
- [Coolify Nixpacks docs](https://coolify.io/docs/builds/packs/nixpacks) — static site checkbox, publish directory, base directory
- [Listmonk API docs](https://listmonk.app/docs/apis/subscribers/) — public subscription endpoint
- [Spotify Embeds docs](https://developer.spotify.com/documentation/embeds) — iframe parameters, dark theme
- npm registry — all versions verified 2026-06-26

### Secondary (MEDIUM confidence)
- [crockettford.dev — Deploy Astro to Coolify](https://crockettford.dev/blog/astro-with-coolify) — Nixpacks base directory gotcha
- [billyle.dev — Fix missing 404 pages](https://billyle.dev/posts/fix-missing-404-pages-for-coolify-static-site-deployments) — Dockerfile + nginx.conf for 404 routing
- [Medium — Listmonk + Coolify CORS](https://medium.com/@jonasvoland/listmonk-with-coolify-cors-problem-solved-fba1d92cc844) — CORS reverse proxy pattern
- [Listmonk #1521](https://github.com/knadh/listmonk/issues/1521), [#2724](https://github.com/knadh/listmonk/issues/2724), [#541](https://github.com/knadh/listmonk/issues/541) — CORS duplicate headers, ALTCHA, bot protection
- [Coolify Discussion #1999](https://github.com/coollabsio/coolify/discussions/1999) — www redirect not auto-handled
- [web.dev — Optimize CLS](https://web.dev/articles/optimize-cls), [iframe lazy loading](https://web.dev/articles/iframe-lazy-loading) — embed performance
- Multiple musician website pattern sources (Hypebot, Bandzoogle, HTMLBurger, Linkfire blog)

### Tertiary (LOW confidence / validation needed)
- Listmonk ALTCHA custom form template compatibility — behavior is version-specific; validate against installed version during Phase 5
- Schema.org `Person` vs `MusicGroup` for solo artist with collaborations — validate with Google Rich Results Test

### Direct References
- `/Users/rob/Desktop/projects/RobinDarlington/robindarlington.com` — sibling site; stack and deployment pattern reference

---
*Research completed: 2026-06-26*
*Ready for roadmap: yes*
