---
phase: 02-brand-data-base-layout
reviewed: 2026-08-06T23:44:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - website/package.json
  - website/scripts/check-contrast.mjs
  - website/src/components/BrandIcon.astro
  - website/src/components/Footer.astro
  - website/src/components/Header.astro
  - website/src/data/releases.ts
  - website/src/layouts/Layout.astro
  - website/src/pages/404.astro
  - website/src/pages/index.astro
  - website/src/styles/global.css
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 02-brand-data-base-layout: Code Review Report

**Reviewed:** 2026-08-06T23:44:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the brand token system, typed release catalog, base layout, and the two nav components against `02-UI-SPEC.md`. `npx astro check` and `npm run build` both pass cleanly, `node scripts/check-contrast.mjs` correctly re-derives all 9 documented WCAG contrast ratios, and the color/type/spacing tokens verified against the UI-SPEC line up exactly (hex values, weights, sizes, tap-target math, `h-18`/`min-h-11` arithmetic all check out). No security issues found — `BrandIcon.astro` renders `icon.path` as an escaped SVG attribute (not `set:html`), and no secrets, `eval`, or injection sinks exist in this file set.

The issues found are all maintainability/robustness gaps rather than functional breakage in the current build: a hardcoded alt-text string that will silently go stale the next time the "latest" release changes, an unenforced "exactly one `isLatest: true`" data invariant backed only by a non-null assertion, duplicated icon-mapping code between `Header.astro`/`Footer.astro`, a missing skip-to-content link, plus several smaller Info-level items (a dead custom Tailwind token, redundant ARIA, duplicate landmark names, a hardcoded copyright year, and no favicon).

## Warnings

### WR-01: Cover-art alt text is hardcoded, not derived from the data it's rendering

**File:** `website/src/pages/index.astro:22-29`
**Issue:** The `<Picture>` element sources its image dynamically from `latest.cover` (`releases.find(r => r.isLatest)`), but its `alt` attribute is a hardcoded literal: `alt="DARLNG — Eseriani cover art"`. Three lines later, the caption paragraph on line 40 correctly derives the same information dynamically: `` `Latest release: {latest.title} ({latest.year}) — {latest.artistLine}` ``. The moment `isLatest` moves to a different release in `releases.ts` (which the code is explicitly designed to support), the rendered image will change but the accessible alt text will keep announcing "Eseriani" — a silent, screen-reader-only regression with no build-time signal.
**Fix:**
```astro
alt={`DARLNG — ${latest.title} cover art`}
```

### WR-02: `socialIcons` icon map is duplicated verbatim in Header and Footer

**File:** `website/src/components/Header.astro:1-13`, `website/src/components/Footer.astro:1-13`
**Issue:** Both components import the same five `simple-icons` exports and build an identical `Record<SocialPlatform, SimpleIcon>` literal. There is no single source of truth — if a sixth social platform is ever added to `socials` in `releases.ts`, it's easy to update one file's map and forget the other, producing a runtime `undefined` passed to `<BrandIcon icon={...}>` in whichever file was missed (Astro/Preact will render a broken `<path d={undefined} />`).
**Fix:** Extract the map into a shared module, e.g. `website/src/data/socialIcons.ts`, and import it from both components:
```ts
// src/data/socialIcons.ts
import { siSpotify, siInstagram, siFacebook, siYoutube, siTiktok } from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';
import type { SocialPlatform } from './releases';

export const socialIcons: Record<SocialPlatform, SimpleIcon> = {
  spotify: siSpotify,
  instagram: siInstagram,
  facebook: siFacebook,
  youtube: siYoutube,
  tiktok: siTiktok,
};
```

### WR-03: No skip-to-content link; keyboard/screen-reader users must tab through the sticky header on every page

**File:** `website/src/layouts/Layout.astro:29-35`
**Issue:** `<Header />` (with its `sticky top-0 z-50` 5-icon nav) renders before `<main>` on every page, and there is no "Skip to content" link. Keyboard and screen-reader users must tab through all 5 social icons before reaching page content, on every single page load. This is the exact case WCAG 2.4.1 "Bypass Blocks" (Level A) exists to cover, and the review's explicit focus this phase includes a11y/focus states.
**Fix:**
```astro
<body>
	<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-surface focus:text-text focus:px-4 focus:py-2 focus:rounded-card">
		Skip to content
	</a>
	<Header />
	<main id="main" class="mx-auto w-full max-w-7xl px-4 md:px-6 xl:px-8">
		<slot />
	</main>
	<Footer />
</body>
```

