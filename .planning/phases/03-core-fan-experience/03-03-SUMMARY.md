---
phase: 03-core-fan-experience
plan: 03
subsystem: ui
tags: [astro, tailwind4, simple-icons, lucide, a11y, agent-browser]

requires:
  - phase: 03-core-fan-experience
    provides: "Plan 01's platform-icons.ts lookup table and four live /listen/[slug] routes; Plan 02's completed hero facade"
provides:
  - "DiscographyCard.astro — one <article> per back-catalog release: art+title link, credit line, first-three platform icon row (fallback glyph for icon-less platforms), distinctly-labelled all-platforms link"
  - "'The Catalog' grid section on / — Randevu, Brave, Open Wide in releases.ts array order, single column below 768px, three columns from 768px"
  - "Reserved, explicitly-named Phase 4 newsletter insertion point between the catalog section and the footer"
  - "FAN-03 audit proving the Phase 2 header/footer follow anchors satisfy the requirement on all six built pages, plus a phase-wide target=_blank/rel=noopener-noreferrer invariant gate"
  - "Full-phase browser-verified evidence (375/768/1440) across / and all four /listen/[slug] pages"
affects: [04-newsletter-fan-capture, 05-seo-polish]

actuals:
  tokens: 11800
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Credit-line derivation from artistLine via regex strip of the 'Darlng ' prefix, rather than re-concatenating a second 'ft.' string from separate data fields"
    - "Discography card icon row reuses platform-icons.ts and BrandIcon.astro verbatim from Plan 01 — no new lookup table introduced"

key-files:
  created:
    - website/src/components/DiscographyCard.astro
  modified:
    - website/src/pages/index.astro

key-decisions:
  - "Task 2 (FAN-03 audit) and Task 3 (browser sweep) required zero code changes — every acceptance criterion and browser assertion passed on the first run, so no commit was made for either task (nothing to commit is a legitimate outcome for a verification-only task)."
  - "Fallback-glyph count verified by distinguishing ExternalLink icon instances via their rendered SVG width/height attribute (size=20 on DiscographyCard's icon row vs size=24 on PlatformButton's fallback slot vs size=18 on PlatformButton's trailing chevron) rather than a raw substring count, since PlatformButton always renders a second ExternalLink (the chevron) regardless of brand-icon availability."

patterns-established:
  - "Discography card anatomy (art+title link / credit line / sliced icon row / all-platforms link) — the reusable shape for any future back-catalog or 'more releases' listing."

requirements-completed: [MUSIC-01, MUSIC-02, FAN-03]

coverage:
  - id: D1
    description: "Below the hero, 'The Catalog' renders Randevu, Brave and Open Wide as cards with cover art, title, year and feature credit, in releases.ts array order (isLatest excluded), single column below 768px and three columns from 768px"
    requirement: "MUSIC-01"
    verification:
      - kind: unit
        ref: "cd website && npm run check && npm run build — 0 errors; dist/index.html contains exactly 3 <article> elements, 'The Catalog' heading, isLatest filter present in index.astro source, no sort()/reverse() in DiscographyCard.astro"
        status: pass
      - kind: automated_ui
        ref: "agent-browser eval at 375x812/768x1024/1440x900 on / — grid-template-columns resolves to 1 track at 375, 3 tracks at 768/1440; <article> rects non-intersecting at every viewport; scrollWidth===clientWidth at all three (375 now clean — the Header.astro overflow flagged in 03-01-SUMMARY.md/WINDOWS.md #1 was fixed upstream before this plan ran)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each card links out natively to streaming platforms (first three platforms[] entries in array order, fallback glyph for icon-less platforms, never skipped/reordered) and through to its listen page via two distinctly-labelled links; no embed anywhere on the back catalog"
    requirement: "MUSIC-02"
    verification:
      - kind: unit
        ref: "node verify script (plan Task 1 <verify>) — 3 art+title aria-labels, 6 href=\"/listen/{slug}\" occurrences (2 per card), 9 per-icon aria-labels (3 per card), Randevu/Open Wide amazonMusic URLs present verbatim, zero <iframe> in dist/index.html"
        status: pass
      - kind: automated_ui
        ref: "agent-browser eval at 375/768/1440 — each card's three platform-icon anchors report >=44x44px rects with no intersections; each card's two same-destination anchors (art+title vs all-platforms) report distinct accessible names"
        status: pass
    human_judgment: false
  - id: D3
    description: "FAN-03: Spotify artist, Instagram, TikTok and YouTube follow anchors present on every page as plain icon links (10 anchors per page: 5 platforms x header+footer), no vendor follow widget or embed, verified rather than rebuilt"
    requirement: "FAN-03"
    verification:
      - kind: unit
        ref: "Task 2 inline Node audit across all six built pages (index, 404, and four listen/*) — aria-label=\"Follow DARLNG on\" count exactly 10 per file; all four FAN-03 profile URLs present >=2x per file; open.spotify.com/follow, spotify.com/embed and <iframe> all 0 per file; target=_blank/rel=noopener-noreferrer counts match per file (22/22, 10/10, 14/14, 17/17, 15/15, 16/16); git diff --exit-code on Header.astro/Footer.astro confirms verification-only, not rebuilt"
        status: pass
    human_judgment: false
  - id: D4
    description: "No invented, substituted or silently-dropped brand marks anywhere on the built site — every fallback-glyph slot matches what releases.ts predicts"
    requirement: "MUSIC-01"
    verification:
      - kind: unit
        ref: "Computed expected fallback count from releases.ts by hand (2 on homepage cards: Randevu slot 3, Open Wide slot 3; 4 across listen pages: Randevu x2 amazonMusic+anghami, Brave x1 boomplay, Open Wide x1 amazonMusic) and matched it against actual built-HTML fallback-icon counts distinguished by SVG size attribute (20px on homepage, 24px on listen pages) — 2 on index.html, 0/2/1/1 on eseriani/randevu/brave/open-wide, totalling 6/6 as predicted"
        status: pass
    human_judgment: false
  - id: D5
    description: "The homepage LCP element is still the hero image with the full page (hero + catalog + facade) composed, and every catalog-section image is lazy while the hero image is not"
    requirement: "HERO-01"
    verification:
      - kind: automated_ui
        ref: "agent-browser PerformanceObserver largest-contentful-paint check at 375/768/1440 on / with the full page rendered — element is always #hero picture img; catalog section img.loading==='lazy' for all 3 cover images, hero img.loading!=='lazy'"
        status: pass
    human_judgment: false
  - id: D6
    description: "A named insertion point for Phase 4's newsletter section sits between the catalog and the footer"
    verification:
      - kind: unit
        ref: "grep -ci 'newsletter' website/src/pages/index.astro >= 1 (HTML comment naming the Phase 4 slot); agent-browser eval confirms the catalog <section> is the last content section inside <main> before </Layout>/<Footer>"
        status: pass
    human_judgment: false
  - id: D7
    description: "Backstop items (hero scrim legibility over photographic artwork, hero-art softness beyond the 1254px source, post-click embed failure with an ad blocker) are explicitly reported, not silently passed"
    human_judgment: true
    rationale: "None of these three are machine-decidable — see the Backstop Evidence section below for what was gathered for each and what remains for a human to confirm."

