---
phase: 05-seo-launch-polish
plan: 03
subsystem: perf
tags: [lighthouse, axe, nginx, gzip, core-web-vitals, accessibility, deploy]

# Dependency graph
requires:
  - phase: 05-seo-launch-polish
    provides: "05-01: Layout.astro OG/Twitter head block, prebuild social-card generator. 05-02: favicon set, robots.txt, sitemap, nginx /sitemap.xml route."
provides:
  - "Four Lighthouse lab runs (mobile+desktop x home+listen) against dist/ served by the real nginx.conf in an nginx:stable-alpine container — the numbers a live PageSpeed run should be compared against"
  - "nginx gzip compression for text-based responses (html/css/svg/json/xml)"
  - "Font preloads demoted to fetchpriority=low so they no longer compete with the LCP hero image"
  - "Listen page cover Picture gains a sizes prop, closing a PERF-02 edge-lift gap"
  - "Zero critical / zero contrast axe violations across home, a listen page, and 404"
  - "website/DEPLOY.md Section 4 gains a second deferred-checks subsection for live PageSpeed/opengraph.xyz/Search Console/robots+sitemap/favicon checks"
affects: []

actuals:
  tokens: 1500
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "nginx gzip_types scoped to text-based MIME types only — binary avif/webp/ico are never re-compressed"
    - "fetchpriority=low on non-LCP-critical preloads to avoid bandwidth contention with the actual LCP resource on constrained mobile networks"

key-files:
  created: []
  modified:
    - website/nginx.conf
    - website/src/layouts/Layout.astro
    - website/src/pages/listen/[slug].astro
    - website/DEPLOY.md

key-decisions:
  - "Ran the container path (Docker daemon started successfully after Task 1's bounded poll) — all nginx-only assertions (/sitemap.xml 200, no-cache on HTML, immutable on hashed assets) verified against the real serving layer, not the astro preview fallback"
  - "Added gzip compression to nginx.conf even though it wasn't in the plan's declared <files> list for Task 1 — a render-blocking-work fix squarely within the plan's sanctioned levers, and the file under test is nginx.conf itself; documented as a deviation below"
  - "Stopped fix attempts at three for the one missed metric (home-page mobile LCP) per the plan's explicit budget, and documented the honest 366ms miss rather than relaxing the threshold or narrowing the scanned pages"
  - "Left the hero Picture's three width candidates (640/960/1254) and avif-first source order untouched — both are pinned by the plan's no-degradation gate and an explicit A/B test (webp-first) confirmed avif-first was already optimal"

patterns-established:
  - "gzip_types list stays text-only; any future binary format added to the site should not be added to gzip_types"

requirements-completed: [PERF-01, PERF-02]

