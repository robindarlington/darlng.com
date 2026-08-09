---
phase: 05-seo-launch-polish
plan: 02
subsystem: seo
tags: [astro, sharp, favicon, ico, robots-txt, sitemap, nginx]

# Dependency graph
requires:
  - phase: 05-seo-launch-polish
    provides: "05-01: website/scripts/generate-assets.mjs prebuild generator, npm prebuild lifecycle hook, Layout.astro head-block conventions"
provides:
  - "website/public/favicon.svg — hand-authored DARLNG D mark, single source for every icon format"
  - "generate-assets.mjs favicon routine: 180x180 opaque apple-touch-icon + hand-rolled favicon.ico (no new dependency)"
  - "Layout.astro head gains the three icon links (ico, svg, apple-touch)"
  - "website/public/robots.txt — allow-all pointing at the sitemap index"
  - "website/nginx.conf /sitemap.xml exact-match route serving the sitemap index with headers intact"
affects: [05-03]

actuals:
  tokens: 1900
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Hand-rolled binary container construction via Buffer.alloc/writeUInt*LE — avoided a new npm dependency (sharp-ico) for a 22-byte ICO header"
    - "file(1) as the acceptance gate for a hand-rolled binary format, rather than trusting the byte-offset spec on paper"
    - "Single hand-authored SVG source rasterized by the same prebuild generator into every derived icon format, so formats can never drift"

key-files:
  created:
    - website/public/favicon.svg
    - website/public/robots.txt
  modified:
    - website/scripts/generate-assets.mjs
    - website/src/layouts/Layout.astro
    - website/.gitignore
    - website/nginx.conf

key-decisions:
  - "favicon.ico built via a hand-rolled 22-byte ICONDIR+ICONDIRENTRY header wrapping a raw 32x32 PNG buffer (valid since Windows Vista) rather than adding a sharp-ico dependency — verified with `file(1)`"
  - "robots.txt Sitemap directive names the sitemap-index.xml, not the numbered sitemap-0.xml shard, so a future second shard stays discoverable without a robots.txt change"
  - "nginx /sitemap.xml location declares no add_header of its own, inheriting all five server-level security/cache headers intact — verified structurally here, HTTP behavior against the running container deferred to 05-03"
  - "apple-touch-icon.png uses sharp .flatten() to fill transparent rounded corners with the brand background, because iOS applies its own corner mask and would otherwise double-round the icon"

patterns-established:
  - "Icon links ordered container-format-first (favicon.ico) then vector (favicon.svg, image/svg+xml) then apple-touch-icon, placed after the Twitter block and before font preloads in Layout.astro head"

requirements-completed: [SEO-02]

coverage:
  - id: D1
    description: "Every built page carries favicon.ico, favicon.svg (image/svg+xml), and apple-touch-icon.png links in its head, and all three files exist in dist/ with no manual step"
    requirement: SEO-02
    verification:
      - kind: automated_ui
        ref: "clean-tree npm run build; node script asserting head links present on dist/index.html, dist/404.html, dist/listen/eseriani/index.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "dist/favicon.ico is a structurally valid 32x32 Windows icon container"
    requirement: SEO-02
    verification:
      - kind: automated_ui
        ref: "file(1) on dist/favicon.ico reports 'MS Windows icon resource ... 32 x 32'"
        status: pass
    human_judgment: false
  - id: D3
    description: "dist/apple-touch-icon.png is exactly 180x180 and fully opaque"
    verification:
      - kind: unit
        ref: "node sharp metadata + stats().isOpaque check on dist/apple-touch-icon.png"
        status: pass
    human_judgment: false
  - id: D4
    description: "The favicon glyph renders as a legible DARLNG D in accent-on-brand-background at both 32px and 180px"
    verification:
      - kind: automated_ui
        ref: "agent-browser screenshots /tmp/darlng-phase5/favicon-180.png and favicon-svg.png"
        status: pass
    human_judgment: true
    rationale: "Visual glyph legibility (reads as a D, not a blob, correct colors) is the actual acceptance bar per the 03-UI-REVIEW icon-verification checklist; automated byte/dimension checks alone can't catch a structurally-valid-but-visually-wrong icon"
  - id: D5
    description: "dist/robots.txt is byte-exact and names the sitemap index; dist/sitemap-index.xml and dist/sitemap-0.xml exist and list exactly the five real content URLs with no status-code page"
    requirement: SEO-02
    verification:
      - kind: unit
        ref: "node script strict string-equality on dist/robots.txt; node script asserting exact sorted <loc> set on dist/sitemap-0.xml"
        status: pass
    human_judgment: false
  - id: D6
    description: "nginx.conf serves /sitemap.xml via an exact-match location with try_files and no add_header, leaving the _astro block and immutable cache-control contract untouched"
    requirement: SEO-02
    verification:
      - kind: unit
        ref: "node regex assertions over website/nginx.conf structure"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-09