### WR-04: `isLatest` uniqueness is an unenforced runtime invariant backed by a non-null assertion

**File:** `website/src/data/releases.ts:30-39` (interface), `website/src/pages/index.astro:6`
**Issue:** `index.astro` does `releases.find((r) => r.isLatest)!` — the `!` tells TypeScript to trust that exactly one release has `isLatest: true`. Nothing in the `Release` type or in `releases.ts` enforces "exactly one." Today the data is correct (only `eseriani` is `true`), but if a future edit adds a new release and forgets to flip the old one's `isLatest` to `false` (or flips none), `find()` either silently returns the wrong (stale) release or, if all are `false`, returns `undefined` and the `!` assertion produces a hard crash with an unhelpful "Cannot read properties of undefined" build error rather than a clear message pointing at the actual problem.
**Fix:** Either derive "latest" without a flag (e.g. `releases[0]` with a documented "array is ordered newest-first" contract), or add an explicit guard with a clear error:
```ts
const latest = releases.find((r) => r.isLatest);
if (!latest) throw new Error('releases.ts: exactly one release must have isLatest: true');
```

## Info

### IN-01: `--radius-pill` custom token is defined but never used

**File:** `website/src/styles/global.css:25-26`
**Issue:** `--radius-pill: 9999px;` is declared in `@theme` specifically so pill shapes stay on-token per the UI-SPEC's button/icon contract, but every pill usage in the codebase (`Header.astro:32`, `Footer.astro:32`, `404.astro:11`) uses Tailwind's built-in `rounded-full` utility instead of a `rounded-pill` utility that would reference the custom token. The values happen to be numerically identical (`9999px`), so there's no visual bug today, but the token is dead code and the stated "single swappable token" architecture for pill radius isn't actually wired up.
**Fix:** Either use `rounded-pill` consistently (Tailwind 4 auto-generates `rounded-pill` from a `--radius-pill` theme key) or remove the unused token and document that `rounded-full` is the intentional choice.

### IN-02: Header and footer `<nav>` landmarks share the identical accessible name

**File:** `website/src/components/Header.astro:24`, `website/src/components/Footer.astro:24`
**Issue:** Both `<nav aria-label="Follow DARLNG">` elements exist on the same rendered page with the exact same accessible name. Screen-reader users browsing by landmarks (e.g. VoiceOver/NVDA landmark rotor) will see two entries both labeled "navigation, Follow DARLNG" with no way to tell them apart before entering each.
**Fix:** Differentiate the labels, e.g. `aria-label="Follow DARLNG (header)"` / `aria-label="Follow DARLNG (footer)"`, or `"Follow DARLNG — top"` / `"Follow DARLNG — footer"`.

### IN-03: `role="img"` combined with `aria-hidden="true"` is contradictory

**File:** `website/src/components/BrandIcon.astro:13`
**Issue:** The SVG carries both `role="img"` (which asserts an accessible image needing a name) and `aria-hidden="true"` (which removes it from the accessibility tree entirely). Since the parent `<a aria-label="...">` already supplies the accessible name in both call sites, `role="img"` here is inert and misleading to a future reader who might assume it needs an accessible name of its own.
**Fix:** Drop the now-redundant role: `<svg viewBox="0 0 24 24" fill="currentColor" class={className} aria-hidden="true">`.

### IN-04: Footer copyright year is a hardcoded literal

**File:** `website/src/components/Footer.astro:39`
**Issue:** `© 2026 DARLNG. All rights reserved.` is a fixed string. The UI-SPEC explicitly locks this exact copy for this phase, so this is not a defect against the current contract, but as static-site literal text it will read as stale in future years unless someone remembers to hand-edit it on every rebuild.
**Fix:** Not required to change now given the locked copy contract; if a future phase revisits footer copy, consider `© {new Date().getFullYear()} DARLNG. All rights reserved.` (build-time year).

### IN-05: No favicon configured

**File:** `website/src/layouts/Layout.astro:19-28`
**Issue:** There is no `<link rel="icon">` in `<head>` and no `public/` directory with a favicon asset, so every page load triggers a browser request for `/favicon.ico` that 404s. Likely deferred to a later phase, but flagging since `<head>` is fully in this phase's scope.
**Fix:** Add a favicon asset under `public/` and a `<link rel="icon" href="/favicon.ico" sizes="any">` (or SVG favicon) in `Layout.astro`'s `<head>`.

---

_Reviewed: 2026-08-06T23:44:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