coverage:
  - id: D1
    description: "Four Lighthouse runs (mobile+desktop x home+listen) measured against dist/ served by the real nginx.conf in a container; three of four pass every Core Web Vitals target, one (home mobile LCP) documented as an honest 366ms miss after three in-scope fix attempts"
    requirement: PERF-01
    verification:
      - kind: other
        ref: "npx lighthouse against http://localhost:8080/ and /listen/eseriani/, mobile+desktop, JSON parsed for LCP/CLS/TBT/perf-score; results in /tmp/darlng-phase5/metrics.md"
        status: fail
    human_judgment: true
    rationale: "home-page mobile LCP measures 2866ms against a 2500ms target after three genuine fix attempts (nginx gzip, font preload deprioritization, avif-order confirmation) — an honestly documented miss per the plan's own escape-hatch clause, not something further automation in this phase's scope can close. A human should weigh whether the live PageSpeed number (deferred to DEPLOY.md) still misses before treating this as unresolved."
  - id: D2
    description: "nginx-only route and header contract verified against the real container: /sitemap.xml returns 200 with a sitemap index body, HTML carries cache-control no-cache, hashed _astro assets carry the immutable header"
    requirement: PERF-02
    verification:
      - kind: other
        ref: "curl assertions against the running nginx:stable-alpine container bind-mounting dist/ and nginx.conf"
        status: pass
    human_judgment: false
  - id: D3
    description: "No fan-facing feature removed or downgraded to reach a number: facade container, catalog heading, newsletter section, exactly 5 homepage images, hero eager+high-priority load with 3 srcset widths all still present in the measured HTML"
    requirement: PERF-01
    verification:
      - kind: unit
        ref: "node no-degradation assertion script over dist/index.html"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every image across the six built pages carries width+height, a strictly-ascending multi-candidate srcset within the 1254px source intrinsic width, and a sizes attribute"
    requirement: PERF-02
    verification:
      - kind: unit
        ref: "node PERF-02 edge-gate assertion script over all six dist/*.html files — 9 images total, all dimensioned, ascending srcset, sizes present"
        status: pass
    human_judgment: false
  - id: D5
    description: "Axe scan of home, a listen page, and 404 yields zero critical and zero contrast violations, decided by parsing the JSON impact field rather than the CLI's own exit code"
    requirement: PERF-01
    verification:
      - kind: unit
        ref: "npx @axe-core/cli against the three pages, JSON captured to /tmp/darlng-phase5/axe.json, node script filtering violations[].impact === 'critical' or id containing 'contrast'"
        status: pass
    human_judgment: false
  - id: D6
    description: "website/DEPLOY.md gains a second Section 4 deferred-checks subsection naming the live-domain checks this phase could not run locally, with the measured Lighthouse table quoted verbatim"
    requirement: PERF-01
    verification:
      - kind: unit
        ref: "node script asserting DEPLOY.md Section 4 contains both deferred-check subsections and every required live-check item (PageSpeed, opengraph.xyz, Search Console, sitemap-index.xml, robots.txt, /sitemap.xml, favicon)"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-08-09
status: complete
---

# Phase 5 Plan 3: Lighthouse + Axe Quality Loop and DEPLOY.md Live Checklist Summary

**Four Lighthouse runs against `dist/` served by the real nginx.conf in a Docker container: gzip compression + font-preload deprioritization + a missing `sizes` prop closed three of four Core Web Vitals gates; home-page mobile LCP measures 2866ms (366ms over target) and is documented honestly rather than gamed. Zero axe violations found. DEPLOY.md gained the live-domain deferred-checks list.**

## Performance

- **Duration:** 27 min
- **Tasks:** 3/3 complete
- **Files modified:** 4 (website/nginx.conf, website/src/layouts/Layout.astro, website/src/pages/listen/[slug].astro, website/DEPLOY.md)
- **Commits:** 2 (Task 2 required zero code changes — axe found nothing to fix)

## Accomplishments

- **Docker container path used throughout** (`SERVER_KIND=docker`, recorded at `/tmp/darlng-phase5/server-kind.txt`). The daemon was down at plan-start; `open -a Docker` plus a bounded poll brought it up in 5s. All nginx-only assertions ran against the real `nginx:stable-alpine` container bind-mounting `dist/` and this repo's own `nginx.conf` — never fell back to `astro preview`.
- **nginx-only route/header contract verified live:** `/sitemap.xml` → 200 with a `sitemapindex` body; `index.html` → `cache-control: no-cache`; a hashed `_astro` asset → `max-age=31536000, immutable`.
- **Four Lighthouse runs**, JSON parsed for LCP/CLS/TBT/performance-score (never printed raw):

  | URL | Form factor | Server | LCP (ms) | CLS | TBT (ms) | Perf score |
  |---|---|---|---|---|---|---|
  | `/` | mobile | docker | 2866 | 0.000 | 0 | 0.95 |
  | `/` | desktop | docker | 825 | 0.000 | 0 | 0.99 |
  | `/listen/eseriani/` | mobile | docker | 1670 | 0.000 | 0 | 1.00 |
  | `/listen/eseriani/` | desktop | docker | 376 | 0.000 | 0 | 1.00 |

  Three of four pass every target (LCP < 2500ms, CLS < 0.1, TBT < 200ms). `/` on mobile misses LCP by 366ms — see Deviations below for the full root-cause writeup and the three fix attempts made.
