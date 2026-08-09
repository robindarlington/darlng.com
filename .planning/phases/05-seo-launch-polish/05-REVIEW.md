---
phase: 05-seo-launch-polish
reviewed: 2026-08-09T10:36:25Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - website/.gitignore
  - website/DEPLOY.md
  - website/nginx.conf
  - website/package.json
  - website/public/favicon.svg
  - website/public/robots.txt
  - website/scripts/generate-assets.mjs
  - website/src/components/DiscographyCard.astro
  - website/src/components/YouTubeFacade.astro
  - website/src/layouts/Layout.astro
  - website/src/pages/404.astro
  - website/src/pages/index.astro
  - website/src/pages/listen/[slug].astro
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
fixed_at: 2026-08-09T12:41:00Z
resolution_status: fixed_with_accepted_risks
---

# Phase 5: Code Review Report

**Reviewed:** 2026-08-09T10:36:25Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

**Fixed:** 2026-08-09T12:41:00Z — all 3 warnings and 3 of 5 info findings fixed
(WR-01, WR-02, WR-03, IN-01, IN-02, IN-04); IN-03 and IN-05 accepted as
low-value/already-documented risk (see their Resolution notes below). See
per-finding **Resolution:** notes for commit hashes and verification detail.

## Summary

Reviewed the OG/Twitter meta block, the Sharp prebuild asset generator
(`generate-assets.mjs`), the `nginx.conf` additions, `robots.txt`, and the
LCP-preload/`Picture` parameter-identity contract in `index.astro`. I ran a real
`npm run build` and diffed the emitted `dist/` HTML against the source to verify
claims rather than trust comments — the preload `<link>` and the hero `<Picture>`'s
avif `<source>` currently emit byte-identical `srcset` URLs (verified), the
`.ico` container round-trips through `file(1)` as a valid single-image 32×32 PNG-ICO
(verified), the `/sitemap.xml` nginx location correctly omits `add_header` so it
inherits the server block's security headers (verified), and `robots.txt` matches
the documented allow-all body.

No blockers found — no injection paths, no secrets, no crashes, no auth bypass. The
findings below are quality/robustness gaps: a template bug that doubles the brand
name in every page's `og:image:alt`, two silent-drift risks (`generate-assets.mjs`'s
hand-maintained release list vs. `releases.ts`, and the hero preload/`Picture`
parameter duplication called out explicitly in the review brief), plus several
minor completeness/robustness nits.

## Warnings

### WR-01: `og:image:alt` doubles the brand name on every page

**File:** `website/src/layouts/Layout.astro:61`
**Issue:** The tag unconditionally appends `— DARLNG` to whatever `title` was
passed in:
```astro
<meta property="og:image:alt" content={`${title} — DARLNG`} />
```
Every page's `title` prop already contains the brand name (`'DARLNG'` on the
homepage, `` `Listen to ${release.title} — DARLNG` `` on listen pages, `'Not
found — DARLNG'` on 404). Verified in the actual build output:
```
$ grep -o 'og:image:alt" content="[^"]*"' dist/index.html
og:image:alt" content="DARLNG — Afro / RnB / Pop — DARLNG"
$ grep -o 'og:image:alt" content="[^"]*"' dist/listen/eseriani/index.html
og:image:alt" content="Listen to Eseriani — DARLNG — DARLNG"
```
This is exactly the kind of thing the DEPLOY.md opengraph.xyz check (Section
"SEO, cards, and performance") will surface — a visibly malformed alt string on
every single social card.
**Fix:** Don't derive the alt from `title` by string concatenation. Either drop the
suffix (the title already contains the brand):
```astro
<meta property="og:image:alt" content={title} />
```
or accept an explicit `imageAlt` prop with its own default, decoupled from the
page `<title>` entirely.

**Resolution:** Fixed — commit `d652bad`. `og:image:alt` now uses `title` verbatim
(no suffix). Verified in built HTML across all 6 pages (home, 4 listen pages, 404):
no page doubles "DARLNG".

### WR-02: `generate-assets.mjs`'s release list can silently drift from `releases.ts`