status: complete
---

# Phase 5 Plan 2: Favicon Set & Crawler Discoverability Summary

**Hand-authored DARLNG `D` favicon rasterized into every icon format by the existing prebuild generator (including a hand-rolled ICO container with zero new dependencies), plus a byte-exact `robots.txt` and an nginx route so `/sitemap.xml` resolves.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-08-09T09:53:00Z (approx.)
- **Completed:** 2026-08-09T09:57:49Z
- **Tasks:** 2/2 complete
- **Files modified:** 6

## Accomplishments

- `website/public/favicon.svg`: a 64x64-viewBox geometric `D` mark — a `#0A0908` rounded-square backing rect and a `#2DD9C5` `fill-rule="evenodd"` outer/inner-counter path — with no `<text>`/`font-family` dependency, so it renders identically everywhere it's rasterized.
- `website/scripts/generate-assets.mjs`: extended with a `generateFavicons()` routine sharing the existing `sharp` import. Produces `public/apple-touch-icon.png` (180x180, `density: 384`, `.flatten()` to the brand background so iOS's corner mask doesn't double-round it) and `public/favicon.ico` (a 32x32 PNG wrapped in a hand-rolled 22-byte ICONDIR+ICONDIRENTRY header via `Buffer.alloc`/`writeUInt*LE`, with no new dependency).
- `website/src/layouts/Layout.astro`: three icon links added to the head immediately after the Twitter block — `rel="icon"` to `/favicon.ico` (`sizes="32x32"`), `rel="icon"` to `/favicon.svg` (`type="image/svg+xml"`), and `rel="apple-touch-icon"` to `/apple-touch-icon.png`.
- `website/.gitignore`: `public/favicon.ico` and `public/apple-touch-icon.png` added as deterministic `prebuild` output, alongside the existing `public/og/` entry.
- `website/public/robots.txt`: byte-exact four-line allow-all form ending in `Sitemap: https://darlng.com/sitemap-index.xml` — the index, not a numbered shard, so a future second shard stays discoverable.
- `website/nginx.conf`: an exact-match `location = /sitemap.xml` block containing only `try_files /sitemap-index.xml =404;` and declaring no `add_header`, so it inherits all five server-level security/cache headers intact; the `_astro` block and immutable cache-control contract are unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: The DARLNG mark — one SVG source, every icon format** - `9174ee1` (feat)
2. **Task 2: The crawler's map — robots.txt, the sitemap, and the /sitemap.xml route** - `8aeb5cd` (feat)

**Plan metadata:** commit to follow (docs: complete plan)

## Files Created/Modified

- `website/public/favicon.svg` - hand-authored DARLNG `D` brand mark (source of truth)
- `website/scripts/generate-assets.mjs` - added `wrapPngAsIco()` + `generateFavicons()`, wired into `main()`
- `website/src/layouts/Layout.astro` - three icon `<link>` tags added to head
- `website/.gitignore` - `public/favicon.ico`, `public/apple-touch-icon.png` ignored
- `website/public/robots.txt` - new, byte-exact allow-all + sitemap-index directive
- `website/nginx.conf` - new exact-match `/sitemap.xml` location

## Decisions Made