duration: 22min
completed: 2026-08-08
status: complete
---

# Phase 3 Plan 3: The Catalog Grid, FAN-03 Audit, and Full-Phase Browser Sweep Summary

**Three-card "The Catalog" grid (Randevu/Brave/Open Wide) with a shared DiscographyCard component, a passing FAN-03 + link-invariant audit across all six built pages, and a green browser sweep at 375/768/1440 confirming zero regressions and a still-intact hero LCP with the full page composed.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-08-08T13:28:00Z (approx.)
- **Completed:** 2026-08-08T13:50:41Z
- **Tasks:** 3 (1 build + 2 verification-only)
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- `DiscographyCard.astro` — one `<article>` per back-catalog release: art+title link (`{title} — listen and platforms` aria-label) over a `<Picture>` cover with hover scale/shadow, a `{year} · ft. {name}` credit line derived from `artistLine` (no re-concatenated `ft.`), a three-icon platform row sliced from `platforms[]` in array order (rendering the neutral `ExternalLink` fallback for `amazonMusic`/`anghami`/`boomplay` slots, never skipping or reordering), and a distinctly-labelled `All {title} platforms` link
- `index.astro`'s new `<section aria-labelledby="catalog-heading">` — "The Catalog" heading, a `grid-cols-1 md:grid-cols-3` grid iterating `releases.filter(r => !r.isLatest)` directly (no sort/reverse/slice), and an HTML comment reserving the Phase 4 newsletter insertion point immediately after, before `</Layout>`
- Task 2's FAN-03 + link-invariant audit passed on the first run across all six built pages (`index.html`, `404.html`, and the four `listen/*/index.html`): exactly 10 `Follow DARLNG on` anchors per page, all four requirement-named profile URLs present, zero vendor-widget/embed markers, `target="_blank"`/`rel="noopener noreferrer"` counts matched per file (growth from Phase 2's baseline of 10 to 22/10/14/17/15/16 across the six pages), and the computed expected fallback-glyph count (6 total: 2 on the homepage cards, 4 across the listen pages) matched the actual built count exactly
- Task 3's full browser sweep (agent-browser, 375x812/768x1024/1440x900) confirmed: 1-track/3-track catalog grid with non-intersecting cards; every platform-icon anchor >=44x44px with no adjacent-icon intersection; zero horizontal overflow on `/` and all four listen pages (the Header.astro 375px overflow flagged in `03-01-SUMMARY.md` and WINDOWS.md entry #1 is now resolved upstream — confirmed clean here); the hero image remains the LCP element with the full composed page; catalog images lazy, hero image not; distinct accessible names on both same-destination card anchors; listen-page platform-button counts exactly 4/5/6 on eseriani/brave/open-wide; six screenshots on disk at `/tmp/darlng-phase3/`

