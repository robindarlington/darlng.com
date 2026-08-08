# Phase 5: SEO & Launch Polish - Context

**Gathered:** 2026-08-08
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — final phase; decisions from ROADMAP requirements + scope revision; remaining choices delegated to Claude.

<domain>
## Phase Boundary

Launch readiness: per-page Open Graph/Twitter Card meta with absolute production URLs, a generated 1200×630 OG image per page (from release artwork), sitemap + robots.txt, favicon (deferred from Phase 2), and Core Web Vitals verified locally via Lighthouse against the built dist (LCP <2.5s, CLS <0.1, TBT <200ms) plus an axe accessibility scan with zero critical failures. Live-domain re-verification (PageSpeed on darlng.com, opengraph.xyz) is deferred to the user's deploy — DEPLOY.md gets the post-launch checklist entries.
</domain>

<decisions>
## Implementation Decisions

### Meta & Open Graph (SEO-01)
- Per-page `<title>`, `<meta name="description">`, canonical URL, OG (og:title, og:description, og:image, og:url, og:type) + Twitter Card (summary_large_image) — implemented in `Layout.astro` via props (title/description already exist; extend with image/type/canonical).
- Absolute URLs built from `Astro.site` (`https://darlng.com` — verify astro.config.mjs `site` is set; set it if missing).
- OG images at 1200×630: generate from release artwork at build time via Sharp (crop/letterbox on brand background with the release art — decide the cleanest approach; a simple centered-art-on-`--color-bg` composition is acceptable; no text overlay needed for v1). Homepage OG = Eseriani-based; each /listen/[slug] OG = that release's art; 404 uses the homepage image.
- `og:type`: `music.album` for listen pages where applicable, `website` for home.

### Sitemap & robots (SEO-02)
- `@astrojs/sitemap` already installed + `site` config → verify sitemap-index.xml output; add `robots.txt` (static public/ file) referencing the sitemap at the absolute URL.
- 404 excluded from sitemap (check default behavior; exclude explicitly if needed).

### Performance (PERF-01, PERF-02)
- Lighthouse locally against the BUILT dist served by the production nginx container (docker) or `astro preview` — targets: LCP <2.5s, CLS <0.1, TBT <200ms (lab, desktop + mobile emulation). Use lighthouse CLI via npx (no new repo deps — it runs via npx).
- Fix what Lighthouse surfaces within scope: font preload correctness, image sizes/priority attrs, any render-blocking issues. PERF-02 (Sharp srcset, fixed dimensions) is largely done in Phases 2–3 — verify, don't rebuild.
- Axe scan (npx @axe-core/cli or agent-browser + axe injection) on /, one listen page, 404: zero critical violations, zero contrast violations (roadmap criterion 4).

### Favicon (deferred IN-05 from Phase 2)
- Create an SVG favicon (DARLNG "D" or wordmark glyph in accent on transparent/bg) + fallback .ico + apple-touch-icon PNG (180×180) from the same mark; wire in Layout head. Keep it simple, typographic, on-brand.

### DEPLOY.md
- Extend post-cutover checklist: PageSpeed Insights on live domain, opengraph.xyz check for / and /listen/eseriani, Search Console sitemap submission note.

### Claude's Discretion
- OG image composition details, favicon glyph design, meta description copy (voice: confident, independent — reuse established strings where sensible), lighthouse run configuration.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Layout.astro` head already takes title/description props (listen pages set them); font preloads via ?url imports; skip link + #main.
- Release artwork as ImageMetadata in `src/data/releases.ts`; Sharp pipeline; `astro.config.mjs` (CHECK whether `site` is set — sitemap needs it; Phase 1 research said sitemap emits nothing useful without it).
- nginx.conf serves immutable /_astro/ + no-cache HTML — Lighthouse against the docker container is the most production-faithful run.
- agent-browser available via npx for the axe pass if @axe-core/cli is awkward.

### Established Patterns
- No new npm runtime deps; npx for tooling. Tailwind pins undisturbed. Contrast gate 9/9 green. External-link invariants. Browser verification with screenshots to /tmp/.
- Icon-verification checklist (from 03-UI-REVIEW) applies if favicon work touches BrandIcon (it shouldn't — favicon is a standalone asset).

### Integration Points
- OG image generation: Astro supports dynamic image endpoints (GET routes returning images) OR a build script writing to public/og/ — pick the simplest reliable approach for static output (a prebuild Sharp script writing public/og/*.png is fine and debuggable).
- `robots.txt` in `website/public/`.

</code_context>

<specifics>
## Specific Ideas

- This is the last phase: after it passes, the milestone lifecycle runs (audit → complete → cleanup) and the site is ready for the user's Coolify deploy + final visual sign-off.
- Keep Lighthouse honest: run against the production container, throttled mobile config included, and record the numbers in the SUMMARY (they go in front of the user).

</specifics>

<deferred>
## Deferred Ideas

- Live-domain Lighthouse/PageSpeed + opengraph.xyz + Search Console → user's deploy checklist (DEPLOY.md).
- Schema.org JSON-LD, per-release sub-pages, analytics, scroll animations → v2 (tracked in STATE.md deferred table).

</deferred>

---

*Phase: 5-SEO & Launch Polish*
*Context gathered: 2026-08-08*
