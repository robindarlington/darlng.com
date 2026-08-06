---
phase: 2
slug: brand-data-base-layout
audited: 2026-08-07
baseline: 02-UI-SPEC.md
screenshots: captured (375px, 768px, 1440px, pre-existing at /tmp/darlng-phase2/)
overall_score: 22/24
pillars:
  copywriting: 3
  visuals: 4
  color: 4
  typography: 3
  spacing: 4
  experience_design: 4
---

# Phase 2 — UI Review

**Audited:** 2026-08-07
**Baseline:** `.planning/phases/02-brand-data-base-layout/02-UI-SPEC.md` (approved contract)
**Screenshots:** Captured at 375px / 768px / 1440px (`/tmp/darlng-phase2/02-02-*.png`)

Note per audit scope: `index.astro` is an intentional Phase-2 token/data skeleton — the sparse desktop composition (large empty right column at 1440px) is not scored as a defect. Findings below flag things Phase 3's hero build should account for. The 4-weight/2-per-family typography split and the 44px tap-target spacing exception are pre-approved contract exceptions and are not scored as violations.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Footer copyright uses a dynamic `{copyrightYear}` instead of the spec's locked literal string "© 2026 DARLNG. All rights reserved." |
| 2. Visuals | 4/4 | Cover art is the correct, unambiguous focal point at all three tested widths; icon-only controls all carry `aria-label` |
| 3. Color | 4/4 | Accent (`--color-accent`) used only on hover/focus/CTA states across 5 call sites — no default-state accent fills, no hardcoded hex in components |
| 4. Typography | 3/4 | Header/footer wordmark renders at real Tailwind `text-lg` (18px) while the spec's own Typography table declares "text-lg" = 24px — spec's internal size mapping is inconsistent and the wordmark ends up smaller than the contract's stated intent |
| 5. Spacing | 4/4 | Gaps, paddings, and the 44px tap-target exception all match the declared scale exactly; no arbitrary spacing values found |
| 6. Experience Design | 4/4 | Skip link, sticky header, full focus-visible/hover/active state coverage, build-time invariant guard for `latestRelease`, no scope-inappropriate missing states |

**Overall: 22/24**

---

## Top 3 Priority Fixes