- **Zero axe violations** of any impact level across all three scanned pages (home, `/listen/eseriani/`, `/404.html`) — `{}` empty impact breakdown, decided by parsing `violations[].impact`, never the CLI's own exit code.
- **PERF-02 verified, not rebuilt:** across all six built pages, 9 `<img>` elements total, 9/9 carry both `width` and `height`, every `srcset` has ≥2 strictly-ascending candidates none exceeding the 1254px source intrinsic width, and every image carries a `sizes` attribute.
- **No-degradation gate held:** the measured `dist/index.html` still contains the facade container, catalog heading, and newsletter section; exactly 5 homepage images; the hero still carries `loading="eager"`, `fetchpriority="high"`, and its original 3 srcset width candidates.
- **`website/DEPLOY.md`** Section 4 gained a second `### SEO, cards, and performance — the checks deferred to this deploy step` subsection: live PageSpeed Insights (with the measured lab table quoted inline for comparison), opengraph.xyz, Google Search Console `sitemap-index.xml` submission, HTTPS `robots.txt`/`/sitemap.xml` 200 checks, and a favicon/apple-touch-icon visual check.

## Task Commits

1. **Task 1: Measure the real artefact — Lighthouse against nginx, then fix until green** - `a4d5b5d` (fix) — nginx.conf gzip, Layout.astro font-preload priority, listen/[slug].astro sizes prop
2. **Task 2: Axe the three pages — filtered on impact, not on exit code** - no commit (zero violations found, no fix needed)
3. **Task 3: Hand over the live checks — DEPLOY.md and the recorded evidence** - `ce0658f` (docs)

## Files Created/Modified

- `website/nginx.conf` — added `gzip on` scoped to text-based MIME types (html/css/svg/json/xml), comp level 6; binary avif/webp/ico untouched
- `website/src/layouts/Layout.astro` — both font preload `<link>` tags gained `fetchpriority="low"` (neither font is the LCP element)
- `website/src/pages/listen/[slug].astro` — cover `<Picture>` gained `sizes="(min-width: 640px) 384px, 320px"` matching the component's own `max-w-xs sm:max-w-sm` cap
- `website/DEPLOY.md` — new Section 4 subsection for live-domain SEO/performance checks, with the measured Lighthouse table quoted inline

## Decisions Made

- Ran the Docker container path throughout (daemon came up within the bounded poll) — all container-only assertions were genuinely exercised, nothing pushed to the DEPLOY.md "unverified-in-this-environment" list.
- Modified `website/nginx.conf`, which was not in the plan's declared `<files>` list for Task 1 — see Deviations below.
- Kept the hero's three width candidates and avif-first source order exactly as built by Phases 2-3: an explicit A/B test (temporarily reordering to webp-first) made LCP measurably worse (4812ms vs 3237ms unfixed-baseline), confirming the original avif-first order was already correct. No width candidate was added despite a finer-grained breakpoint (e.g. ~750px) being a theoretically available lever, because the plan's own no-degradation gate pins the hero to exactly 3 srcset widths.
- Did not reduce AVIF quality below Astro's existing default (empirically already ≈ quality 50 for this source image) — further reduction would visibly degrade the flagship cover artwork, which the plan's prohibitions explicitly protect ("MUST NOT reach a Core Web Vitals... threshold by removing, hiding, deferring, or downgrading any fan-facing capability").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] nginx served text responses uncompressed, inflating the render-blocking critical path**
- **Found during:** Task 1 (Lighthouse home-mobile run measuring LCP 3237ms against a 2500ms target)
- **Issue:** `website/nginx.conf` had no `gzip` directives. The HTML document (49.5KB) and stylesheet (31KB) were both served uncompressed at `VeryHigh` priority, competing for simulated-mobile bandwidth against the hero image (the actual LCP element) before it could even start downloading.
- **Fix:** Added `gzip on` scoped to text-based MIME types only (`text/plain`, `text/css`, `application/javascript`, `application/json`, `image/svg+xml`, `application/xml`, `text/xml`, `application/rss+xml`) at `gzip_comp_level 6`. Binary formats (avif/webp/ico) are deliberately excluded from `gzip_types` — re-compressing already-compressed binary data wastes CPU for no size benefit.
- **Files modified:** `website/nginx.conf` — not listed in the plan's `<files>` for Task 1, but squarely within the plan's sanctioned "render-blocking work" lever, and the file under test in this task's own harness.
- **Verification:** Measured document shrank 49.5KB→12.9KB, CSS 31KB→11KB (both gzip-compressed, confirmed via `curl -H "Accept-Encoding: gzip"` and `Content-Encoding: gzip` response header). Home-mobile LCP improved 3237ms → 2866ms across three re-runs. Cache-control and immutable-header assertions re-verified unaffected.
- **Committed in:** `a4d5b5d`