- Hand-rolled the ICO container instead of adding a `sharp-ico`-style dependency — the format is 22 bytes of header plus a raw PNG stream (valid since Windows Vista), verified structurally correct via `file(1)` rather than trusted on paper. This closes threat T-05-SC (no new supply-chain surface for a Phase-5-only need).
- `robots.txt`'s `Sitemap:` directive names `sitemap-index.xml`, never `sitemap-0.xml` — RESEARCH Pitfall 4: pointing at the shard breaks discoverability silently the moment a second shard exists.
- No `filter` option added to `astro.config.mjs` for D-06 (404 exclusion) — `@astrojs/sitemap@3.7.3` already drops status-code pages by default (verified by reading the installed package source during planning, and reconfirmed here by asserting the built sitemap contains no `/404` entry).
- nginx's `/sitemap.xml` location declares no `add_header` at all, relying entirely on inheritance from `server{}` — the file's own head comment warns that declaring even one `add_header` in a location silently replaces (not merges) every inherited header, so the safest way to keep all five headers is to declare none.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' `<verify>` blocks passed on the first run with no auto-fixes needed.

## Issues Encountered

The `Edit` tool twice failed to match an old_string in `Layout.astro` despite the target text being byte-identical on inspection (confirmed via `od -c`/`grep`, no CRLF, no stray characters). Root cause undetermined — worked around by using `Write` to replace the whole file (already `Read` beforehand, so the tool's read-before-write precondition was satisfied). No functional impact; the resulting file content is correct and was verified by the full `<verify>` block afterward.

## User Setup Required

None - no external service configuration required.

## Verification Evidence

- Task 1: clean-tree `npm run build` produced `dist/favicon.svg`, `dist/favicon.ico`, `dist/apple-touch-icon.png` automatically via the existing `prebuild` hook. `file dist/favicon.ico` → `MS Windows icon resource - 1 icon, 32x32 with PNG image data, 32 x 32, 8-bit/color RGBA`. `sharp` metadata confirmed `apple-touch-icon.png` is 180x180 and `stats().isOpaque` is true. `favicon.svg` contains both `#2DD9C5` and `#0A0908` and no `<text>`/`font-family`. All three icon links (with correct `type`) found on `dist/index.html`, `dist/404.html`, `dist/listen/eseriani/index.html`. Neither raster is git-tracked (`.gitignore` entries confirmed). `npx astro check` exits 0 (one pre-existing unrelated hint on `YouTubeFacade.astro`, same as 05-01). Preview server served both files with HTTP 200; `agent-browser` captured `/tmp/darlng-phase5/favicon-180.png` and `favicon-svg.png` — both visually confirmed as a clean, legible turquoise `D` on the dark brand background.
- Task 2: clean-tree `npm run build` produced `dist/robots.txt`, `dist/sitemap-index.xml`, `dist/sitemap-0.xml`. `robots.txt` matched the expected string byte-for-byte via strict equality. `sitemap-index.xml` references `sitemap-0.xml`; `sitemap-0.xml`'s five `<loc>` values matched the expected sorted set exactly (`/` plus the four `/listen/*` pages), with no `/404` or `/500` entry. `nginx.conf` regex assertions confirmed the `location = /sitemap.xml` block contains exactly `try_files /sitemap-index.xml =404;` and no `add_header`, the `_astro` block is undisturbed, and the single immutable cache-control directive count is unchanged (still 1). `npm run check` (astro check + contrast check) exits 0.

## Known Stubs

None.

## Threat Flags

None — all five plan-scoped threats (T-05-06 robots.txt content, T-05-07 sitemap route enumeration, T-05-08 header inheritance on the new route, T-05-09 SVG rasterization, T-05-10 origin spoofing, T-05-SC hand-rolled binary vs. new dependency) were mitigated exactly as specified in the threat model and verified by this plan's own `<verify>` assertions; no new unmitigated surface was introduced.

## Next Phase Readiness

- Favicon set (D-10, IN-05 closed) and crawler discoverability (SEO-02, D-05, D-06) are complete and verified structurally.
- 05-03 must still assert the `/sitemap.xml` route's live HTTP behavior (200, correct headers) against the running nginx container — this plan only asserted the directive text and built artifacts, per Flagged Assumption 5. If 05-03 has to fall back to `astro preview` instead of the real container, that HTTP assertion must be recorded as unverified-locally on the DEPLOY.md live checklist, never silently marked passed.

---
*Phase: 05-seo-launch-polish*
*Completed: 2026-08-09*

## Self-Check: PASSED
