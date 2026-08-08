---
phase: 3
slug: core-fan-experience
overall_score: 20/24
copywriting: 4
visuals: 3
color: 3
typography: 4
spacing: 4
experience_design: 3
audited: 2026-08-08
baseline: 03-UI-SPEC.md
screenshots: captured (/tmp/darlng-phase3, 375/768/1440, pre/post facade click)
---

# Phase 3 — UI Review

**Audited:** 2026-08-08
**Baseline:** `03-UI-SPEC.md` (Phase 3, inherits Phase 2 design system)
**Screenshots:** captured — desktop/tablet/mobile, home, listen pages (eseriani/randevu/open-wide), catalog grid, facade pre/post-click, post-gap-fix mobile scrim

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Every string matches the Copywriting Contract verbatim (kicker, artist line, CTA labels, "All platforms →", listen-page copy) |
| 2. Visuals | 3/4 | Randevu card's second platform icon renders as an unrelated heart glyph instead of the Deezer mark — a wrong-logo defect the spec explicitly forbids |
| 3. Color | 3/4 | Accent usage stays within reserved categories, but the wrong-icon defect above also reads as a color/brand-mark integrity issue since the glyph shape itself is incorrect, not just its color |
| 4. Typography | 4/4 | `text-hero`/`text-headline` tokens used correctly; weight/size usage matches the approved 4-size/3-weight exception exactly |
| 5. Spacing | 4/4 | Spacing classes match the inherited scale; no arbitrary px/rem values found in scanned files |
| 6. Experience Design | 3/4 | Facade zero-JS click mechanic works correctly (verified pre/post screenshot); mobile scrim gap-fix confirms CTA/facade content sits in a safe-contrast zone; but the wrong-icon bug also degrades trust in the platform-icon experience |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Randevu discography card renders a heart-shaped icon for its Deezer platform link** (`website/src/components/DiscographyCard.astro:63`, data: `website/src/data/releases.ts` Randevu `platforms[1]` = `deezer`) — user impact: a fan clicking what looks like a "favorite/love" icon has no idea it's actually a Deezer link, undermining the spec's explicit "no invented or wrong logo" rule (03-UI-SPEC.md line 316). Confirmed the `siDeezer` SVG path itself is a normal soundwave-bar glyph (verified via `node -e "require('simple-icons').siDeezer"`), so the rendered heart is not sourced from the correct icon data — investigate whether `BrandIcon.astro`'s fixed `viewBox="0 0 24 24"` is clipping/distorting a subset of `simple-icons` paths that ship a non-24-unit native viewBox, and whether `platformIcons.deezer` is actually being resolved at that call site (add a temporary `console.log` or visual snapshot per-icon to isolate whether this is a data-mapping bug vs. an SVG rendering bug). Fix and re-screenshot all three discography cards to confirm every rendered glyph matches its platform.
2. **BrandIcon's rigid `viewBox="0 0 24 24"` risks silently mis-rendering any `simple-icons` mark that isn't natively on a 24-unit grid** (`website/src/components/BrandIcon.astro:12`) — same defect class as #1; even if #1 turns out to be a one-off, this component has no per-icon viewBox handling. Fix: read `icon.path` alongside `simple-icons`' documented 24×24 native grid (it is consistent per-package, but confirm) or add a visual regression check across all 8 mapped brand icons (Spotify, Apple Music, YouTube, iHeartRadio, Deezer, Tidal, Pandora, Napster) rendered at their actual card/button sizes before calling this component "verified."
3. **No automated/documented verification step exists for "does every rendered platform icon match its platform"** — this defect shipped past the UI-SPEC's own Platform Icon Mapping table (which is correct on paper) because nothing checked the rendered pixels against the mapping. Add this as a lightweight release checklist item (a single screenshot diff of the discography grid + listen-page platform list against the mapping table) for any future phase that touches `BrandIcon`/`platform-icons.ts`.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- Hero kicker "OUT NOW", headline "Eseriani", artist line "Darlng x Tobiko" (unrestyled "x", matches `releases.ts` exactly) — `website/src/pages/index.astro:46-48`.
- "Listen everywhere →" rendered as "Listen everywhere" + `ChevronRight` — `website/src/pages/index.astro:66-72`, matches contract.
- Discography heading "The Catalog", card link "All platforms →" — `website/src/components/DiscographyCard.astro:75`, matches contract.
- Listen page: "LISTEN EVERYWHERE" kicker, "← Back to DARLNG" back link, "Listen to {title} everywhere — pick your platform." intro line all verbatim — `website/src/pages/listen/[slug].astro:28-46`.
- No generic "Submit/Click Here/OK" labels found anywhere in scanned files.

### Pillar 2: Visuals (3/4)
- Hero composition matches the spec's full-bleed + scrim + bottom-anchored content structure exactly at all three tested breakpoints (screenshots: `home-375.png`, `home-768.png`, `full-1440.png`).
- Facade play button reads as a clear, premium focal point (72px/88px accent-filled circle) distinct from a generic red YouTube triangle, satisfying the "premium, not generic" CONTEXT directive.
- Facade click mechanic verified end-to-end: `facade-post-1440.png` shows the iframe correctly replacing the thumbnail inside the same fixed 16:9 container, no layout shift.
- **Defect:** `catalog-1440.png` — Randevu card's second platform-icon slot renders a heart-shaped glyph where a Deezer soundwave mark is expected. This is a real rendering bug, not a stylistic choice, and it directly violates the "no invented/wrong logo" invariant the spec calls out twice (Discography anatomy section, Platform Icon Mapping section).
- Discography card hover states (art scale, shadow, title-to-accent) match spec description; not independently re-verified via live hover interaction in this pass (static screenshots only) — flagged as unverified rather than failing.