**2. [Rule 1 - Bug] Font preloads competed at the same priority tier as the LCP image**
- **Found during:** Task 1, same investigation
- **Issue:** Both `<link rel="preload">` font tags had no explicit `fetchpriority`, defaulting to `High` — the same tier as the hero image's `fetchpriority="high"` `<img>`, even though neither font is the LCP element (a full-bleed photograph).
- **Fix:** Added `fetchpriority="low"` to both font preload links in `Layout.astro`.
- **Files modified:** `website/src/layouts/Layout.astro`
- **Verification:** Network-requests audit confirmed both fonts now schedule at `Low` priority. Measured effect on Lantern's simulated LCP was neutral in isolation (3237ms → 3242ms alone) but is real-world-correct network prioritization and did not regress any other metric (CLS/TBT stayed 0 throughout).
- **Committed in:** `a4d5b5d`

**3. [Rule 2 - Missing Critical] Listen page cover image had a srcset but no matching `sizes` attribute**
- **Found during:** Task 1's read_first pass over `listen/[slug].astro` (RESEARCH-flagged candidate) and confirmed by the PERF-02 edge-lift gate, which requires every `srcset` image to also carry `sizes`
- **Issue:** The `<Picture>` declared `widths={[320, 384, 640, 768]}` but no `sizes` prop, so a browser resolving `w`-descriptor candidates assumed full viewport width and could over-fetch a candidate far larger than the component's actual `max-w-xs sm:max-w-sm` render cap.
- **Fix:** Added `sizes="(min-width: 640px) 384px, 320px"` matching the Tailwind breakpoint the component itself uses.
- **Files modified:** `website/src/pages/listen/[slug].astro`
- **Verification:** PERF-02 edge gate now passes (every image has both srcset and sizes). Listen-page mobile LCP improved 2266ms → 1670ms as a direct side effect of correct candidate selection.
- **Committed in:** `a4d5b5d`

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bug fixes, 1 Rule 2 missing-critical fix)
**Impact on plan:** All three were necessary to close Core Web Vitals gaps without touching any fan-facing feature. One (`nginx.conf`) touched a file outside the plan's declared `<files>` list for Task 1 but was within the plan's own sanctioned "render-blocking work" lever and is the exact file the harness measures against.

## Issues Encountered

**Home-page mobile LCP misses its 2500ms target by 366ms (measures 2866ms) after three genuine, in-scope fix attempts.** Full root-cause and attempt log:

1. **Attempt 1 — font preload deprioritization** (kept; see Deviation 2 above). Neutral effect on Lantern's simulated LCP in isolation (3237ms → 3242ms), but real-world-correct and did not regress anything.
2. **Attempt 2 — avif/webp source order A/B test** (reverted; informative negative result). Temporarily swapping the hero's `formats` prop to `['webp', 'avif']` made the browser select the 297KB webp candidate over the 193KB avif candidate for the same 960w breakpoint, and LCP got measurably worse (4812ms). This confirmed the original avif-first order was already optimal and was reverted with no net code change.
3. **Attempt 3 — nginx gzip compression** (kept; see Deviation 1 above). The one attempt with clear measured benefit: 3237ms → 2866ms (11.5% improvement), also improving listen-page mobile LCP 2266ms → 1670ms.