**File:** `website/scripts/generate-assets.mjs:149-186`
**Issue:** `RELEASE_CARDS` is a hand-transcribed literal copy of `releases.ts`'s
slugs, with the file's own comment acknowledging the duplication ("must be kept
in step with it"). There is no build-time check tying the two together. If a
future release is added to `releases.ts` without a matching entry here, the build
succeeds with no error or warning, but `listen/[slug].astro` will still emit
`image={`/og/${release.slug}.png`}` for that release (line 37 of that file) —
pointing at a PNG that was never generated. The failure mode is a 404 on the
social-card image in production, discoverable only by manually running an
opengraph.xyz-style check per release, not by `npm run build` or `astro check`.
This is precisely the kind of invariant the codebase otherwise enforces loudly —
`releases.ts`'s own `latestRelease` IIFE and `listen/[slug].astro`'s
`spotifyArtist` check both throw at build time rather than fail silently.
**Fix:** Add the same fail-loud posture here. Cheapest option: keep the literal
list (avoiding the documented tradeoff of importing the `.ts` module from a plain
Node script) but add a static count assertion, e.g.:
```js
const EXPECTED_RELEASE_COUNT = 4; // keep in sync with releases.ts — see comment above
if (RELEASE_CARDS.length !== EXPECTED_RELEASE_COUNT) {
	throw new Error(
		`generate-assets: RELEASE_CARDS has ${RELEASE_CARDS.length} entries, expected ${EXPECTED_RELEASE_COUNT}. Update this list when releases.ts changes.`
	);
}
```
or, more robustly, add a `check:og-assets` npm script that greps `releases.ts`
slugs and diffs them against `RELEASE_CARDS` / `public/og/*.png`, run alongside
`npm run check`.

**Resolution:** Fixed — commit `6dac3bd`. Added `assertReleaseCardsMatchSource()`,
called at the top of `main()`, which reads `releases.ts` as text, extracts every
`slug: '...'` occurrence via regex, and throws a descriptive error listing exactly
which slugs are missing on either side if `RELEASE_CARDS` and `releases.ts` ever
diverge. Verified by temporarily corrupting a slug in `RELEASE_CARDS` and
confirming the script throws with the expected diff message, then reverting and
confirming a clean run.

### WR-03: Hero `Picture` and LCP `getImage` preload share no single source of truth

**File:** `website/src/pages/index.astro:36-43` and `:54-64`
**Issue:** The review brief explicitly calls out this risk, and it is real: the
`getImage` call that produces the preload `srcset` and the hero `<Picture>` are
two independent literals that must be kept parameter-identical by hand:
```js
const heroAvif = await getImage({
	src: latestRelease.cover,
	format: 'avif',
	widths: [480, 640, 750, 960, 1254],
	quality: 55,
	fit: 'cover',
});
```
```astro
<Picture
	src={latestRelease.cover}
	formats={['avif', 'webp']}
	widths={[480, 640, 750, 960, 1254]}
	sizes="100vw"
	fit="cover"
	quality={55}
	priority
	...
```
I confirmed these currently match (both emit identical `_astro/eseriani.*.avif`
filenames in `dist/index.html`), but nothing enforces that going forward — a
future edit to add a breakpoint to one array and not the other, or to change
`quality`, builds cleanly and passes `astro check`; the only symptom is a doubled
image download in production, which is not caught by any test in this repo.
**Fix:** Extract the shared parameters into one constant used by both call sites,
so a future edit to one point of truth can't drift from the other:
```ts
const HERO_IMAGE_PARAMS = {
	widths: [480, 640, 750, 960, 1254],
	quality: 55,
	fit: 'cover' as const,
};
// ...
const heroAvif = await getImage({ src: latestRelease.cover, format: 'avif', ...HERO_IMAGE_PARAMS });
// <Picture src={latestRelease.cover} formats={['avif', 'webp']} sizes="100vw" priority {...HERO_IMAGE_PARAMS} .../>
```

**Resolution:** Fixed — commit `e82892c`. Added `src/data/hero-image.ts` exporting
`HERO_IMAGE_PARAMS`, consumed via spread by both the `getImage` preload call and
the hero `<Picture>` in `index.astro`. Verified in built `dist/index.html`: the
preload `imagesrcset` and the `<picture>`'s avif `<source srcset>` are
byte-identical URLs.

## Info

### IN-01: `og:type="music.album"` is under-specified per OGP