## Task Commits

1. **Task 1: DiscographyCard component and 'The Catalog' grid** - `b086aaf` (feat)
2. **Task 2: FAN-03 audit and phase-wide external-link invariant gate** - no commit (verification-only; audit passed with zero code changes, nothing to commit)
3. **Task 3: Full-phase browser sweep at 375/768/1440** - no commit (verification-only; every assertion passed on the first run, nothing to fix)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `website/src/components/DiscographyCard.astro` - one `<article>` per back-catalog release (art+title link, credit line, sliced icon row, all-platforms link)
- `website/src/pages/index.astro` - adds the "The Catalog" grid section and the reserved Phase 4 newsletter insertion comment

## Decisions Made
- Task 2 and Task 3 produced zero code changes — both audits and the full browser sweep passed cleanly on the first execution, so no commit exists for either task. This is a legitimate outcome for verification-only tasks, not a skipped step.
- Fallback-glyph counting used the rendered SVG's `width`/`height` attribute to distinguish `DiscographyCard`'s icon-row `ExternalLink` (size 20) from `PlatformButton`'s fallback-slot `ExternalLink` (size 24) and its always-present trailing chevron `ExternalLink` (size 18) — a raw substring count of `<svg` or `ExternalLink` would have conflated the chevron (present on every listen-page button regardless of brand-icon availability) with the fallback glyph itself.

## Deviations from Plan

None - plan executed exactly as written. Both Task 2's audit and Task 3's browser sweep passed on the first run with no fixes required.

## Issues Encountered
None. The Header.astro 375px overflow noted as an open item in `03-01-SUMMARY.md` (WINDOWS.md entry #1) was already resolved before this plan executed (confirmed via WINDOWS.md's resolution note and re-verified independently by this plan's own browser sweep showing `scrollWidth === clientWidth` at 375px on every tested page).

## Backstop Evidence

Three items flagged across `03-UI-SPEC.md` and prior plan SUMMARYs are not machine-decidable. Status as of this plan's close-out:

1. **Hero scrim legibility over the photographic artwork.** Evidence: `full-1440.png` (this plan) plus `home-{375,768,1440}.png` (03-01) on disk at `/tmp/darlng-phase3/` — visual inspection during this session shows the headline, artist line, and CTA row all sitting clearly legible against the scrim at every tested viewport, consistent with 03-UI-SPEC.md's computed 13.6–16.2:1 contrast table. Not machine-verified by this plan (contrast-over-photographic-pixels isn't something `check-contrast.mjs` can assert) — a human sign-off on the screenshots is the correct final check before Phase 3 sign-off.
2. **Hero-art softness on displays wider than the 1254px source.** Evidence: `full-1440.png` (this plan, 1440px viewport — the widest tested) shows the hero art rendering crisply; no visible softness observed at this width. This does NOT clear the concern for displays wider than 1440px (e.g. 1920px+), which this plan's tested viewport range does not reach — `Sharp`'s `fit="cover"` caps enlargement at the 1254px source, so any viewport wider than that will either upscale (soft) or stretch the largest generated asset. Needs a human check on an actual wide/high-DPI display, or a future higher-resolution source asset, before that is fully closed out.
3. **Post-click embed failure path with an ad blocker.** No ad-blocker extension was available in this automated browser-CLI environment (same limitation noted in `03-02-SUMMARY.md`). The escape hatch itself — the hero CTA row's direct YouTube link, untouched by any plan in this phase — was verified present and functional by inspection. The actual ad-blocker-enabled failure scenario was not exercised. A human running an ad blocker against the live click-to-embed flow is the correct final verification.

None of these three represent a silent pass — each is explicitly unresolved pending a human check, consistent with the plan's `verification: backstop` designation.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MUSIC-01, MUSIC-02, and FAN-03 are all complete. Combined with Phase 3's earlier HERO-01, HERO-02, and LISTEN-01 completions (03-01, 03-02), every Phase 3 requirement is now satisfied.
- The Phase 4 newsletter section has an explicit, named insertion point (HTML comment) between the catalog `<section>` and `<Footer />` in `index.astro` — no structural changes needed to slot it in.
- Before Phase 3 final sign-off: a human should review the three backstop items above (scrim legibility, hero-art softness beyond 1440px, ad-blocker embed-failure escape hatch) using the screenshots already on disk at `/tmp/darlng-phase3/`, plus confirm the overall cinematic composition read (hero dominant, catalog quiet, accent used sparingly) — consistent with what this plan's own visual inspection of `full-1440.png` and `catalog-375.png` found.
- No blockers for Phase 4 (newsletter/fan capture) or Phase 5 (SEO/performance polish).

---
*Phase: 03-core-fan-experience*
*Completed: 2026-08-08*

## Self-Check: PASSED
