---
phase: 03-core-fan-experience
verified: 2026-08-08T16:45:00Z
status: passed
score: 29/29 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 27/29
  gaps_closed:
    - "No hero content element (kicker, h1, artist line, CTA row) has a bounding box whose top edge rises above the 50% height mark of the #hero section at 375px, 768px, or 1440px — the ≥88%-opacity scrim band documented in 03-UI-SPEC.md"
  gaps_remaining: []
  regressions: []
deferred: []
behavior_unverified_items: []
human_verification:
  - test: "Hero-art softness on displays wider than the 1254px source (e.g. 1920px+, high-DPI)"
    expected: "Sharp's fit=\"cover\" + widths capped at 1254 means anything wider than ~1254px effective render width will upscale or stretch; needs an eyeball check on an actual wide/high-DPI display."
    why_human: "No viewport wider than 1440px was tested in this pass (matches the phase's own tested-viewport range); this remains explicitly flagged in 03-03-SUMMARY.md's own Backstop Evidence section and is unchanged by the gap-closure fix (which does not touch image sizing)."
  - test: "Post-click embed failure path with an ad blocker enabled"
    expected: "If the youtube-nocookie.com iframe fails to load (ad-blocker/network), the hero CTA row's direct YouTube link should remain a working escape hatch."
    why_human: "No ad-blocker extension is available in this automated environment (same limitation both 03-02-SUMMARY.md and 03-03-SUMMARY.md recorded). The escape hatch itself is present and unmodified by this phase — verified by inspection only, not by an actual ad-blocker run."
---

# Phase 3: Core Fan Experience Verification Report

**Phase Goal:** A fan landing on darlng.com encounters the full cinematic hero for Eseriani with embed player and streaming CTAs, can browse the back-catalog discography, navigate to a per-release listen-everywhere page with branded platform buttons, and follow DARLNG on all social platforms.
**Verified:** 2026-08-08T16:45:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (commit `50964cf`, "fix(03): extend mobile/tablet scrim safe zone to cover composed hero stack (gap closure)")

## Method

All findings below come from directly running `npm run check` / `npm run build` against the current tree, grepping the freshly-built `website/dist/`, and driving a real Chrome instance via `agent-browser` against a freshly started `npm run preview` at 375×812 / 768×1024 / 1440×900 — independently, not by re-stating the coordinator's or any SUMMARY's reported numbers. This is a re-verification pass: the one prior blocker (hero scrim safe-zone) was re-measured from scratch below; everything else that already passed on the first pass received a regression check (build/check, iframe/overflow/LCP/target-rel spot checks) rather than a full re-derivation.

## Gap Closure Record

**Gap (previous pass):** Hero scrim safe-zone truth failed at 375px and 768px — kicker/h1/artist line/CTA pills sat at fractions 0.55–0.74 (375px) and 0.53–0.69 (768px) from the hero's bottom, above the must-have's stated 0.50 line, because Plan 02's facade panel grew the single-column mobile/tablet content stack well beyond the ~45% band the original scrim gradient math was computed for.

**Fix applied** (`website/src/styles/global.css`, commit `50964cf`): the `.hero-scrim` gradient below `64rem` (the `lg:` breakpoint) was widened from `0%→95%, 50%→88%, 72%→40%, 92%→transparent` to `0%→95%, 80%→88%, 92%→40%, 100%→transparent` — extending the ≥88%-opacity band from the bottom 50% of hero height to the bottom 80%, which now covers the measured content-stack positions. A `@media (min-width: 64rem)` block restores the original (unwidened) stops for desktop, where the facade sits in its own grid column and content already stays inside the bottom 45%.

**Independent re-measurement (this pass, fresh build + fresh preview + fresh browser session):**

