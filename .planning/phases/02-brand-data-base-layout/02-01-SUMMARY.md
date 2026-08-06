---
phase: 02-brand-data-base-layout
plan: 01
subsystem: ui
tags: [astro, tailwind4, fontsource, sharp, typed-data, wcag]

requires:
  - phase: 01-infrastructure-deploy
    provides: Astro 5 + Tailwind 4 project scaffold in website/, pinned tailwindcss/@tailwindcss/vite@4.1.16 + overrides.vite, Coolify/nginx deploy pipeline
provides:
  - "@theme dark/moody design token system (bg/surface/text/accent/error, radii) in global.css"
  - "Self-hosted Unbounded + Manrope variable fonts, manually preloaded (no experimental Fonts API)"
  - "Typed src/data/releases.ts contract (Platform, PlatformLink, YouTubeEmbed, Release, SocialLink, SocialPlatform) with Eseriani release + 5 socials"
  - "Layout.astro / Header.astro / Footer.astro base composition"
  - "Skeleton index.astro proving the Sharp cover-art pipeline + token specimen"
  - "Zero-dependency scripts/check-contrast.mjs WCAG AA gate wired into npm run check"
affects: [03-hero-discography-listen, 04-newsletter, 05-seo-polish]

actuals:
  tokens: 2820
  tasks: 3
  commits: 2

tech-stack:
  added: ["@fontsource-variable/unbounded@^5.3.0", "@fontsource-variable/manrope@^5.3.0", "@lucide/astro@^1.29.0", "simple-icons@^16.28.0"]
  patterns:
    - "Tailwind 4 CSS-first @theme block — no tailwind.config.js"
    - "Manual Fontsource CSS import + Vite ?url woff2 preload (avoids experimental.fonts on pinned astro@5.18.2)"
    - "Plain .ts data file importing cover art via top-level ES import resolving to ImageMetadata"
    - "Zero-dependency Node contrast script with a CSS token-presence guard tying the gate to the live stylesheet"

key-files:
  created:
    - website/src/assets/releases/eseriani.jpg
    - website/src/data/releases.ts
    - website/src/layouts/Layout.astro
    - website/src/components/Header.astro
    - website/src/components/Footer.astro
    - website/scripts/check-contrast.mjs
  modified:
    - website/src/styles/global.css
    - website/src/pages/index.astro
    - website/package.json
    - website/package-lock.json

key-decisions:
  - "Extracted SocialLink's inline platform union into a named `SocialPlatform` type alias so the interface declaration line no longer collides with the `platform: '...'` grep pattern used to count data entries (9 platform/social records) — same closed-union semantics, no behavior change."
  - "Added a subtle border/white-10 ring to the color-swatch demo blocks (not specified in the plan) so the bg-token swatch is visible against the near-identical page background — a minor legibility fix, not a design deviation."

patterns-established:
  - "Design-token specimen swatches on the skeleton page render every @theme color as a visual proof, not just a build-time assertion"

requirements-completed: [BRAND-01, BRAND-02, BRAND-03, BRAND-04]

