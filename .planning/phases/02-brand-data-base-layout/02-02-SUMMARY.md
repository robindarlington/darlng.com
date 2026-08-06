---
phase: 02-brand-data-base-layout
plan: 02
subsystem: ui
tags: [astro, tailwind4, simple-icons, sharp, typed-data, a11y]

requires:
  - phase: 02-brand-data-base-layout
    provides: "Plan 02-01's @theme tokens, fonts, releases.ts type contract + Eseriani entry, Layout/Header/Footer shells, socials export"
provides:
  - "Complete four-release catalog (eseriani, randevu, brave, open-wide) with 22 platform links, all covers typed ImageMetadata"
  - "BrandIcon.astro — zero-JS inline SVG renderer for simple-icons brand marks"
  - "Five-platform social-follow nav in Header and Footer, iterated from `socials`, 44px keyboard-focusable tap targets"
  - "Layout-wrapped 404 page proving the shared Layout is reusable across routes"
  - "Browser-verified responsive behaviour at 375px/768px/1440px — resolves the UI-SPEC's open question: the header row fits on one line at 375px, no wrap fallback needed"
affects: [03-hero-discography-listen, 04-newsletter, 05-seo-polish]

actuals:
  tokens: 2100
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "BrandIcon.astro wraps simple-icons SimpleIcon objects as inline SVG, colour driven entirely by currentColor (never icon.hex) to preserve the single-jewel-accent architecture"
    - "Header/Footer social rows built via `socials.map(...)` over a shared platform-to-SimpleIcon record, never hand-written per-icon markup"

key-files:
  created:
    - website/src/assets/releases/randevu.jpg
    - website/src/assets/releases/brave.jpg
    - website/src/assets/releases/open-wide.jpg
    - website/src/components/BrandIcon.astro
  modified:
    - website/src/data/releases.ts
    - website/src/components/Header.astro
    - website/src/components/Footer.astro
    - website/src/styles/global.css
    - website/src/pages/404.astro

key-decisions:
  - "Header's 5-icon social row fits on a single row at 375px with room to spare (rightmost anchor ends at x=367.65 against a 375px viewport) — the UI-SPEC's documented wrap-to-second-row fallback was not needed and was not implemented, since implementing an unused fallback path would be untested dead code."
  - "Open Wide's Amazon URL upgraded from http:// to https:// per T-02-02-04 (same host, same path) — the sole permitted URL normalisation in this plan."

patterns-established:
  - "Social platform icon lookup: `Record<SocialPlatform, SimpleIcon>` built once in frontmatter, shared identically between Header.astro and Footer.astro"

requirements-completed: [BRAND-03, BRAND-04]

coverage:
  - id: D1
    description: "Complete four-release catalog in src/data/releases.ts: 22 platform links across 4 releases, every URL transcribed verbatim from CONTENT.md, all four covers imported as ImageMetadata, no aggregator/reference-only links, no insecure-scheme URLs"
    requirement: "BRAND-04"
    verification:
      - kind: unit
        ref: "cd website && npm run check — astro check 0 errors; grep assertions confirming slug order, 27 platform: ' occurrences (22 release + 5 social), 3 music.apple.com entries, 0 http:// urls, 0 hyperfollow/song.link references"
        status: pass
      - kind: integration
        ref: "cd website && npm run build — exits 0, emits dist/index.html and dist/404.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "Header and Footer each render one accessible, keyboard-focusable, 44x44px social-follow anchor per socials entry (5 platforms, CONTENT.md order), iterated via socials.map — not hand-written markup"
    requirement: "BRAND-04"
    verification:
      - kind: unit
        ref: "grep -o 'aria-label=\"Follow DARLNG on' dist/index.html and dist/404.html | wc -l — both 10 (5 header + 5 footer); grep -o rel=\"noopener noreferrer\" and target=\"_blank\" occurrence counts equal (10=10) in both files; all 5 CONTENT.md social URLs present verbatim"
        status: pass
      - kind: automated_ui
        ref: "agent-browser eval at 375x812 — 10 anchors present, each getBoundingClientRect() reports w=44 h=44, adjacent header anchors have 8px gaps (footer anchors 16px gaps), no intersecting rects"
        status: pass
    human_judgment: false
  - id: D3
    description: "Layout is single-column at 375px and multi-column (3-track grid) from 768px, with no horizontal overflow at 375px/768px/1440px, and /404 renders inside the same Layout as /"
    requirement: "BRAND-03"
    verification:
      - kind: automated_ui
        ref: "agent-browser eval — 375px: scrollWidth==clientWidth==375, footer children stack (each top >= previous bottom); 768px: scrollWidth==clientWidth==768, footer gridTemplateColumns resolves to 3 tracks; 1440px: main width 1280, centeredDelta 0, scrollWidth==clientWidth==1440; document.fonts.check('600 14px \"Manrope Variable\"')===true at every viewport; /404 at 375px shows same header/footer/social row as /"
        status: pass
    human_judgment: true
    rationale: "Screenshots captured at all three viewports for human visual review (does the dark/moody design 'pop' as intended) — mechanical layout assertions all pass, but overall visual polish is a human call."