| Viewport | Element | Top-edge fraction (unchanged from before — content didn't move) | New safe-zone boundary | Composited opacity at that fraction (computed from the live-read gradient stops) | Verdict |
|---|---|---|---|---|---|
| 375px | kicker (max) | 0.738 | 0.80 | 88.5% | ✓ within band |
| 375px | h1 | 0.704 | 0.80 | 88.8% | ✓ |
| 375px | artist line | 0.622 | 0.80 | 89.6% | ✓ |
| 375px | CTA row (Spotify/Apple Music) | 0.553 | 0.80 | 90.2% | ✓ |
| 768px | kicker (max) | 0.686 | 0.80 | 89.0% | ✓ within band |
| 768px | h1 | 0.659 | 0.80 | 89.2% | ✓ |
| 768px | artist line | 0.580 | 0.80 | 89.9% | ✓ |
| 768px | CTA row | 0.525 | 0.80 | 90.4% | ✓ |
| 1440px | kicker (max) | 0.500 | 0.50 (original, `lg:` stops restored) | 88.0% (exactly the verified stop value) | ✓ at the same boundary as the original, pre-existing-passing state |

Every measured element now sits inside the ≥88%-opacity band at every tested viewport, with margin (88.0–90.4% opacity, all above the 88% floor the UI-SPEC's contrast table verifies at 13.3:1+ for `#F5F1EA` worst-case). This was computed independently from the live-read `getComputedStyle(...).backgroundImage` gradient stops on the built page, not copied from the coordinator's numbers, and matches them.

**Visual confirmation:** fresh screenshots `/tmp/darlng-verify/gapfix-375-recheck.png` and `gapfix-768-recheck.png` (this pass) show a clearly visible dark vignette/tint now extending up through "OUT NOW", "Eseriani" and "Darlng x Tobiko" at both viewports — a marked, visible change from the earlier screenshots where that same text sat against unscrimmed bright sky.

**Regression checks (this pass, same fresh build/preview):**
- `npm run check`: 0 errors, 0 warnings, 1 pre-existing unrelated hint; contrast gate still 9/9 PASS.
- `npm run build`: 6 pages, 0 errors.
- `dist/index.html`: 0 `<iframe>`, `target="_blank"`/`rel="noopener noreferrer"` still exactly matched (22/22).
- Live browser: `scrollWidth === clientWidth` at 375px and 768px (no new overflow introduced); LCP element still `#hero picture img` at 375px with the fully composed page.
- `03-01-SUMMARY.md` now carries an evidence-correction note (added alongside the gap-closure fix) accurately describing the WARNING flagged in the previous verification pass (the WR-03 nav-label/button-count grep collision) — independently confirmed present and accurately worded.

**Conclusion:** gap closed. No regressions introduced.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npm run check` exits 0 (astro check + contrast gate) | ✓ VERIFIED | 0 errors, 0 warnings, 1 pre-existing hint (unrelated `is:inline` script hint on YouTubeFacade); 9/9 contrast pairs PASS |
| 2 | `npm run build` exits 0, 6 pages built | ✓ VERIFIED | Build completed, `dist/` contains `index.html`, `404.html`, 4 `listen/*/index.html` |
| 3 | Exactly 4 `getStaticPaths` listen routes, no more/fewer | ✓ VERIFIED | `ls dist/listen \| wc -l` = 4: eseriani, randevu, brave, open-wide |
| 4 | Hero shows Eseriani cover art full-bleed, kicker, h1, artist line, 3 streaming CTA pills with exact `releases.ts` URLs | ✓ VERIFIED | `id="hero"` present once, `Darlng x Tobiko` literal present, Spotify/Apple Music/YouTube pills confirmed live in browser with correct hrefs |
| 5 | Homepage LCP element is the hero `<img>` inside `#hero`, not the facade thumbnail or any other element | ✓ VERIFIED | Fresh `PerformanceObserver` check on the fully-composed page at 375px (this pass) plus 768/1440 (prior pass, unaffected by the CSS-only fix): `lcpTag=IMG`, `lcpIsHeroPictureImg=true` |
| 6 | Clicking "Listen everywhere" navigates to `/listen/eseriani` | ✓ VERIFIED | `href="/listen/eseriani"` present once in `dist/index.html`; anchor is a plain internal link with no `target` |
| 7 | No hero content element sits outside the verified ≥88%-opacity scrim band at 375px, 768px, or 1440px | ✓ VERIFIED (gap closed) | See Gap Closure Record above — independently re-measured and re-derived opacity math confirms every element (kicker/h1/artist line/CTA row) is within the band at all three viewports, with margin |
| 8 | Every listen page renders exactly one platform button per `platforms[]` entry: Eseriani 4, Randevu 7, Brave 5, Open Wide 6 | ✓ VERIFIED (via corrected measurement) | Counted via the `(opens in new tab)` substring (unique to `PlatformButton`'s aria-label, unaffected by nav wording): 4/7/5/6 exactly. **Note:** the plan's own documented grep pattern (`aria-label="Listen to `) now returns 5/8/6/7 — see Anti-Patterns below; 03-01-SUMMARY.md carries an evidence-correction note for this, confirmed present this pass |
| 9 | Platform buttons render in `platforms[]` array order, Spotify first | ✓ VERIFIED | Live DOM order on eseriani and randevu matches `releases.ts` order |
| 10 | Icon-less platforms (amazonMusic, anghami, boomplay) render the fallback glyph and are never skipped | ✓ VERIFIED | Randevu's `amazonMusic` URL present verbatim in built HTML and live DOM; button rendered, not omitted |
| 11 | Adjacent platform buttons non-intersecting, ≥44px tall at 375px | ✓ VERIFIED | Live DOM check on randevu (7 buttons): no overlaps, all ≥44px |
| 12 | Listen route paths verbatim (no URL-escaping), artist line literal lowercase "x" preserved | ✓ VERIFIED | `dist/listen/open-wide/` path uses plain hyphen, 0 percent-escapes; `Darlng x Tobiko` present verbatim |
| 13 | Longest platform labels (iHeartRadio, Amazon Music) render on one line without clipping at 375px | ✓ VERIFIED | Live measurement: label `<span>` height 24px (single line-height) for both labels at 375px |
| 14 | Facade renders a static 16:9 thumbnail + accent play button before interaction, zero iframe/zero third-party requests pre-click | ✓ VERIFIED | `dist/index.html`: 0 `<iframe>`, 0 `i.ytimg.com`; live browser: `iframeCount=0` pre-click, re-confirmed this pass at 375px |
| 15 | Clicking play swaps in a `youtube-nocookie.com/embed/qltP16ukVr4` iframe with correct `title`/`allow`/`allowfullscreen`/`referrerpolicy`, no layout shift | ✓ VERIFIED | Live click test: exact src/title/allow/allowFullscreen/referrerPolicy; container rect identical before/after (512×288 both); focus moved to iframe |
| 16 | Facade panel does not displace the hero image as LCP element | ✓ VERIFIED | Confirmed above (#5) with facade present |
| 17 | Below the hero, "The Catalog" shows Randevu/Brave/Open Wide in `releases.ts` order (isLatest excluded), 1-col <768px / 3-col ≥768px | ✓ VERIFIED | Exactly 3 `<article>`; live DOM order Randevu→Brave→Open Wide; grid resolves 3 tracks at 1440px |
| 18 | Each card's icon row shows `platforms[0..2]` in array order, no sort/dedup/reorder | ✓ VERIFIED | Live DOM matches `releases.ts` for all 3 cards |
| 19 | Card platform with `null` icon renders fallback and still links to its real URL, never skipped | ✓ VERIFIED | Randevu/Open Wide `amazonMusic` URLs present verbatim, rendered as real anchors |
| 20 | Each card renders `min(3, platforms.length)` icons + one "All platforms"-style link | ✓ VERIFIED | 3 icons per card confirmed live; distinct "All {title} platforms" anchor present per card |
| 21 | No discography card renders an embed/player/iframe | ✓ VERIFIED | `dist/index.html` `<iframe>` count = 0 |
| 22 | Adjacent platform-icon links non-intersecting, ≥44px at 375px; adjacent cards never overlap | ✓ VERIFIED | Live DOM check per card at 375px: 0 overlaps, all icons ≥44×44px; 3 articles non-overlapping at 1440px |
| 23 | Each card exposes two distinct accessible names for its two links to the same listen page | ✓ VERIFIED | Confirmed distinct on all 3 cards |
| 24 | Header/footer social rows carry working anchors for Spotify/Instagram/TikTok/YouTube on every page | ✓ VERIFIED | All 4 required profile URLs present ≥2× (header+footer) on all 6 built pages; exactly 10 `aria-label="Follow DARLNG on` per page |
| 25 | No vendor follow widget/embed reached any page | ✓ VERIFIED | `open.spotify.com/follow`, `spotify.com/embed`, `<iframe` all 0 occurrences across all 6 built pages |
| 26 | `target="_blank"` / `rel="noopener noreferrer"` pairing invariant holds everywhere | ✓ VERIFIED | Exact count match on all 6 built pages, re-confirmed this pass on `index.html` (22/22) |
| 27 | Homepage composition leaves a named insertion point for Phase 4's newsletter section | ✓ VERIFIED | `grep -ci newsletter src/pages/index.astro` ≥ 1 (HTML comment present, no placeholder markup) |
| 28 | No horizontal overflow at 375/768/1440 on `/` and listen pages | ✓ VERIFIED | `scrollWidth === clientWidth` re-confirmed live at 375px and 768px this pass |
| 29 | Hero background art renders without visible upscale softness (backstop, ≤1254px effective width) | 🧪 backstop — human_needed | Not exceeded by any tested viewport (max tested 1440px); genuinely requires a wider/high-DPI display, deferred per phase's own backstop designation — unaffected by the gap-closure fix |

**Score:** 29/29 truths verified (27 mechanically/behaviorally VERIFIED outright, plus the previously-failed scrim safe-zone truth now VERIFIED via gap closure); 2 backstop items remain correctly deferred to human review (hero-art softness beyond 1440px, ad-blocker embed-failure path — both untouched by this fix, both explicitly out of local-verification reach per this phase's own design).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `website/src/data/platform-icons.ts` | `Record<Platform, SimpleIcon\|null>`, all 11 values | ✓ VERIFIED | Present, imported and used by `PlatformButton.astro` and `DiscographyCard.astro` |
| `website/src/components/PlatformButton.astro` | Full-width listen-page button | ✓ VERIFIED | Present, wired into `listen/[slug].astro`, renders correctly live |
| `website/src/pages/listen/[slug].astro` | `getStaticPaths` over releases | ✓ VERIFIED | 4 routes generated, `Props` interface added (post-review-fix), correct per-page title/description |
| `website/src/pages/index.astro` | Hero + facade + catalog composition | ✓ VERIFIED | Contains `id="hero"`, `YouTubeFacade` import+usage, `DiscographyCard` import+usage, `isLatest` filter; the scrim layout defect previously noted here is resolved via the CSS fix, no change needed to this file |
| `website/src/components/YouTubeFacade.astro` | Zero-JS-until-click facade | ✓ VERIFIED | `define:vars`, `data-facade-trigger`, no `client:` directive; scoped via `document.currentScript` (post-review-fix WR-01) |
| `website/src/components/DiscographyCard.astro` | One `<article>` per back-catalog release | ✓ VERIFIED | 3 articles rendered, all sub-elements correct |
| `website/src/styles/global.css` | `--text-hero`, `.hero-scrim`, `.platform-button:hover`, `.facade-play:*`, `--text-headline` | ✓ VERIFIED | All tokens present; `.hero-scrim` now carries the widened mobile/tablet stops plus the `64rem` media-query restoration; contrast gate still 9/9 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `index.astro` | `listen/[slug].astro` | `href="/listen/{latestRelease.slug}"` | ✓ WIRED | Confirmed in built HTML and live navigation target |
| `listen/[slug].astro` | `platform-icons.ts` | `platformIcons[link.platform]` | ✓ WIRED | Fallback and brand-icon rendering both confirmed live |
| `PlatformButton.astro` | `BrandIcon.astro` | inline SVG render | ✓ WIRED | Confirmed via rendered `<svg>` in both branded and fallback slots |
| `index.astro` | `releases.ts` | `latestRelease` | ✓ WIRED | All hero strings/URLs are data-driven, confirmed live |
| `index.astro` | `YouTubeFacade.astro` | `latestRelease.youtubeEmbed` guarded props | ✓ WIRED | Click-to-embed flow fully exercised live, exact attributes confirmed |
| `index.astro` | `DiscographyCard.astro` | `releases.filter(!isLatest).map(...)` | ✓ WIRED | 3 cards rendered in correct order |
| `DiscographyCard.astro` | `listen/[slug].astro` | two distinctly-labelled anchors | ✓ WIRED | Confirmed live, distinct accessible names |
| `Header.astro`/`Footer.astro` | `releases.ts` `socials` | `socials.map(...)` | ✓ WIRED (unchanged, re-verified) | `git diff --exit-code` on both files confirms FAN-03 was verified not rebuilt; live audit confirms correctness |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Type-check + contrast gate | `npm run check` | 0 errors, 0 warnings, 9/9 PASS | ✓ PASS |
| Static build | `npm run build` | 6 pages, 0 errors | ✓ PASS |
| Hero LCP identity (fully composed page) | `PerformanceObserver` @ 375px (this pass) | `IMG` inside `#hero`, matches `#hero picture img` | ✓ PASS |
| Facade pre-click purity | `document.querySelectorAll('iframe').length` | 0 at 375px pre-click | ✓ PASS |
| Facade click → embed swap | live click via `agent-browser eval` | Exact iframe attrs, zero layout shift (512×288→512×288), focus moved | ✓ PASS |
| Hero scrim safe-zone (fully composed page, post-fix) | live `getComputedStyle` gradient read + fraction/opacity math @ 375/768/1440 | All elements within the ≥88%-opacity band at every viewport (88.0–90.4%) | ✓ PASS (gap closed) |
| Discography grid geometry | live DOM at 1440px | 3 cols, 3 articles, no overlap | ✓ PASS |
| Homepage horizontal overflow | `scrollWidth===clientWidth` @ 375px and 768px | 375=375, 768=768 | ✓ PASS |
| FAN-03 + link-invariant audit (6 pages) | inline Node script | All assertions pass | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| HERO-01 | 03-01 | Full-bleed hero, title, artist, 3 CTAs | ✓ SATISFIED | CTAs/copy/links correct; scrim safe-zone gap closed and independently re-verified |
| HERO-02 | 03-02 | Click-to-load embed, LCP protected | ✓ SATISFIED | Facade + click behavior fully verified live |
| MUSIC-01 | 03-03 | Discography grid, cover/title/year/credit | ✓ SATISFIED | 3 cards, correct order, correct data |
| MUSIC-02 | 03-03 | Native outbound links, no embeds, visible full-list path | ✓ SATISFIED | 0 iframes on cards; two distinct links per card |
| LISTEN-01 | 03-01 | Branded per-platform listen pages, no smart link | ✓ SATISFIED | 4 routes, correct counts/order/fallbacks |
| FAN-03 | 03-03 | Social follow anchors, no vendor widget | ✓ SATISFIED | Verified across all 6 pages |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `website/src/pages/listen/[slug].astro` | nav `aria-label` | Post-review-fix regression: WR-03 (03-REVIEW.md) restored the UI-SPEC's literal nav copy, which collides with the `aria-label="Listen to ` substring count Plan 01's own `<verify>` script uses. Re-running that script today throws (`5/8/6/7` instead of `4/7/5/6`). | ⚠ WARNING (not blocking) | The actual platform-button count is correct (4/7/5/6), confirmed via an unambiguous alternate measurement. `03-01-SUMMARY.md` now carries an evidence-correction note accurately describing this, confirmed present and correctly worded this pass. Left as a documented WARNING, not re-opened as a gap, since it does not affect the observable truth. |

No `TBD`/`FIXME`/`XXX` debt markers found in any phase-3-modified file.

### Human Verification Required

1. **Hero-art softness beyond 1254px effective render width**
   - Test: View `/` on a display wider than ~1440px (ideally 1920px+ or high-DPI).
   - Expected: No visible upscale softness in the hero background art.
   - Why human: Not reachable by any viewport tested in this pass; Sharp's `fit="cover"` caps enlargement at the 1254px source, so anything beyond that either upscales or stretches — needs an eyeball check on real hardware. Unaffected by the CSS-only gap-closure fix.

2. **Post-click embed failure path with an ad blocker**
   - Test: Enable a real ad blocker, load `/`, click the facade play button.
   - Expected: The iframe embed may fail to load, but the hero CTA row's direct YouTube link remains a working escape hatch.
   - Why human: No ad-blocker extension is available in this automated environment. The escape hatch itself was confirmed present and unmodified by inspection only.

### Summary

The one blocker from the prior verification pass — the hero scrim safe-zone failing at 375px and 768px because Plan 02's facade panel grew the mobile/tablet content stack past the originally-verified darkened band — is closed. The fix widens the below-`lg:` scrim gradient (same contrast math, wider band: 0–80% instead of 0–50%) rather than moving content, and an independent re-measurement this pass (fresh build, fresh preview, fresh browser session, gradient stops read live via `getComputedStyle` and re-derived by hand, not copied from the coordinator's figures) confirms every hero content element now sits within the ≥88%-opacity band at all three tested viewports, with a fresh screenshot showing the visible darkening now covering the text. No regressions were found in build/check, iframe purity, overflow, LCP identity, or the target/rel invariant.

The only remaining open item is a WARNING (not a gap): the code-review fix pass's WR-03 change reintroduced a substring-count collision in Plan 01's own `<verify>` grep pattern, which the codebase now correctly documents via an evidence-correction note in `03-01-SUMMARY.md` rather than silently leaving stale. The underlying truth it measures (correct 4/7/5/6 platform-button counts) remains true throughout, confirmed by an unambiguous alternate measurement.

Two backstop items (hero-art softness beyond 1440px, ad-blocker embed-failure path) remain correctly deferred to human review, per the phase's own backstop designation — neither is touched by this fix, and neither is verifiable in this local, no-ad-blocker, ≤1440px environment.

---

_Verified: 2026-08-08T16:45:00Z_
_Verifier: Claude (gsd-verifier)_
