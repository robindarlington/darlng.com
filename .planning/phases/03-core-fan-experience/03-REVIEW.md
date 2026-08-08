---
phase: 03-core-fan-experience
reviewed: 2026-08-08T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - website/src/components/DiscographyCard.astro
  - website/src/components/Header.astro
  - website/src/components/PlatformButton.astro
  - website/src/components/YouTubeFacade.astro
  - website/src/data/platform-icons.ts
  - website/src/pages/index.astro
  - website/src/pages/listen/[slug].astro
  - website/src/styles/global.css
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: fixed
fixed_at: 2026-08-08T14:05:20Z
fix_report: 03-REVIEW-FIX.md
---

# Phase 3: Code Review Report

**Reviewed:** 2026-08-08
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the Phase 3 hero, `YouTubeFacade`, `DiscographyCard`, and `/listen/[slug]` implementation against `03-UI-SPEC.md`. No critical/security-severity issues found: all external links carry `target="_blank" rel="noopener noreferrer"`, `BrandIcon` binds SVG `path` data through an escaped Astro expression attribute (not `set:html`/`innerHTML`), the facade's `videoId`/`titleForA11y` values come from typed static data (not user input), and the scrim gradient stops / `--text-hero` clamp match the UI-SPEC's locked values verbatim (no drift).

Five warnings and three info items were found, mostly around the `YouTubeFacade` inline script's instance-scoping and post-click focus handling, a copy drift from the UI-SPEC's locked `nav` `aria-label` on the listen page, a missing runtime guard on a non-null-asserted data lookup in the hero CTA row, and a missing `Props` type on `/listen/[slug].astro` that silently disables type-checking for `Astro.props` on that page (inconsistent with every other component in this phase, which all declare `interface Props`).

## Warnings

### WR-01: Facade script selects the first `.facade-container` in the document, not its own instance

**File:** `website/src/components/YouTubeFacade.astro:43-44`
**Issue:** The inline script (`define:vars` forces `is:inline`, so this script is *not* deduplicated/bundled — one copy is emitted per component instance) does:
```js
const container = document.querySelector('.facade-container');
const trigger = container?.querySelector('[data-facade-trigger]');
```
`document.querySelector` always returns the *first* matching element in the whole document, regardless of which `YouTubeFacade` instance emitted the script. Today this is safe only because the component is rendered exactly once (homepage hero). The moment a second `YouTubeFacade` is added to the same page (e.g. a future release's listen page, or two hero-style embeds), every instance's script will bind its click listener to the *same* first container: the second facade's play button gets no listener (dead click), and the first container ends up with two `click` listeners attached (one per script), each independently building an `<iframe>` and calling `replaceChildren`.
**Fix:** Scope the query to the script's own instance, e.g. via `document.currentScript`:
```js
const container = document.currentScript.closest('.facade-container')
  ?? document.currentScript.previousElementSibling;
const trigger = container?.querySelector('[data-facade-trigger]');
```
or give each container a unique `id` derived from `videoId` and query by that id.

**Resolved:** commit `51a1f84` — scoped via `document.currentScript?.closest('.facade-container') ?? document.currentScript?.previousElementSibling`. See `03-REVIEW-FIX.md`.

### WR-02: No focus management after the facade swaps DOM on click

**File:** `website/src/components/YouTubeFacade.astro:47-56`
**Issue:** On click, `container?.replaceChildren(iframe)` removes the (possibly currently-focused, if activated via keyboard) `<button data-facade-trigger>` from the DOM and replaces it with an `<iframe>`. When a focused element is removed from the DOM, focus silently reverts to `<body>` — keyboard and screen-reader users lose their place with no indication of what happened or where to tab next.
**Fix:** Give the iframe a `tabindex="-1"` and call `.focus()` on it after insertion so focus lands somewhere sensible and predictable:
```js
iframe.tabIndex = -1;
container?.replaceChildren(iframe);
iframe.focus();
```

**Resolved:** commit `c7bd93c` — `iframe.tabIndex = -1` + `iframe.focus()` after `replaceChildren`. See `03-REVIEW-FIX.md`.

### WR-03: Listen-page `<nav>` `aria-label` drifts from the UI-SPEC's locked copy

**File:** `website/src/pages/listen/[slug].astro:43`
**Issue:** `03-UI-SPEC.md` (Listen-Everywhere Pages page structure, line ~271) locks the label as `aria-label="Listen to {title} on these platforms"`. The implementation instead renders:
```astro
<nav aria-label={`Where to listen to ${release.title}`} class="w-full mt-8">
```
Different wording than the design contract specifies for an accessibility-facing string.
**Fix:** Match the locked copy:
```astro
<nav aria-label={`Listen to ${release.title} on these platforms`} class="w-full mt-8">
```

**Resolved:** commit `d2290c0` — copy now matches the UI-SPEC verbatim. See `03-REVIEW-FIX.md`.

### WR-04: Hero CTA links rely on an unguarded non-null assertion instead of a build-time invariant check

**File:** `website/src/pages/index.astro:15-17`
**Issue:**
```ts
const heroPlatforms: Platform[] = ['spotify', 'appleMusic', 'youtube'];
const ctaLinks = heroPlatforms.map(
	(platform) => latestRelease.platforms.find((link) => link.platform === platform)!
);
```
`.find()` returns `undefined` if the latest release's `platforms[]` ever omits one of `spotify`/`appleMusic`/`youtube` (e.g. a future release edit), and the `!` assertion silences TypeScript but not the runtime — the subsequent `link.url`/`link.platform`/`link.label` access in the CTA row would throw an unhelpful "Cannot read properties of undefined" at build time. `releases.ts` already establishes a project convention for this exact class of problem (`latestRelease`'s `matches.length !== 1` check throws a descriptive error instead of crashing opaquely) — this call site doesn't follow it.
**Fix:** Add the same defensive pattern, e.g.:
```ts
const ctaLinks = heroPlatforms.map((platform) => {
	const link = latestRelease.platforms.find((l) => l.platform === platform);
	if (!link) {
		throw new Error(`releases.ts: latest release "${latestRelease.slug}" is missing a "${platform}" platform link required by the hero CTA row.`);
	}
	return link;
});
```