**Why the remaining 366ms gap exists:** Lighthouse's default mobile throttling profile (`throttlingMethod: simulate`, 1.6Mbps throughput, 150ms RTT, 562.5ms simulated request latency, 4x CPU slowdown) applied to a full-bleed hero photograph structurally requires downloading a DPR-corrected 960w AVIF candidate (193KB — already Astro's default AVIF quality, empirically ≈50, confirmed by reproducing the exact byte count with `sharp({quality:50})`). The two remaining byte-reduction levers are both closed by this plan's own constraints: adding a finer-grained width breakpoint would violate the no-degradation gate's pin of exactly 3 srcset candidates, and reducing AVIF quality further would visibly degrade the flagship release artwork, which the plan's prohibitions explicitly protect. Per the plan's explicit instruction ("Stop after three genuine fix attempts... record the real measured number, what was tried, and why the remaining gap is what it is"), this is recorded as an honest, fully-measured miss rather than a relaxed threshold, a narrowed scan, or a hidden regression. The DEPLOY.md live-checklist addition (Task 3) surfaces this exact table to the developer and instructs comparing against the real PageSpeed Insights number once the site is live — Lighthouse's lab throttling is deliberately more conservative than most real-world mobile networks and CDN-served TLS termination, so the live number may already clear the bar.

## User Setup Required

None — no external service configuration required.

## Verification Evidence

- `/tmp/darlng-phase5/server-kind.txt`: `SERVER_KIND=docker BASE=http://localhost:8080`
- `/tmp/darlng-phase5/metrics.md`: 4 data rows, values transcribed verbatim above
- `/tmp/darlng-phase5/axe.json`: 798KB, parses as JSON, results for exactly 3 pages, 0 total violations at any impact level
- `/tmp/darlng-phase5/lh-{home,listen}-{mobile,desktop}.json`: 4 full Lighthouse JSON reports (never printed raw; parsed via node)
- `/tmp/darlng-phase5/og-*.png` (5) and `/tmp/darlng-phase5/favicon-*.png` (2): carried over from 05-01/05-02, still present, counts verified
- `npm run check` (astro check + 9-pair contrast gate): 0 errors, 0 warnings, 1 pre-existing unrelated hint (`YouTubeFacade.astro` inline-script hint, present since 05-01) both after Task 1's fixes and after Task 3's DEPLOY.md-only change
- `git status --porcelain website/` empty after every task's commit — no report, screenshot, or metric file leaked into the repo
- No `npm`/`pip`/`cargo` install ran this phase; `lighthouse@13.4.1` and `@axe-core/cli@4.12.1` both matched RESEARCH's verified versions via `npx` (transient, never added to `package.json`)

## Known Stubs

None.

## Threat Flags

None — the threat model's five mitigate-dispositioned threats (T-05-11 mock-value leakage, T-05-12 Chrome sandbox, T-05-13 bind-mount exposure, T-05-14 container DoS, T-05-15 unmeasured-number repudiation, T-05-SC supply-chain) were all honored: both `PUBLIC_LISTMONK_*` values were passed inline on the build command only and never written to a file; `git status --porcelain website/` was asserted empty after every task; Chrome ran headless with its sandbox intact; only `dist/` and `nginx.conf` were bind-mounted, both read-only; the container was force-removed on every exit path (confirmed via `docker ps -a` showing no `darlng-perf` container remaining); every reported metric traces to a Lighthouse JSON report actually written to `/tmp/darlng-phase5/`; and no new npm dependency was installed.

## Next Phase Readiness

- Phase 5 (SEO & Launch Polish) is now feature-complete across all three plans: social cards + OG meta (05-01), favicons + crawler discoverability (05-02), and this plan's Core Web Vitals + accessibility measurement + DEPLOY.md live checklist (05-03).
- The one open item is the home-page mobile LCP miss (2866ms vs 2500ms target) — not a blocker for shipping (it is honestly documented, not hidden, and the site's other 3/4 Lighthouse runs plus zero axe violations are strong), but the developer should compare against the live PageSpeed Insights number (now itemized in `DEPLOY.md` Section 4) once the Coolify cutover (Section 1) is complete, and decide whether it's worth a follow-up phase if the live number also misses.
- `website/DEPLOY.md` now carries the complete live-domain verification checklist across both the newsletter (05-04-era) and SEO/performance (05-03) deferred-check subsections — the developer has one document to work through top-to-bottom after cutover.

---
*Phase: 05-seo-launch-polish*
*Completed: 2026-08-09*

## Self-Check: PASSED