duration: 9min
completed: 2026-08-06
status: complete
---

# Phase 2 Plan 2: Brand, Data & Base Layout — Expansion Summary

**Full four-release catalog (22 platform links) plus a zero-JS `BrandIcon.astro` component powering iterated five-platform social-follow rows in Header and Footer, a Layout-wrapped 404 page, and a real-browser pass at 375px/768px/1440px confirming the social row fits on one header line without the UI-SPEC's wrap fallback.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-08-06T21:32:00Z
- **Completed:** 2026-08-06T21:40:06Z
- **Tasks:** 3 (2 expansion + 1 browser-verify, no fixes needed)
- **Files modified:** 9

## Accomplishments
- `src/data/releases.ts` now holds all four releases (eseriani, randevu, brave, open-wide) with 22 total platform links, transcribed verbatim from CONTENT.md, plus three new Sharp-processed cover-art sources (2450x2450, 3000x3000, 3000x3000)
- `BrandIcon.astro`: a 15-line zero-JS component rendering any `simple-icons` `SimpleIcon` as inline SVG with `fill="currentColor"`, never reading the icon's own brand-colour field — keeps the single-jewel-accent architecture intact
- Header and Footer both iterate the same `socials` array into identical 44x44px, keyboard-focusable, `rel="noopener noreferrer"` anchors in Spotify/Instagram/Facebook/YouTube/TikTok order
- `404.astro` rewritten inside the shared `Layout`, confirming the layout composition is genuinely reusable across routes, with confident-voice copy and the UI-SPEC's ghost-button contract
- Real-browser verification at 375x812, 768x1024 and 1440x900 (plus 375x812 on `/404`) resolved the UI-SPEC's one open question: the wordmark + 5 icon row fits cleanly on one header row at 375px (rightmost anchor ends 7px short of viewport edge) — no wrap-to-second-row fallback was needed or implemented

## Task Commits

1. **Task 1: Expansion — full four-release catalog** - `2a7d2c1` (feat)
2. **Task 2: Expansion — social-follow header/footer + Layout-wrapped 404** - `fad2811` (feat)
3. **Task 3: Expansion — browser-verify at 375px/768px/1440px** - verification-only, no new commit (all assertions passed against Task 1/2 output; nothing required fixing)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `website/src/assets/releases/randevu.jpg` - Randevu cover art (2450x2450), copied from artist's Desktop source
- `website/src/assets/releases/brave.jpg` - Brave cover art (3000x3000)
- `website/src/assets/releases/open-wide.jpg` - Open Wide cover art (3000x3000)
- `website/src/data/releases.ts` - added Randevu (7 links), Brave (5 links) and Open Wide (6 links) Release entries
- `website/src/components/BrandIcon.astro` - inline SVG renderer for simple-icons brand marks, currentColor only
- `website/src/components/Header.astro` - added `nav[aria-label="Follow DARLNG"]` iterating `socials`
- `website/src/components/Footer.astro` - filled the previously-empty middle grid cell with the same social row
- `website/src/styles/global.css` - added `.social-icon-link:hover` glow rule using `color-mix(in oklch, ...)`
- `website/src/pages/404.astro` - rewritten inside `Layout`, confident-voice copy, ghost-button CTA back to `/`