**Resolved:** commit `949fb49` — descriptive build-time throw added, following the `latestRelease` invariant pattern. See `03-REVIEW-FIX.md`.

### WR-05: `/listen/[slug].astro` has no `Props` type — `Astro.props` (and `release`) is implicitly `any`

**File:** `website/src/pages/listen/[slug].astro:15`
**Issue:** Every other component touched this phase (`DiscographyCard.astro`, `PlatformButton.astro`, `YouTubeFacade.astro`) declares an `interface Props { ... }` so `Astro.props` is type-checked. This page destructures `const { release } = Astro.props;` with no `Props` declaration, so `release` (and every `release.foo` access in the template) is implicitly `any`. `npm run check` (`astro check`) will not catch a typo'd property or a shape mismatch here the way it would in the sibling components.
**Fix:**
```ts
import type { Release } from '../../data/releases';

interface Props {
	release: Release;
}

const { release } = Astro.props;
```

**Resolved:** commit `a2a8d55` — `Props` interface added; `astro check` confirms 0 errors. See `03-REVIEW-FIX.md`.

## Info

### IN-01: Inconsistent indentation within `YouTubeFacade.astro`

**File:** `website/src/components/YouTubeFacade.astro:5-9`
**Issue:** The `interface Props { ... }` block uses 2-space indentation while the rest of the file (and every other reviewed `.astro` file: `DiscographyCard.astro`, `Header.astro`, `PlatformButton.astro`, `index.astro`, `listen/[slug].astro`) uses tabs.
**Fix:** Re-indent lines 5-9 with tabs to match the file's own markup section and the rest of the codebase.

**Resolved:** commit `9f4d63e` — re-indented with tabs. See `03-REVIEW-FIX.md`.

### IN-02: Listen-page `<h1>` uses a raw magic value instead of a shared token

**File:** `website/src/pages/listen/[slug].astro:39`
**Issue:** `class="text-[40px] leading-[1.05] font-display font-extrabold mt-2"` hardcodes `40px` via an arbitrary Tailwind value. The UI-SPEC explicitly frames this as "reuses the existing Headline role, no new size" — if that role has a named utility/token elsewhere in the design system, this call site should reference it rather than restate the literal value, to avoid the two drifting independently if the Headline role is ever retuned.
**Fix:** If a `text-headline` (or equivalent) utility/token exists from Phase 2, use it here instead of `text-[40px]`.

**Resolved:** commit `45a925c` — no such token existed yet; added `--text-headline: 2.5rem` to `global.css`'s `@theme` block and switched the listen-page `<h1>` to `text-headline`. See `03-REVIEW-FIX.md`.

### IN-03: Redundant dictionary lookup in `DiscographyCard.astro`

**File:** `website/src/components/DiscographyCard.astro:61-65`
**Issue:** `platformIcons[link.platform]` is looked up twice — once in the ternary condition, once again inside the truthy branch (`platformIcons[link.platform]!`). `PlatformButton.astro` avoids this by assigning `const icon = platformIcons[platform];` once. Purely a minor duplication/readability nit, not a correctness bug.
**Fix:**
```astro
{
	iconPlatforms.map((link) => {
		const icon = platformIcons[link.platform];
		return (
			<a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${release.title} on ${link.label}`} class="...">
				{icon ? <BrandIcon icon={icon} class="w-5 h-5" /> : <ExternalLink size={20} />}
			</a>
		);
	})
}
```

**Resolved:** commit `545d5f7` — `icon` hoisted once per iteration. See `03-REVIEW-FIX.md`.

---

_Reviewed: 2026-08-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
