---
phase: 05-seo-launch-polish
fixed_at: 2026-08-09T12:41:00Z
review_path: .planning/phases/05-seo-launch-polish/05-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
accepted: 2
status: all_fixed
---

# Phase 5: Code Review Fix Report

**Fixed at:** 2026-08-09T12:41:00Z
**Source review:** .planning/phases/05-seo-launch-polish/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (per explicit task instruction — all 3 warnings + IN-01, IN-02, IN-04): 6
- Fixed: 6
- Skipped: 0
- Explicitly out of scope, marked accepted in 05-REVIEW.md (not attempted, per instruction): IN-03, IN-05

**Verification environment:** an isolated git worktree at
`/tmp/sv-05-reviewfix-l1OBST` on temp branch `gsd-reviewfix/05-24842`
(branched from `master`), with `website/node_modules` symlinked in from the
main checkout for build tooling (macOS — no reparse-point risk). All builds,
`npm run check`, and HTML verification below ran inside that worktree. Commits
were fast-forwarded onto `master` and the worktree removed as part of this
run's cleanup — the commit hashes below are reachable from `master` after
cleanup, but the `dist/` output itself was not preserved (gitignored, and
`rm -rf`'d before cleanup).

## Fixed Issues

### WR-01: `og:image:alt` doubles the brand name on every page

**Files modified:** `website/src/layouts/Layout.astro`
**Commit:** `d652bad`
**Applied fix:** Changed `content={`${title} — DARLNG`}` to `content={title}` —
every page's `title` already contains "DARLNG", so the suffix was redundant
and produced doubled text (e.g. "DARLNG — Afro / RnB / Pop — DARLNG").

### WR-02: `generate-assets.mjs`'s release list can silently drift from `releases.ts`

**Files modified:** `website/scripts/generate-assets.mjs`
**Commit:** `6dac3bd`
**Applied fix:** Added `assertReleaseCardsMatchSource()`, called at the top of
`main()`. It reads `src/data/releases.ts` as plain text, extracts every
`slug: '...'` occurrence via regex (`/slug:\s*'([^']+)'/g`), and throws a
descriptive error naming exactly which slugs are missing on either side if
`RELEASE_CARDS` and `releases.ts` ever diverge. No TS loader/import needed —
stays a plain ESM Node script. Verified the guard actually fires by
temporarily renaming one `RELEASE_CARDS` slug, confirming the expected throw
message, then reverting and confirming a clean run.

### WR-03: Hero `Picture` and LCP `getImage` preload share no single source of truth

**Files modified:** `website/src/data/hero-image.ts` (new), `website/src/pages/index.astro`
**Commit:** `e82892c`
**Applied fix:** Extracted `widths`/`quality`/`fit` into an exported
`HERO_IMAGE_PARAMS` const in the new `src/data/hero-image.ts`, consumed via
object spread by both the `getImage` preload call and the hero `<Picture>`.
Verified in built `dist/index.html`: the preload `imagesrcset` and the
`<picture>`'s avif `<source srcset>` are byte-identical URLs.

### IN-01: `og:type="music.album"` is under-specified per OGP

**Files modified:** `website/src/layouts/Layout.astro`, `website/src/pages/listen/[slug].astro`
**Commit:** `06f0109`
**Applied fix:** Added an optional `releaseDate` prop to `Layout.astro`
(rendered as `music:release_date` when present), threaded from
`listen/[slug].astro` as `` `${release.year}` ``. Only the cheap, provably
correct part was implemented, per task scope — no speculative
`music:song`/`og:audio` additions. Verified in built HTML: correct year per
release across all 4 listen pages (2026/2024/2020/2019).

### IN-02: LCP preload `<link>` omits `type="image/avif"`

**Files modified:** `website/src/layouts/Layout.astro`
**Commit:** `641e5f3`
**Applied fix:** Added `type="image/avif"` to the preload `<link>`. Verified in
built `dist/index.html`.

### IN-04: `main()` catch handler discards the stack trace

**Files modified:** `website/scripts/generate-assets.mjs`
**Commit:** `a2aa7cb`
**Applied fix:** Changed `console.error(err.message)` to `console.error(err)`
so the full error object (including stack) is logged on build failure.

## Accepted (not implemented, per explicit task instruction)

### IN-03: OG card PNGs are large for their format

**File:** `website/scripts/generate-assets.mjs:58-69`
**Rationale:** Social platforms accept files far larger than the current
800KB–1.1MB OG PNGs; this is a file-size optimization with no functional or
ranking impact. Not worth the compression-tuning/format-switch tradeoff
analysis right now. Documented as accepted in `05-REVIEW.md`.

### IN-05: No Content-Security-Policy header in `nginx.conf`

**File:** `website/nginx.conf:23-27`
**Rationale:** Already a documented, deliberate accepted risk from Phase 3
(`T-03-05` in `.planning/phases/03-core-fan-experience/03-SECURITY.md` and
`03-02-PLAN.md`) — CSP was explicitly deferred with a recorded dependency
note ("if Phase 5 introduces a strict `script-src`, this script needs a nonce
or hash"). Documented as accepted (no new action) in `05-REVIEW.md` rather
than duplicating the existing decision record.

## Full Verification Performed

- `npm run check` (astro check + contrast check): 0 errors, 0 warnings, 1
  pre-existing unrelated hint (`YouTubeFacade.astro` inline script) — clean.
- `npm run build` with no `PUBLIC_LISTMONK_*` env vars set: 6 pages built,
  succeeded.
- `npm run build` with `PUBLIC_LISTMONK_URL` / `PUBLIC_LISTMONK_LIST_UUID`
  set: 6 pages built, succeeded (both env directions green).
- Built HTML grep-verified across all 6 pages (`/`, 4×`/listen/<slug>`,
  `/404`): no doubled `DARLNG` in `og:image:alt`.
- Built HTML grep-verified: preload `<link>` carries `type="image/avif"`.
- Built HTML grep-verified: preload `imagesrcset` and hero `<picture>` avif
  `<source srcset>` are byte-identical strings (parameter-identity contract
  holds after the `HERO_IMAGE_PARAMS` refactor).
- Built HTML grep-verified: `music:release_date` present with correct year on
  all 4 listen pages.
- `public/og/*.png` (5 files) and `public/favicon.ico` /
  `public/apple-touch-icon.png` regenerated successfully by `generate-assets.mjs`
  under the new drift guard.
- `generate-assets.mjs` drift guard manually fault-injected (renamed a
  `RELEASE_CARDS` slug) and confirmed it throws with the expected mismatch
  message; reverted and confirmed clean run.

---

_Fixed: 2026-08-09T12:41:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