## Decisions Made
- The 375px header wrap fallback documented in the UI-SPEC was measured and found unnecessary — the row fits with ~7px to spare — so it was not implemented as unreachable/untested code.
- Open Wide's Amazon URL scheme upgraded http→https (T-02-02-04), the only permitted normalisation of any transcribed URL.

## Deviations from Plan

### Auto-fixed Issues

None — no code required fixing after implementation; all three tasks' real acceptance criteria (data content, DOM structure, browser geometry) passed on first build.

### Noted, not auto-fixed (verify-command methodology, not implementation defects)

**1. `grep -c "isLatest:"` and `grep -c "cover: "` on `src/data/releases.ts` return 5, not the expected 4.**
- **Found during:** Task 1 verification (part of the mandatory `<verify>` gate).
- **Issue:** Both grep patterns lack a distinguishing character (unlike `platform: '` or `slug: '`, which require a following quote), so they also match the `Release` interface's own field declarations (`isLatest: boolean;` and `cover: ImageMetadata;`) established by plan 02-01 — 1 interface line + 4 data lines = 5, not the plan's expected 4 data-only lines.
- **Manual proof the data itself is correct:** `grep -n "isLatest:" src/data/releases.ts | grep -v boolean` shows exactly 4 lines (`true, false, false, false`); `grep -n "cover: " src/data/releases.ts | grep -v ImageMetadata` shows exactly 4 lines (`eserianiCover, randevuCover, braveCover, openWideCover`).
- **Why not auto-fixed:** The only way to eliminate the literal substring match would be extracting the interface's `isLatest`/`cover` fields into a `Record<'x', T>` composition purely to dodge a grep pattern — a cosmetic type-declaration hack with no readability benefit, unlike the SocialPlatform extraction in plan 02-01 (which added a genuinely reusable named type). Per the HARD GATE fix-attempt-limit protocol, this is documented as a deviation rather than force-fit.
- **Impact:** None on functionality — `npm run check` and `npm run build` both exit 0, and every release entry is structurally and semantically correct.

**2. `grep -c 'aria-label="Follow DARLNG on'` (and the matching `rel`/`target` counts) on `dist/index.html`/`dist/404.html` return 2, not 10.**
- **Found during:** Task 2 and Task 3 verification.
- **Issue:** Astro's production `compressHTML` collapses `<head>`/`<body>` onto very few physical lines, so `grep -c` (which counts matching *lines*, not occurrences) undercounts. This is the identical class of artifact plan 02-01's SUMMARY already documented for `rel="preload"` counts.
- **Manual proof:** `grep -o 'aria-label="Follow DARLNG on' dist/index.html | wc -l` → `10`; same for `dist/404.html`; `grep -o 'rel="noopener noreferrer"' | wc -l` and `grep -o 'target="_blank"' | wc -l` both → `10` in both files.
- **Impact:** None — the underlying requirement (10 follow anchors, matched rel/target counts) is independently confirmed true.

---

**Total deviations:** 0 auto-fixed, 2 noted verify-methodology caveats with no implementation impact (both are `grep -c` line-counting artifacts against either a shared type interface or Astro's minified HTML output, not data or markup defects).
**Impact on plan:** None. All real acceptance criteria — data content, DOM structure, ARIA labels, focus-visible styling, tap-target geometry, viewport overflow, footer grid tracks — were independently confirmed via manual grep with occurrence-counting flags and live browser assertions.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/data/releases.ts` is now the complete, type-checked single source of truth for Phase 3's hero, discography and listen pages: 4 releases, 22 platform links, 4 typed covers.
- `BrandIcon.astro` is ready for reuse anywhere else on the site that needs a brand mark rendered from `simple-icons`.
- The header/footer social rows and the reusable `Layout` composition are proven across two routes (`/` and `/404`); Phase 3 pages can wrap in `Layout` with confidence.
- No blockers for Phase 3.

---
*Phase: 02-brand-data-base-layout*
*Completed: 2026-08-06*

## Self-Check: PASSED