coverage:
  - id: D1
    description: "Dark/moody @theme token system (near-black bg/surface, warm off-white text, single #2DD9C5 jewel accent) renders in a real browser with self-hosted Unbounded/Manrope fonts confirmed loaded via document.fonts.check"
    requirement: "BRAND-01"
    verification:
      - kind: automated_ui
        ref: "agent-browser eval at 375x812 and 1440x900 on http://localhost:4321/ — document.fonts.check('800 40px \"Unbounded Variable\"') === true, document.fonts.check('400 16px \"Manrope Variable\"') === true, body bg rgb(10,9,8), body color rgb(245,241,234), accent swatch rgb(45,217,197)"
        status: pass
    human_judgment: true
    rationale: "BRAND-01's 'reads as original and distinct from robindarlington.com' half has no mechanical predicate in this repo (per the plan's flagged_planner_assumptions) — the token/font mechanics are proven above, but visual originality is a human call on the captured screenshots."
  - id: D2
    description: "check:contrast gate verifies all 9 UI-SPEC colour pairs at >=4.5:1 and fails when a token hex is missing from global.css or the pair table is short"
    requirement: "BRAND-02"
    verification:
      - kind: unit
        ref: "node scripts/check-contrast.mjs — 9/9 PASS lines"
        status: pass
      - kind: integration
        ref: "fail-first proof: mutate #2DD9C5 to an unknown hex in global.css, re-run check:contrast (Guard A fires, exit 1), restore original, re-run (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Single-column mobile layout with no horizontal overflow at 375px and a centred 1280px container at 1440px"
    requirement: "BRAND-03"
    verification:
      - kind: automated_ui
        ref: "agent-browser eval — 375px: scrollWidth 375 == clientWidth 375, cover rect.bottom(455) <= specimen h1 rect.top(551); 1440px: main width 1280, centeredDelta 0, scrollWidth 1440 == clientWidth 1440"
        status: pass
    human_judgment: false
  - id: D4
    description: "Base Layout/Header/Footer composition with self-hosted font preloads and src/data/releases.ts typed catalog (Release/SocialLink contract, cover typed ImageMetadata) ready for later phases"
    requirement: "BRAND-04"
    verification:
      - kind: unit
        ref: "cd website && npm run check (astro check) — 0 errors, 0 warnings; grep assertions on releases.ts exported symbols"
        status: pass
      - kind: integration
        ref: "cd website && npm run build — dist/_astro/ contains avif+webp Sharp output, dist/index.html contains 2 preload link tags and no googleapis reference"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-08-06
status: complete
---

# Phase 2 Plan 1: Brand, Data & Base Layout — Tracer Summary

**Dark/moody Tailwind 4 `@theme` token system with self-hosted Unbounded/Manrope variable fonts, a typed `releases.ts` catalog contract, base Layout/Header/Footer composition, and a zero-dependency WCAG AA contrast gate — all proven end-to-end in a real browser at 375px and 1440px against the Sharp-processed Eseriani cover.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-08-06T21:29:16Z
- **Tasks:** 3 (1 tracer, 2 expansion)
- **Files modified:** 10

## Accomplishments
- End-to-end vertical slice: npm packages → `@theme` design tokens → self-hosted fonts → typed `releases.ts` → Sharp image pipeline → `Layout`/`Header`/`Footer` → rendered skeleton page, all in one tracer commit
- WCAG AA contrast gate (`check:contrast`) implementing the W3C relative-luminance formula over all 9 UI-SPEC colour pairs, with two extra guards (token-presence, non-vacuous table) beyond the researched baseline, wired into `npm run check`
- Real-browser verification at 375×812 and 1440×900 via `agent-browser`: both font families confirmed loaded (not system fallback), exact token colours confirmed via computed styles, no horizontal overflow at either viewport, single-column stacking at 375px, centred 1280px container at 1440px

## Task Commits

1. **Task 1: Tracer — branded shell + Eseriani cover through Sharp** - `84f0545` (feat)
2. **Task 2: Expansion — WCAG AA contrast gate** - `668891d` (feat)
3. **Task 3: Expansion — browser-verify at 375px/1440px** - verification-only, no new commit (all assertions passed against Task 1/2 output; nothing required fixing)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `website/src/assets/releases/eseriani.jpg` - Eseriani cover art (1254×1254), copied from the artist's Desktop source
- `website/src/styles/global.css` - `@theme` token block (bg/surface/text/text-muted/accent/error, font-display/font-body, radius-card/radius-pill), Fontsource imports, body/selection/focus-visible base rules
- `website/src/data/releases.ts` - `Platform`, `PlatformLink`, `YouTubeEmbed`, `Release`, `SocialLink`, `SocialPlatform` types; `releases` (Eseriani) and `socials` (5 profiles) exports, all data transcribed verbatim from CONTENT.md
- `website/src/layouts/Layout.astro` - shared head with two manual woff2 preloads, Header/slot/Footer composition
- `website/src/components/Header.astro` - sticky surface band with the DARLNG wordmark link
- `website/src/components/Footer.astro` - surface band, 3-column grid contract (wordmark+genre / empty social slot / copyright)
- `website/src/pages/index.astro` - skeleton page: Sharp `<Picture>` cover as focal point, headline/subheading/body copy, 5-token colour swatch specimen
- `website/scripts/check-contrast.mjs` - zero-dependency contrast script with Guard A (token presence) and Guard B (non-vacuous 9-pair table)
- `website/package.json` / `website/package-lock.json` - 4 new dependencies, `check:contrast` script, `check` extended to run the gate; `build` untouched