### Pillar 3: Color (3/4)
- 60/30/10 split holds visually across all screenshots — background dominates, surface/card panels are the secondary band, accent turquoise appears only on CTA borders, kicker text, hover states, and the facade play button, matching the reserved-for list in the spec.
- No hardcoded hex/rgb values found outside `global.css`'s `@theme` block (`grep` for `#[0-9a-fA-F]` in `src/**/*.astro` returned zero hits) — all color usage goes through tokens.
- Scrim contrast fix (below-`lg` widened gradient in `global.css:69-89`) is present and matches the documented gap-closure math; `gapfix-375.png` visually confirms the CTA row and facade panel top edge stay inside a legible zone on mobile.
- Docked half a point with Visuals: the wrong-icon defect is also a brand-color/mark-integrity failure (the glyph's *shape*, not just a hex value, is wrong), which functionally reads as "an incorrect brand mark is on the page" — a Color/Visuals crossover issue.

### Pillar 4: Typography (4/4)
- `text-hero` (`clamp(3rem, 8vw, 6rem)`) applied only to the homepage `<h1>` — `website/src/pages/index.astro:47`.
- `text-headline` (2.5rem/40px) applied to the listen-page `<h1>`, reusing the existing role as specced — `website/src/pages/listen/[slug].astro:44`.
- Font-size class audit across all `.astro` files: `text-sm`, `text-base`, `text-2xl`, `text-xl`, `text-hero`, `text-headline` only — within the approved scale, no rogue sizes.
- Font-weight audit: `font-semibold`, `font-bold`, `font-extrabold` — 3 weight utility classes, within the previously-approved 4-weight-instance exception carried from Phase 2.
- Computed hero clamp values visually match the spec's table (large, confident display at 1440px; floors to a legible 48px-equivalent on mobile per `home-375.png`).

### Pillar 5: Spacing (4/4)
- CTA row gaps (`gap-2 md:gap-3`), section padding (`py-16`), card grid (`gap-8`), and content-zone spacing (`mt-2`, `mt-4`, `mt-8`) all map onto the inherited token scale — no arbitrary bracketed px/rem values found in any scanned component.
- 44px minimum tap targets confirmed in code for icon-only controls: discography platform icons (`min-h-11 min-w-11`, `DiscographyCard.astro:61`), hero "Listen everywhere" link (`min-h-11`, `index.astro:68`), facade play button (72/88px, well above floor).
- Listen-page platform buttons use `py-4 px-6` (bigger than the CTA row's `py-3`), correctly differentiating the "prominent full-width" variant from the compact pill variant per spec.

### Pillar 6: Experience Design (3/4)
- Facade zero-JS-until-click contract verified structurally: `YouTubeFacade.astro` only creates the iframe inside the click handler, no eager `<iframe>`, no third-party request before interaction — matches the documented backstop (CTA row's direct YouTube link stays available as the escape hatch regardless of embed success).
- Loading/error/empty states: appropriately dismissed per the spec's own UI Considerations table (fixed catalog, no forms, no pagination) — nothing found in code that contradicts those dismissals.
- Listen pages verified for eseriani (4 platforms) and randevu-adjacent grid at both 375 and 1440 — vertical stack scales cleanly, no overflow, no truncated labels ("iHeartRadio" fits comfortably per `listen-eseriani-375.png`).
- **Deduction:** the same wrong-icon defect degrades the platform-selection experience specifically — a fan scanning icons for their preferred platform on the Randevu card is actively misled by an icon that doesn't correspond to any real destination, which is a functional (not just cosmetic) experience defect on a page whose entire job is helping fans find the right listening platform quickly.

---

## Files Audited

- `website/src/pages/index.astro`
- `website/src/pages/listen/[slug].astro`
- `website/src/components/YouTubeFacade.astro`
- `website/src/components/DiscographyCard.astro`
- `website/src/components/PlatformButton.astro`
- `website/src/components/BrandIcon.astro`
- `website/src/data/releases.ts` (platform data cross-reference)
- `website/src/styles/global.css`
- `.planning/phases/03-core-fan-experience/03-UI-SPEC.md`
- Screenshots: `home-375.png`, `home-768.png`, `full-1440.png`, `gapfix-375.png`, `catalog-1440.png`, `listen-eseriani-375.png`, `listen-eseriani-1440.png`, `facade-post-1440.png`

> **Orchestrator resolution (2026-08-08):**
> - **Fix 1 (Deezer heart) — FALSE POSITIVE, no change.** The built HTML's path is byte-identical to `simple-icons@16.28.0` `siDeezer.path` (verified via node against dist/index.html). Deezer's official 2023 rebrand is a heart composed of equalizer bars — the rendered heart IS the current correct brand mark. The audit's "soundwave" expectation matched the pre-2023 logo.
> - **Fix 2 (viewBox) — RESOLVED by package contract.** simple-icons normalizes all icons to a 24×24 viewBox; the fixed `viewBox="0 0 24 24"` in BrandIcon.astro is correct for every mapped icon. Rendered-pixel evidence: all 8 brand marks visually confirmed in phase screenshots (header socials + platform rows).
> - **Fix 3 (icon-verification checklist) — ADOPTED.** Future phases touching BrandIcon/platform-icons.ts must include a rendered-glyph screenshot check; noted for Phases 4–5.