**File:** `website/src/pages/listen/[slug].astro:34-40`; `website/src/layouts/Layout.astro:65`
**Issue:** Pages declare `type="music.album"` but Layout only ever emits
`music:musician`. Per ogp.me, `music.album` also expects `music:release_date`
and/or `music:song` properties for full validator recognition (e.g. Facebook's
Sharing Debugger). The data is already on hand (`release.year`), just unused for
this purpose. Not a functional break — crawlers degrade gracefully on missing
sub-properties — but worth tightening while this phase is already touching OG
metadata.
**Fix:** Add a `music:release_date` meta (e.g. `content={`${release.year}`}`) via
an optional Layout prop, similar to how `musician` is threaded through today.

**Resolution:** Fixed — commit `06f0109`. Added an optional `releaseDate` prop to
`Layout.astro` (rendered as `music:release_date` when set), threaded from
`listen/[slug].astro` as `` `${release.year}` ``. Verified in built HTML across
all 4 listen pages: correct year emitted per release (2026/2024/2020/2019).

### IN-02: LCP preload `<link>` omits `type="image/avif"`

**File:** `website/src/layouts/Layout.astro:77-85`
**Issue:** The preload link supplies `imagesrcset`/`imagesizes` but no `type`
attribute. Browsers without AVIF support (older Safari) will still fetch the
preloaded `.avif` URLs — since `<link rel=preload>` doesn't perform the same
format-capability negotiation `<picture>`'s `<source type>` does — and then the
actual `<picture>` falls back to the `webp` source, wasting the preloaded bytes
for that browser cohort and giving them no LCP benefit from the preload at all.
**Fix:** Add `type="image/avif"` to the preload link so capability-aware browsers
skip it cleanly, or preload the `webp` variant instead/in addition, weighing
against current avif browser support.

**Resolution:** Fixed — commit `641e5f3`. Added `type="image/avif"` to the
preload `<link>` in `Layout.astro`. Verified in built `dist/index.html`.

### IN-03: OG card PNGs are large for their format

**File:** `website/scripts/generate-assets.mjs:58-69`
**Issue:** `generateCard`'s `.png()` calls use library defaults with no
`compressionLevel`/`palette` tuning. The generated `public/og/*.png` files are
800KB–1.1MB each for photographic 1200×630 content — well above what a JPEG/WebP
equivalent would produce for the same visual content. This doesn't break
anything (social platforms accept files far larger than this) but it's an easy
win given the phase already tuned image quality elsewhere (hero/catalog
`quality=55`).
**Fix:** Consider `png({ compressionLevel: 9, palette: true })` or switching the
OG card output to JPEG/WebP if any target platform's OG scraper is known to
prefer it.

**Resolution:** Accepted, not implemented. Social platforms accept OG images far
larger than the current 800KB–1.1MB output; this is a file-size nit with no
functional or ranking impact, and not worth the compression-tuning/format-switch
tradeoff analysis right now. Revisit if OG image load time ever becomes a
measured problem.

### IN-04: `main()` catch handler discards the stack trace

**File:** `website/scripts/generate-assets.mjs:191-194`
**Issue:**
```js
main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
```
Only `err.message` is logged, not the stack. For a build script that composites
images and hand-writes binary formats, a bare message (e.g. a Sharp libvips
error) can be hard to localize to a specific step without the stack trace.
**Fix:** `console.error(err);` (or `console.error(err.stack ?? err.message)`) to
retain full diagnostics on build failure.

**Resolution:** Fixed — commit `a2aa7cb`. `main().catch()` now logs `console.error(err)`
(full error object, including stack) instead of `err.message` alone.

### IN-05: No Content-Security-Policy header in `nginx.conf`

**File:** `website/nginx.conf:23-27`
**Issue:** The server block sets `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, and `Permissions-Policy`, but no `Content-Security-Policy`.
For a static site embedding third-party iframes (YouTube facade) this is a
reasonable minimal baseline, but worth a deliberate note/decision rather than an
implicit omission, since the header inheritance pattern here (documented at
lines 17-22) makes adding one later straightforward — it only needs to be added
once to the `server{}` block for all three location blocks to inherit it.
**Fix:** Add a CSP scoped to what the site actually loads (self + Google's
YouTube-nocookie iframe origin + Fontsource-inlined fonts are all same-origin
already), or explicitly note in a comment that CSP was considered and deferred.

**Resolution:** Accepted, not implemented — already a documented, deliberate
Phase-5-deferred risk (T-03-05). No new action needed here; see that decision
record for the accepted-risk rationale rather than duplicating it.

---

_Reviewed: 2026-08-09T10:36:25Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