## Decisions Made
- Extracted `SocialLink`'s inline platform union into a `SocialPlatform` type alias (see Deviations) — same semantics, satisfies the plan's exact-count acceptance criterion.
- Added a `border border-white/10` ring to the colour-swatch demo blocks so the `bg`-token swatch (near-identical to the page background) is visibly distinct — a minor legibility addition beyond the plan's literal wording.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `platform: '` grep count returned 10 instead of the required 9**
- **Found during:** Task 1 verification
- **Issue:** The plan's proposed `SocialLink` shape inlines `platform: 'spotify' | 'instagram' | ...` directly in the interface declaration, which itself matches the acceptance criterion's `grep -c "platform: '"` pattern — pushing the count to 10 (4 Eseriani platform links + 5 socials + 1 interface line) against the required 9.
- **Fix:** Extracted the union into `export type SocialPlatform = 'spotify' | 'instagram' | 'facebook' | 'youtube' | 'tiktok';` and typed `SocialLink.platform: SocialPlatform`. Identical closed-union type-safety, zero behavior change.
- **Files modified:** `website/src/data/releases.ts`
- **Verification:** `grep -c "platform: '" website/src/data/releases.ts` now outputs `9`
- **Committed in:** `84f0545` (Task 1 commit)

### Noted, not auto-fixed (verify-command methodology, not implementation defects)

- **`grep -c 'rel="preload"' dist/index.html` returns `1`, not the acceptance criterion's `2`.** Astro's default `compressHTML` collapses the `<head>` onto a single physical line in the production build, so both `<link rel="preload" …>` tags land on the same line — `grep -c` counts matching *lines*, not occurrences. Manually confirmed via `grep -o 'rel="preload"' dist/index.html | wc -l` → `2`, and both tags carry the required `as="font"` and `crossorigin` attributes. This is a test-methodology artifact of `grep -c` vs. line-collapsed minified HTML, not a missing preload. Recurs identically in Task 3's verify command for the same reason.
- **`grep -cE "^import .* from '(?!node:)" website/scripts/check-contrast.mjs`** uses a PCRE negative-lookahead that BSD `grep -E` (macOS default) does not support and errors on. Manually confirmed all three imports in the script (`node:fs`, `node:url`, `node:path`) are builtins — no non-builtin import exists, no new dependency was added to `package.json` for the script.

---

**Total deviations:** 1 auto-fixed (1 blocking), 2 noted verify-methodology caveats with no implementation impact.
**Impact on plan:** The auto-fix is a zero-behavior-change type refactor required only to satisfy an exact-count grep assertion. Both noted caveats are shell/tooling quirks in the verify commands themselves (BSD grep vs GNU grep semantics, and minified single-line HTML vs `grep -c`'s line-counting) — the underlying requirements (2 preload links with correct attributes; zero non-builtin imports) are independently confirmed true by equivalent commands.

## Issues Encountered
- Pre-existing `npm audit` findings (4 vulnerabilities, 2 high) trace to the project's deliberately pinned `astro@^5.18.2` (Phase 1 decision, documented in CLAUDE.md/STACK.md for sibling-site parity) and its transitive `sharp`/`esbuild` versions — not introduced by this plan's package installs. Auto-fixing would require `npm audit fix --force`, which upgrades `astro` to `7.2.0`, a breaking architectural change explicitly out of scope (CLAUDE.md's Version Alignment Flag). Left as-is; flagged for a future deliberate-upgrade phase, not this one.

## Next Phase Readiness
- Every Phase 3/4/5 page can now import `../styles/global.css` tokens, wrap in `Layout`, and consume `releases`/`socials` from `src/data/releases.ts` without re-deciding architecture.
- `website/src/components/BrandIcon.astro` and the remaining 3 releases (`randevu`, `brave`, `open-wide`) plus the social-follow icon rows are explicitly scoped to plan 02-02, not this plan.
- No blockers for 02-02.

---
*Phase: 02-brand-data-base-layout*
*Completed: 2026-08-06*
