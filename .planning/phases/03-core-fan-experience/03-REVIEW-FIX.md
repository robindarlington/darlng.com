---
phase: 03-core-fan-experience
fixed_at: 2026-08-08T14:05:20Z
review_path: .planning/phases/03-core-fan-experience/03-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 3: Code Review Fix Report

**Fixed at:** 2026-08-08T14:05:20Z
**Source review:** .planning/phases/03-core-fan-experience/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (5 warnings, 3 info)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### WR-01: Facade script selects the first `.facade-container` in the document, not its own instance

**Files modified:** `website/src/components/YouTubeFacade.astro`
**Commit:** `51a1f84`
**Applied fix:** Replaced `document.querySelector('.facade-container')` with `document.currentScript?.closest('.facade-container') ?? document.currentScript?.previousElementSibling`, scoping the DOM query to the script's own emitted instance (the `<script>` tag is a sibling of `.facade-container`, not a descendant, so `previousElementSibling` is the correct fallback — matches the actual markup structure, not just the review's suggested snippet).

### WR-02: No focus management after the facade swaps DOM on click

**Files modified:** `website/src/components/YouTubeFacade.astro`
**Commit:** `c7bd93c`
**Applied fix:** Added `iframe.tabIndex = -1;` before insertion and `iframe.focus();` immediately after `container?.replaceChildren(iframe)`, so keyboard/screen-reader focus lands on the injected iframe instead of silently reverting to `<body>`.

### WR-03: Listen-page `<nav>` `aria-label` drifts from the UI-SPEC's locked copy

**Files modified:** `website/src/pages/listen/[slug].astro`
**Commit:** `d2290c0`
**Applied fix:** Changed `aria-label={\`Where to listen to ${release.title}\`}` to `aria-label={\`Listen to ${release.title} on these platforms\`}`, matching `03-UI-SPEC.md`'s locked copy verbatim.

### WR-04: Hero CTA links rely on an unguarded non-null assertion instead of a build-time invariant check

**Files modified:** `website/src/pages/index.astro`
**Commit:** `949fb49`
**Applied fix:** Replaced the `.find(...)!` non-null assertion with an explicit `if (!link) throw new Error(...)` guard per platform, following the same descriptive build-time-error pattern already established by `latestRelease` in `releases.ts`.

### WR-05: `/listen/[slug].astro` has no `Props` type — `Astro.props` is implicitly `any`

**Files modified:** `website/src/pages/listen/[slug].astro`
**Commit:** `a2a8d55`
**Applied fix:** Imported `Release` from `../../data/releases` and added `interface Props { release: Release; }` above `const { release } = Astro.props;`, matching the pattern used by every other component this phase. Verified `astro check` now type-checks `release` correctly (0 errors).

### IN-01: Inconsistent indentation within `YouTubeFacade.astro`

**Files modified:** `website/src/components/YouTubeFacade.astro`
**Commit:** `9f4d63e`
**Applied fix:** Re-indented the `interface Props { ... }` block (lines 5-9) from 2-space to tabs, matching the rest of the file and every other reviewed `.astro` file.

### IN-02: Listen-page `<h1>` uses a raw magic value instead of a shared token

**Files modified:** `website/src/styles/global.css`, `website/src/pages/listen/[slug].astro`
**Commit:** `45a925c`
**Applied fix:** No existing 40px token/utility was found anywhere in the codebase (verified by grepping `global.css` and all `.astro` files — only the raw `text-[40px]` literal existed, duplicated once more in `404.astro` which is out of this finding's scope and was left untouched). Added `--text-headline: 2.5rem;` to the `@theme` block in `global.css` (Tailwind 4 font-size token convention, same as `--text-hero`), and changed the listen-page `<h1>` from `text-[40px]` to `text-headline`. Verified the compiled build output contains `.text-headline{font-size:var(--text-headline)}` resolving to 40px.

### IN-03: Redundant dictionary lookup in `DiscographyCard.astro`

**Files modified:** `website/src/components/DiscographyCard.astro`
**Commit:** `545d5f7`
**Applied fix:** Hoisted `const icon = platformIcons[link.platform];` once per iteration (inside the `.map()` callback body) instead of looking up `platformIcons[link.platform]` twice (once in the ternary condition, once with a redundant `!` assertion in the truthy branch), matching the pattern already used in `PlatformButton.astro`.

## Skipped Issues

None — all findings were fixed.

## Verification

Ran from the isolated worktree (`/tmp/sv-03-reviewfix-VCvgUr`, on temp branch `gsd-reviewfix/03-42447`, `node_modules` symlinked read-only from the main checkout at `/Users/rob/Desktop/projects/Hetzner/darlng.com/website/node_modules` — no writes to the shared directory):

- `npm run build` — succeeded, 6 pages built, 0 errors.
- `npm run check` (`astro check` + `check-contrast.mjs`) — 0 errors, 0 warnings, 1 pre-existing hint (unrelated `is:inline` script hint, present before any fix). All 9 contrast pairs still PASS.
- Browser sanity check at 375×812 (agent-browser, against `npm run preview` on the fixed tree): clicked the facade play button (`aria-label="Play DARLNG x Tobiko — Eseriani (Official Video)"` — confirms WR-03-adjacent copy elsewhere is intact); confirmed the thumbnail/button was replaced by `<iframe src="https://www.youtube-nocookie.com/embed/qltP16ukVr4?autoplay=1">`, and `document.activeElement` was the injected iframe (`tabIndex: -1`) — confirms WR-01 (correct instance scoped) and WR-02 (focus moved) both work together end-to-end.

These build/check/browser results are reproducible only from the worktree/temp-branch state at the time of this run; after cleanup the same commits live on `master` in the main checkout and the gates can be re-run there directly.

---

_Fixed: 2026-08-08T14:05:20Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