1. **Wordmark renders at 18px, not the 24px the spec's Typography table declares for `text-lg`** — `website/src/components/Header.astro:11`, `website/src/components/Footer.astro:14` — user impact: the brand wordmark reads visually lighter/smaller than the design contract's stated hierarchy intended (real Tailwind `text-lg` = 1.125rem/18px, not the 24px the spec table lists). Fix: either change the class to `text-2xl` (matches the 24px the spec table declares and matches how `index.astro`'s subheading correctly used `text-2xl` for the same 24px role), or correct the UI-SPEC.md typography table to state the actual Tailwind size being used, so a future contributor doesn't "fix" it back to a mismatch.

2. **Footer copyright is dynamic (`{copyrightYear}`) but the spec locks an exact literal string** — `website/src/components/Footer.astro:6,32` vs `02-UI-SPEC.md` line 217/262 ("© 2026 DARLNG. All rights reserved." — exact copy, no variables noted). User impact: none today (2026 happens to be current), but the string will silently drift from the locked contract every January without a spec update authorizing dynamic behavior. Fix: either update UI-SPEC.md's Copywriting Contract to explicitly note the copyright year is intentionally dynamic (defensible, common pattern), or hardcode the literal string per the current contract — pick one and make the spec and code agree.

3. **Declared Manrope 600 (SemiBold) weight is never actually used anywhere in Phase 2's shipped code** — grep across `src/**/*.astro` finds only `font-bold` (700) and `font-extrabold` (800), both Unbounded; no `font-semibold` appears. User impact: none yet (nav/labels currently rely on size/color only), but it means the "4 weight instances, 2 per family" contract is unverified in practice — only 3 of the 4 declared weights are proven to work end-to-end. Flag for Phase 3/4: the first component that needs Manrope 600 (e.g. a nav link, button label) is untested territory; confirm `font-semibold` actually resolves to the variable font's 600 axis before relying on it.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- Genre line matches the locked string exactly: "Afro / RnB / Pop" (`Footer.astro:15`, sentence case as specified).
- Social `aria-label`s match the spec's exact pattern: `Follow DARLNG on ${social.label}` (`Header.astro:22`, `Footer.astro:24`).
- 404 copy is on-voice and non-generic: "That page does not exist. The music does." / "Back to the music" (`404.astro:8,14`) — no "Page Not Found" boilerplate, no "Click Here."
- **Deviation:** `Footer.astro:6` computes `copyrightYear = new Date().getFullYear()` and interpolates it at line 32, rather than using the spec's exact locked literal "© 2026 DARLNG. All rights reserved." This is a reasonable engineering choice but is an undocumented departure from a contract section that explicitly calls the string "locked, exact."
- No generic `Submit`/`Cancel`/`OK` labels found in scope (`grep` across all `.astro` files in `src/`) — correct, since this phase has no form controls.

### Pillar 2: Visuals (4/4)
- Confirmed via screenshot at 375/768/1440: the Eseriani cover art is unambiguously the first thing the eye lands on — large, high-contrast against near-black, positioned above the type-scale/color-swatch demo content exactly as the spec's "Skeleton page focal point" section prescribes.
- All 10 icon links (5 header + 5 footer) carry `aria-label` — no icon-only control lacks an accessible name.
- Visual hierarchy is established through size/weight contrast: 40px ExtraBold headline → 24px Bold subheading → 16px Regular body → 14px muted meta line — a clean 4-step scale.
- 1440px composition leaves a large empty right column — expected/documented as Phase 3's responsibility (hero art/CTA will fill it); not scored as a defect per audit scope, but flagged here as a direct handoff note for the Phase 3 UI-SPEC to address so the empty column doesn't ship as-is.

### Pillar 3: Color (4/4)
- Accent (`text-accent`/`border-accent`/`bg-accent`) usage across the codebase: exactly 5 call sites — wordmark hover (`Header.astro:11`), header icon hover/focus (`Header.astro:23`), footer icon hover/focus (`Footer.astro:25`), 404 CTA border/text/hover-fill (`404.astro:11`), and the token-demo swatch itself (`index.astro:13`). Every one of these is either a hover/focus state or an explicit "here is the accent token" demo — none is a default-state background fill, exactly matching the spec's 60/30/10 contract (accent reserved for interaction/decoration, never dominant surface).
- No hardcoded hex/rgb values found in any `.astro` or `.ts` component file (`grep -rn "#[0-9a-fA-F]{3,8}"` across `src/` returns zero matches inside file contents) — all color is token-driven via `@theme` in `global.css`.
- Default icon color correctly resolves to `text-text-muted`, not `text-text` or `text-accent`, matching the spec's "never used for default icon color" rule.
- `::selection` and `:focus-visible` both correctly wired to `--color-accent` in `global.css:37-45`, matching the spec's explicit "pop" touches.

### Pillar 4: Typography (3/4)
- Distinct font sizes in use: `text-sm` (14px), `text-base` (16px), `text-2xl` (24px), `text-[40px]` (40px) — exactly 4, matching the spec's declared 4-size scope.
- Distinct weights actually exercised: `font-bold` (Unbounded 700), `font-extrabold` (Unbounded 800), and default body 400 (Manrope, unclassed) — 3 of the declared 4 weight instances are proven in shipped code; `font-semibold` (Manrope 600) is declared in the contract but never used this phase (see Top 3 Fix #3).
- **Deviation:** `Header.astro:11` and `Footer.astro:14` use Tailwind's literal `text-lg` utility for the wordmark. Tailwind's actual `text-lg` value is 1.125rem (18px), but the UI-SPEC's own Typography table (line 142) declares "Subheading (`text-lg`)" = 24px. `index.astro`'s subheading (`h2`, line 34) correctly renders at the intended 24px by using `text-2xl` instead — meaning the codebase has two different resolutions of the same spec ambiguity in two different components, and the wordmark's resolution renders smaller than the contract's stated size intent.
- `h2` in `index.astro:34` uses `leading-tight` (Tailwind's actual value: 1.25) where the spec calls for line-height 1.2 on the subheading role — a 0.05 drift, cosmetically negligible but not an exact match.

### Pillar 5: Spacing (4/4)
- Container gutters match exactly: `px-4 md:px-6 xl:px-8` in `Layout.astro:37` and repeated in `Header.astro:8`/`Footer.astro:10`.
- Section/footer padding matches the declared scale: `py-12 md:py-16` (`Footer.astro:9`, `index.astro:21,32`, `404.astro:6`).
- Icon gap spacing matches exactly: `gap-2 md:gap-4` in the header nav (`Header.astro:15`), `gap-4` in the footer nav (`Footer.astro:17`) — matches the spec's "8px mobile / 16px desktop" header rule and "16px" footer rule.
- The 44×44px tap-target exception is correctly implemented via `min-h-11 min-w-11` padding around an 18-20px glyph (`w-5 h-5` = 20px), not by inflating the icon itself — matches the spec's explicit accommodation method.
- No arbitrary spacing values (`[Npx]`/`[Nrem]`) found anywhere in spacing-related classes — the only bracketed arbitrary value in the codebase is `text-[40px]`, which is typography, not spacing, and is explicitly sanctioned by the spec as a forward-looking token placeholder.

### Pillar 6: Experience Design (4/4)
- Skip-to-content link present and correctly hidden/revealed (`Layout.astro:30-35`) with visible focus styling.
- Sticky header with `z-50` (`Header.astro:7`) and full `focus-visible`/`hover`/`active:scale-95` state coverage on every interactive element, matching the spec's system-wide interaction-state contract.
- `latestRelease` in `releases.ts:124-132` throws a descriptive build-time error if the "exactly one `isLatest: true`" invariant is violated, rather than silently defaulting or crashing with an opaque error — stronger than the spec required.
- `<Picture>` includes descriptive `alt` text (`index.astro:27`) satisfying the spec's "empty/error" backstop for the cover-art media element.
- No loading/error/empty states are missing that the spec calls in-scope — the spec explicitly dismisses loading/error/empty for this phase's static-content-only elements, and the implementation correctly does not invent unneeded state-handling scaffolding for them.

---

## Registry Safety

Not applicable — `components.json` does not exist (shadcn is not initialized, per project convention: hand-authored `.astro` components, no component registries in use this phase).

---

## Files Audited

- `website/src/styles/global.css`
- `website/src/layouts/Layout.astro`
- `website/src/components/Header.astro`
- `website/src/components/Footer.astro`
- `website/src/components/BrandIcon.astro`
- `website/src/data/social-icons.ts`
- `website/src/data/releases.ts`
- `website/src/pages/index.astro`
- `website/src/pages/404.astro`
- `.planning/phases/02-brand-data-base-layout/02-UI-SPEC.md`
</content>
