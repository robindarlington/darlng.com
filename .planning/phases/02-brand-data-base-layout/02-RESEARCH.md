<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Visual Identity (user-decided)**
- Dark, moody, cinematic base — deep near-black background; must "pop" and read as original, not a template. Visually distinct from robindarlington.com.
- Single jewel accent color implemented as ONE swappable design token (e.g. `--accent` in the Tailwind 4 `@theme` block) so it can be re-tinted to match the latest release later with a one-line change. No second accent.
- Accent choice: Claude picks — user suggested it may later match the latest release (Eseriani cover art is the natural derivation source).
- Genre line: exactly "Afro / RnB / Pop".

**Typography (delegated to Claude)**
- Claude picks fonts from Fontsource: a cinematic/characterful display face for headings + a clean, highly legible body face. Prefer `@fontsource-variable/*` packages where available. Fonts must be self-hosted (no Google Fonts network calls) and preloaded per PERF-01 groundwork.

**Copy Voice (user-directed)**
- Artist positioning for all copy: 100% independent artist; releases music when he feels like it, no schedule; full creative freedom in collaborations and direction. Tone: confident, not corporate.
- Tagline/meta copy drafted by Claude in that voice; user vetoes in review.

**Data Model (locked pre-roadmap + content gathered)**
- `src/data/releases.ts` plain typed TS file (NOT MDX content collections) — single source of truth for hero, discography, and listen pages.
- All four releases with data EXACTLY as recorded in `.planning/CONTENT.md`: Eseriani (2026, Darlng x Tobiko — latest, hero), Randevu (2024, ft. Shubi Di Badman), Brave (2020, ft. Ray Pineapple), Open Wide (2019, ft. Don Classic). Slugs: `eseriani`, `randevu`, `brave`, `open-wide`.
- Cover art copied from the user's Desktop folders (paths in CONTENT.md) into `website/src/assets/releases/`, imported as `ImageMetadata`, processed by Sharp (avif+webp+srcset at build).
- Platform links per release exactly per CONTENT.md (omit platforms a release isn't on; skip the dead Google Play link for Open Wide). Include the Eseriani YouTube embed config (video id `qltP16ukVr4`, youtube-nocookie facade — consumed in Phase 3).
- Social profile URLs per CONTENT.md (Spotify artist, Instagram, Facebook, YouTube, TikTok) — exposed via the data layer for header/footer anchors.

**Layout & Responsiveness**
- Mobile-first: single column on mobile, grid/flex multi-column on desktop (BRAND-03).
- Base `Layout.astro` with shared head (meta groundwork), header + footer containing social follow icon links (lucide or inline SVG for brand icons — note: simple-icons-style brand glyphs may be needed since Lucide lacks TikTok/Spotify brand marks; Claude's discretion on cleanest zero-JS approach).
- A skeleton index page must render the full token system (fonts, colors, spacing) to prove the layout locally.

**Accessibility (requirement-locked)**
- Every color token pair (body text/bg, accent/bg, heading/bg) ≥ 4.5:1 contrast, verified programmatically (contrast-check script or documented measured ratios) — NOT by eye. Accent must be chosen to pass on the dark background, or used only at large-text/decorative sizes with a compliant text variant.

### Claude's Discretion
- Exact accent hue (jewel tone family — derive from/harmonize with Eseriani artwork), exact font pairing, spacing scale, header/footer composition details, icon implementation approach.

### Deferred Ideas (OUT OF SCOPE)
- Hero section, embed player, discography grid, listen pages, social CTAs beyond header/footer anchors → Phase 3.
- Newsletter form island → Phase 4. Per-page OG/meta polish → Phase 5.
- Scroll-reveal/entrance animations → v2 (MOTION-01).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| BRAND-01 | Dark, moody visual identity (deep black base, single jewel/neon accent, cinematic typography) distinct from robindarlington.com | `@theme` token block (Pattern 1) with UI-SPEC's verified `#0A0908`/`#171310`/`#2DD9C5` values; Unbounded/Manrope self-hosted variable-font pairing (Standard Stack, Pattern 2) |
| BRAND-02 | Design tokens (color palette + accent) verified to meet WCAG AA contrast (4.5:1 text, 3:1 large text) before component build | Zero-dependency contrast-check script (Code Examples) implementing the exact W3C relative-luminance formula, wired to fail the build on regression |
| BRAND-03 | Mobile-first responsive layout — single-column on mobile, grid/flex on desktop | Recommended Project Structure + System Architecture Diagram; UI-SPEC's breakpoint contract is the layout source, this research covers the token/data plumbing under it |
| BRAND-04 | Base layout, fonts (Fontsource), and shared nav/footer with social-follow anchors | Pattern 2 (font preload without experimental API), Pattern 3 (`releases.ts` image imports), `BrandIcon.astro` + `@lucide/astro` (Code Examples, Don't Hand-Roll) for header/footer social anchors |
</phase_requirements>

# Phase 2: Brand, Data & Base Layout - Research

**Researched:** 2026-08-06
**Domain:** Astro 5 design-token system, self-hosted variable fonts, typed static data with Sharp image pipeline, zero-JS icon composition
**Confidence:** HIGH

## Summary

This phase has no server, no API, and no runtime data-fetching — everything is decided at build time and shipped as static HTML/CSS. That simplifies the research considerably: the work is (1) a Tailwind 4 `@theme` token block, (2) two self-hosted Fontsource variable-font packages wired up without Google Fonts or an experimental Astro API, (3) a typed `src/data/releases.ts` that imports cover art directly (verified to work in plain `.ts` files, not just `.astro` frontmatter), and (4) two small, zero-JS icon strategies — `lucide-astro`'s official replacement for generic glyphs and `simple-icons` for the five brand marks Lucide doesn't ship.

The one real correction to the project's existing assumptions: `lucide-astro` (the package pinned in CLAUDE.md) is now deprecated on the npm registry in favor of the official `@lucide/astro`. The replacement is a drop-in — same named PascalCase icon-component exports, same peer-dependency range covering the project's pinned `astro@5.18.2` — so this phase should install `@lucide/astro` instead of `lucide-astro`, correcting CLAUDE.md's stale guidance rather than following it.

Everything else in the UI-SPEC's exact color hex values, font-family strings, and Fontsource package names checks out against the actual published packages: `'Unbounded Variable'` and `'Manrope Variable'` are the literal `font-family` strings Fontsource ships in its `@font-face` rules, confirmed by fetching the real CSS from the registry tarballs.

**Primary recommendation:** Use `@fontsource-variable/unbounded@^5.3.0` + `@fontsource-variable/manrope@^5.3.0` imported directly in `global.css` (skip Astro's experimental Fonts API — it is still gated behind `experimental.fonts` in the project's pinned `astro@5.18.2`), preload the two Latin woff2 files manually via a `?url` asset import, install `@lucide/astro` (not `lucide-astro`) for generic glyphs, and `simple-icons@^16.28.0` for the five brand marks. Build `src/data/releases.ts` as a plain typed module — image imports work there because Astro's ambient `*.jpg`/`*.png` → `ImageMetadata` module declarations are global, not `.astro`-scoped.

## Architectural Responsibility Map

This is a fully static (`output: 'static'`) Astro site — there is no SSR tier, API tier, or database tier in this project. All capabilities below resolve to build-time generation (CDN/Static) plus what the browser paints from the shipped HTML/CSS.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens (`@theme` colors/fonts/radius) | CDN/Static | Browser/Client | Compiled once into static CSS at `npm run build`; browser only paints the resulting utility classes — no runtime theming logic exists |
| Base layout (header/footer/nav DOM) | CDN/Static | Browser/Client | Astro pre-renders the full HTML at build time; the browser's only job is layout/paint and hover/focus-visible CSS transitions (no client JS) |
| Typed release catalog (`releases.ts`) | CDN/Static | — | Consumed entirely at build time by `.astro` pages; nothing about it is fetched or computed at runtime — it is baked into the generated HTML |
| Cover art image pipeline (Sharp → avif/webp) | CDN/Static | — | Sharp processes images once during `astro build`; output ships as static files under `dist/_astro/` |
| Contrast verification script | Build tooling (pre-commit/CI, not shipped) | — | Runs against the token hex values in Node before/alongside `npm run build`; produces no runtime artifact |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@fontsource-variable/unbounded` | `^5.3.0` | Self-hosted Unbounded variable font (display/headings) | Official Fontsource variable-axis package; ships one woff2 per subset covering weights 200–900 — exact match for UI-SPEC's Unbounded 700/800 usage |
| `@fontsource-variable/manrope` | `^5.3.0` | Self-hosted Manrope variable font (body/UI) | Same pattern, weights 200–800 — covers UI-SPEC's Manrope 400/600 usage |
| `@lucide/astro` | `^1.29.0` | Generic UI glyph components (chevrons, external-link, play — used later phases) | Official successor package; `lucide-astro` (CLAUDE.md's pin) is deprecated on the registry as of this research — see Package Legitimacy Audit |
| `simple-icons` | `^16.28.0` | Brand SVG path data (Spotify, Instagram, Facebook, YouTube, TikTok) — no components, just data | Data-only package; only the 5 imported icon consts ship in the bundle (tree-shakeable), zero JS at runtime since output is inline SVG in `.astro` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | No new supporting runtime libraries needed this phase | The contrast-check script (below) is a hand-written zero-dependency Node script, not a package |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual Fontsource CSS `@import` + explicit `?url` preload | Astro's native Fonts API (`experimental.fonts` + `<Font />`) | The native API gives automatic preload/fallback generation, but in the project's pinned `astro@5.18.2` it is still gated behind an `experimental` config flag (verified in the installed package's own config schema — see Common Pitfalls). Manual approach has zero experimental-flag risk and is what the sibling site's STACK.md research already assumed before this correction. |
| `@lucide/astro` | Keep `lucide-astro` per CLAUDE.md's literal pin | `lucide-astro` is deprecated on npm (`deprecated: true`, message "Use `@lucide/astro`"). Installing a deprecated package on day one of a new phase is not "matching the sibling site" — it is inheriting the sibling site's own stale research. `@lucide/astro`'s peer range (`^4\|\|^5\|\|^6\|\|^7`) already covers the pinned `astro@5.18.2`. |
| `simple-icons` npm data package | `@icons-pack/react-simple-icons` or `@iconify-json/simple-icons` | Both are React- or Iconify-runtime-oriented; this is a Preact/Astro zero-JS site with no Iconify build step already wired up. Plain `simple-icons` + a 10-line `BrandIcon.astro` wrapper is the minimal dependency surface. |

**Installation:**
```bash
npm install @fontsource-variable/unbounded@^5.3.0 @fontsource-variable/manrope@^5.3.0
npm install @lucide/astro@^1.29.0 simple-icons@^16.28.0
```

**Version verification:** All four versions above were confirmed live against the npm registry during this research session (`npm view <pkg> version`, 2026-08-06):
- `@fontsource-variable/unbounded` → `5.3.0`
- `@fontsource-variable/manrope` → `5.3.0`
- `@lucide/astro` → `1.29.0` (peerDependencies: `astro: '^4 || ^5 || ^6 || ^7'`)
- `simple-icons` → `16.28.0` (license `CC0-1.0`)
- `lucide-astro` → `0.556.0`, but `npm view lucide-astro deprecated` returns: `"Deprecated: Use \`@lucide/astro\`"` [VERIFIED: npm registry]

This does not disturb the project's exact-pinned `@tailwindcss/vite`/`tailwindcss@4.1.16` + `overrides.vite: ^6.4.1` — none of the four new packages touch Vite or Tailwind as peer dependencies. `website/package.json` (read this session) confirms the current pin is unaffected: `"@tailwindcss/vite": "4.1.16", "tailwindcss": "4.1.16"`, `"overrides": { "vite": "^6.4.1" }` [VERIFIED: website/package.json:15-16,28-29].

## Package Legitimacy Audit

| Package | Registry | Age (latest publish) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|----|-----------|-------------|---------|-------------|
| `@fontsource-variable/unbounded` | npm | published 2026-07-19 (patch-cadence release, package itself is years old) | 13,387/wk | `github.com/fontsource/font-files` | SUS → reclassified OK | Approved — "too-new" signal is a false positive: Fontsource publishes a new patch on every Google Fonts metadata sync, so `publishedAt` reflects patch cadence, not package age. Non-deprecated, real repo, real download volume. |
| `@fontsource-variable/manrope` | npm | published 2026-07-19 | 247,653/wk | `github.com/fontsource/font-files` | SUS → reclassified OK | Same reasoning as above; download volume is 18x higher, reinforcing legitimacy. |
| `simple-icons` | npm | published 2026-08-02 (icon-set updates ship near-weekly) | 801,475/wk | `github.com/simple-icons/simple-icons` | SUS → reclassified OK | "too-new" is again a publish-cadence artifact (icon library adds new brand marks constantly). 800K weekly downloads and a well-known maintained repo are decisive. |
| `@lucide/astro` | npm | published 2026-08-06 (today — active release cadence) | 74,933/wk | `github.com/lucide-icons/lucide` | SUS → reclassified OK | Official Lucide monorepo package (`packages/astro`), same repo as the widely-used `lucide-react`. High download count for a package that only recently took over from `lucide-astro`. |
| `lucide-astro` | npm | published 2025-12-05 | 31,955/wk | `github.com/dzeiocom/lucide-astro` | SUS (flagged `deprecated`) | **REMOVED** — registry-confirmed `deprecated: true`, message "Use `@lucide/astro`". Do not install. Replaced by `@lucide/astro` above. |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS] and reclassified OK after manual review:** `@fontsource-variable/unbounded`, `@fontsource-variable/manrope`, `simple-icons`, `@lucide/astro` — all four were flagged only by the automated "too-new" heuristic (which measures latest-publish recency, not package age) and cleared by direct inspection of download counts, source repos, and deprecation status. No `checkpoint:human-verify` is required for these four; the deprecated `lucide-astro` package must not be installed at all.

## Architecture Patterns

### System Architecture Diagram

```
npm run build (Astro static build)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  src/data/releases.ts                                    │
│  - imports cover art (import x from '../assets/...jpg')  │
│  - TS module-level imports resolve via astro/client.d.ts │
│    ambient *.jpg -> ImageMetadata declarations            │
│  - exports typed Release[] + Socials                     │
└───────────────┬─────────────────────────────────────────┘
                │  consumed by
                ▼
┌─────────────────────────────────────────────────────────┐
│  src/layouts/Layout.astro                                │
│  - <head>: meta groundwork, font preload <link>s          │
│  - <Header /> reads socials from releases.ts               │
│  - <slot />                                                │
│  - <Footer /> reads socials + genre line                   │
└───────────────┬─────────────────────────────────────────┘
                │  wraps
                ▼
┌─────────────────────────────────────────────────────────┐
│  src/pages/index.astro (Phase 2 skeleton)                │
│  - <Picture> of Eseriani cover (Sharp avif/webp)          │
│  - type-scale + color-swatch demo blocks                  │
└───────────────┬─────────────────────────────────────────┘
                │  Sharp processes at build time
                ▼
        dist/_astro/*.{avif,webp}  +  dist/index.html
                │
                ▼
        served as static files (nginx/Coolify — Phase 1 pipeline)
```

Global stylesheet flow (parallel to the above, loaded via `<link>`/import in the layout, not part of the page-render tree):
```
website/src/styles/global.css
  @import "tailwindcss"
  @import "@fontsource-variable/unbounded"   ─┐
  @import "@fontsource-variable/manrope"     ─┤ registers @font-face rules
  @theme { --color-*, --font-*, --radius-* } ─┘ generates bg-accent, text-accent, font-display, etc.
```

### Recommended Project Structure
```
website/src/
├── assets/
│   └── releases/           # cover art source images (Sharp-processed, NOT public/)
│       ├── eseriani.jpg
│       ├── randevu.jpg
│       ├── brave.jpg
│       └── open-wide.jpg
├── components/
│   └── BrandIcon.astro     # renders one simple-icons SimpleIcon as inline <svg>
├── data/
│   └── releases.ts         # typed catalog + socials — single source of truth
├── layouts/
│   └── Layout.astro        # shared <head>, Header, Footer, <slot />
├── components/
│   ├── Header.astro
│   └── Footer.astro
├── pages/
│   ├── index.astro         # Phase 2 skeleton page
│   └── 404.astro           # existing from Phase 1
└── styles/
    └── global.css          # @theme block + font imports
```

### Pattern 1: Tailwind 4 `@theme` token block

**What:** CSS-first design tokens declared with namespaced custom properties; Tailwind's Rust engine reads the namespace prefix (`--color-*`, `--font-*`, `--radius-*`) and auto-generates matching utility classes.
**When to use:** Always, for this project — no `tailwind.config.js` exists or should exist (Tailwind 4 is CSS-first; `@astrojs/tailwind` is deprecated per CLAUDE.md).
**Example:**
```css
/* Source: UI-SPEC.md (verified color/font values) + Tailwind 4 @theme convention [CITED: tailwindcss.com/docs/theme] */
@import "tailwindcss";
@import "@fontsource-variable/unbounded";
@import "@fontsource-variable/manrope";

@theme {
  --color-bg:          #0A0908;
  --color-surface:     #171310;
  --color-text:         #F5F1EA;
  --color-text-muted:   #8C8378;
  --color-accent:       #2DD9C5;
  --color-error:        #F0605E;

  --font-display: 'Unbounded Variable', ui-sans-serif, system-ui, sans-serif;
  --font-body:    'Manrope Variable', ui-sans-serif, system-ui, sans-serif;

  --radius-card: 0.5rem;
  --radius-pill: 9999px;
}
```
`--color-accent` → generates `bg-accent`, `text-accent`, `border-accent`, `outline-accent`, `decoration-accent`, etc. `--font-display` → generates `font-display`. `--radius-card` → generates `rounded-card`. This is exactly what the UI-SPEC's `@theme` reference block already specifies — no changes needed to those values.

### Pattern 2: Manual font preload without the experimental Fonts API

**What:** Import Fontsource CSS directly, then separately import the specific woff2 file(s) you want to preload using Vite's `?url` suffix to get the final hashed build URL as a string, and emit a `<link rel="preload">` manually in the layout `<head>`.
**When to use:** This phase — avoids `experimental.fonts` entirely (see Common Pitfalls).
**Example:**
```astro
---
// Source: verified against @fontsource-variable/unbounded@5.3.0 tarball file listing (npm pack --dry-run)
// and Astro's documented `?url` asset-import pattern [CITED: docs.astro.build/en/guides/imports/]
import unboundedLatinWoff2 from '@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2?url';
import manropeLatinWoff2 from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url';
---
<link rel="preload" href={unboundedLatinWoff2} as="font" type="font/woff2" crossorigin />
<link rel="preload" href={manropeLatinWoff2} as="font" type="font/woff2" crossorigin />
```
Preload only the Latin subset files actually used for the site's copy — preloading all 5 subsets per family (cyrillic, cyrillic-ext, greek/vietnamese, latin-ext, latin) would waste bandwidth on subsets the English-only copy never renders.

### Pattern 3: Image import inside a plain `.ts` data file

**What:** `src/data/releases.ts` imports cover art directly via a top-level ES `import`, exactly as an `.astro` frontmatter would, and TypeScript resolves the imported value as `ImageMetadata`.
**When to use:** Always for this phase's data file — this is the whole point of "cover art imported as `ImageMetadata`" per CONTEXT.md.
**Example:**
```typescript
// Source: verified directly against website/node_modules/astro/client.d.ts:93-96 (this session)
// and website/.astro/types.d.ts:1 + node_modules/astro/tsconfigs/base.json `include` (this session)
import eserianiCover from '../assets/releases/eseriani.jpg';
import randevuCover from '../assets/releases/randevu.jpg';
import braveCover from '../assets/releases/brave.jpg';
import openWideCover from '../assets/releases/open-wide.jpg';

export const releases: Release[] = [
  { slug: 'eseriani', cover: eserianiCover, /* ... */ },
  // ...
];
```
This works because `astro/client.d.ts` declares `declare module '*.jpg' { const metadata: ImageMetadata; export default metadata; }` as a **global ambient module declaration** — not scoped to `.astro` files — and that file is pulled into the TypeScript program for the whole project via `.astro/types.d.ts` (`/// <reference types="astro/client" />`), which is itself included by `astro/tsconfigs/base.json`'s `"include": ["${configDir}/.astro/types.d.ts", "${configDir}/**/*"]`. `website/tsconfig.json` extends `astro/tsconfigs/strict`, which extends that base. [VERIFIED: website/node_modules/astro/client.d.ts:93-96 — exact text: `declare module '*.jpg' {\n\tconst metadata: ImageMetadata;\n\texport default metadata;\n}`] [VERIFIED: website/.astro/types.d.ts:1-2 — exact text: `/// <reference types="astro/client" />\n/// <reference path="content.d.ts" />`] [VERIFIED: website/node_modules/astro/tsconfigs/base.json — `"include": ["${configDir}/.astro/types.d.ts", "${configDir}/**/*"]`] [VERIFIED: website/tsconfig.json:2 — `"extends": "astro/tsconfigs/strict"`]

### Pattern 4: `<Picture>` for a responsive square cover

**What:** Sharp-backed responsive image with avif/webp output and a bounded `widths` array (never request a width larger than the source asset).
**When to use:** The skeleton page's Eseriani cover art (the page's stated focal point per UI-SPEC).
**Example:**
```astro
---
import { Picture } from 'astro:assets';
import { releases } from '../data/releases';
const eseriani = releases.find(r => r.slug === 'eseriani')!;
---
<Picture
  src={eseriani.cover}
  formats={['avif', 'webp']}
  widths={[384, 768, 1152]}
  sizes="(min-width: 640px) 384px, 100vw"
  alt="DARLNG — Eseriani cover art"
  class="rounded-card"
/>
```
Eseriani's source file is 1254×1254px (confirmed in CONTEXT.md's disk-verified inventory) — a 1152px generated width stays under that ceiling; do not add a 1920px entry for this specific release since Sharp cannot upscale.

### Anti-Patterns to Avoid
- **Enabling `experimental.fonts` for a one-phase win:** Adds config-surface risk (schema still under `experimental` in the pinned `astro@5.18.2`) for a preload convenience the manual `?url` pattern achieves with zero extra risk.
- **Putting cover art in `public/`:** Skips Sharp entirely — no avif/webp, no `ImageMetadata`, breaks the entire `releases.ts` typing story this phase exists to build. CLAUDE.md already flags this; reinforced here because it's the single most damaging mistake for this specific phase.
- **Hardcoding per-brand hex colors on icons:** UI-SPEC explicitly rejects this (5 clashing brand colors vs. the single-jewel-accent architecture) — `simple-icons`' `.path` gives raw path data with no embedded color; render with `fill="currentColor"` and let CSS (`--color-text-muted` default, `--color-accent` hover) own the color.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Brand SVG icon paths (Spotify, Instagram, Facebook, YouTube, TikTok) | Hand-traced/copy-pasted SVG paths from each platform's brand kit | `simple-icons` package | Path data is normalized, license-cleared (CC0-1.0), and versioned — brand marks change over time and a hand-copied path silently goes stale |
| WCAG contrast math | An eyeballed "looks readable enough" judgement | A small deterministic Node script implementing the W3C relative-luminance formula | BRAND-02 requires *programmatic* verification, not visual — the formula is exact and ~15 lines; no library needed but also no shortcuts allowed |
| Variable-font weight-range CSS | Manually writing 8 separate `@font-face` rules per weight | `@fontsource-variable/*` packages' shipped `index.css`/`wght.css` | The variable font is one physical woff2 file per subset already covering the full weight axis (200–900 Unbounded, 200–800 Manrope) — Fontsource generates the correct `font-weight: 200 900` range syntax already |

**Key insight:** Every "don't hand-roll" in this phase is really "don't hand-roll something that's already been solved and versioned upstream, and that silently rots if you inline a copy of it." The brand icons and font-face rules both fall in this bucket.

## Common Pitfalls

### Pitfall 1: Enabling the experimental Fonts API on the pinned Astro version
**What goes wrong:** Following the newest Astro docs (which describe the Fonts API as if unflagged) and adding `fonts: [...]` at the top level of `astro.config.mjs` — this fails schema validation on `astro@5.18.2`.
**Why it happens:** Astro's public docs site tracks the latest stable release (currently 7.x per registry), but this project is deliberately pinned to `astro@^5.18.2` (see STACK.md's Version Alignment Flag and CLAUDE.md). In the actually-installed `5.18.2`, font configuration is still nested under `experimental.fonts`, confirmed directly in the installed package's own config schema: `if (config.experimental.fonts && config.experimental.fonts.length > 0) { ... }` [VERIFIED: website/node_modules/astro/dist/core/config/schemas/refined.js:131-133].
**How to avoid:** Use the manual Fontsource CSS import + `?url` preload pattern (Pattern 2 above) instead. If a future phase deliberately opts into the experimental API, it must be under `experimental: { fonts: [...] }`, not a top-level `fonts` key.
**Warning signs:** `astro check` or `astro build` throwing a Zod schema error mentioning `fonts` at the config root.

### Pitfall 2: Requesting `<Picture>` widths larger than the source image
**What goes wrong:** Sharp either errors or silently caps output at the source resolution depending on config, and any `widths` entry above the source pixel dimensions produces a wasted/duplicate largest-size output.
**Why it happens:** Eseriani's cover art is only 1254×1254px (verified on disk per CONTEXT.md) — smaller than Randevu/Brave/Open Wide (2450–3000px). A single shared `widths` array across all four releases in a discography/skeleton context risks exceeding Eseriani's ceiling.
**How to avoid:** Cap the `widths` array per-image at or below its actual source resolution; for this phase's single skeleton-page image (Eseriani), use `widths={[384, 768, 1152]}` — nothing above 1254.
**Warning signs:** Build warnings from Sharp about upscaling, or a `srcset` where the largest entry equals the second-largest (indicating Sharp deduplicated an over-request).

### Pitfall 3: `simple-icons` major-version import-shape drift
**What goes wrong:** Older `simple-icons` guides (v3–v9 era) show a different import shape (`require('simple-icons/icons/spotify')` or default-export-per-file patterns). Copying an outdated snippet breaks against v16.
**Why it happens:** The package has gone through several major versions with different module layouts; AI training data and search results often surface older patterns.
**How to avoid:** Use the verified v16.28.0 shape confirmed directly against the published `types.d.ts`: named export per icon, `si` + PascalCase slug, e.g. `import { siSpotify, siInstagram, siFacebook, siYoutube, siTiktok } from 'simple-icons'`, each typed as `SimpleIcon = { title, slug, svg, path, source, hex, guidelines?, license? }` [VERIFIED: simple-icons@16.28.0 registry package — `types.d.ts` and `index.d.ts` fetched and inspected this session].
**Warning signs:** TypeScript error "has no exported member 'siSpotify'" (wrong casing/slug) or a runtime `undefined.path` (using an old sub-path import style that no longer resolves).

### Pitfall 4: Installing deprecated `lucide-astro`
**What goes wrong:** Following CLAUDE.md's literal version pin (`lucide-astro@^0.556.0`) installs a package the registry itself flags as deprecated, inheriting stale guidance the sibling site's own research already superseded.
**Why it happens:** CLAUDE.md and STACK.md were both written before `lucide-astro` was deprecated in favor of the official `@lucide/astro`; the deprecation is a registry-level fact discoverable only by querying npm directly, not by reading either doc.
**How to avoid:** Install `@lucide/astro@^1.29.0` instead. Import syntax is unchanged (`import { ExternalLink } from '@lucide/astro'`) — confirmed by inspecting the package's actual entry file, which does `export * from './icons/index'` [VERIFIED: @lucide/astro@1.29.0 registry package — `src/lucide-astro.ts` fetched and inspected this session].
**Warning signs:** `npm install` printing a deprecation warning for `lucide-astro`.

## Code Examples

### Contrast-check script (zero dependency, verifies UI-SPEC's asserted ratios)
```javascript
// Source: W3C relative-luminance/contrast formula [CITED: w3.org/WAI/WCAG21/Understanding/contrast-minimum.html]
// scripts/check-contrast.mjs — run with `node scripts/check-contrast.mjs`
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function linearize(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map(linearize);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [light, dark] = lA > lB ? [lA, lB] : [lB, lA];
  return (light + 0.05) / (dark + 0.05);
}

// Pairs from UI-SPEC.md's Contrast verification table
const pairs = [
  ['Body text on bg',        '#F5F1EA', '#0A0908', 4.5],
  ['Body text on surface',   '#F5F1EA', '#171310', 4.5],
  ['Muted text on bg',       '#8C8378', '#0A0908', 4.5],
  ['Muted text on surface',  '#8C8378', '#171310', 4.5],
  ['Accent text on bg',      '#2DD9C5', '#0A0908', 4.5],
  ['Accent text on surface', '#2DD9C5', '#171310', 4.5],
  ['Dark text on accent fill', '#0A0908', '#2DD9C5', 4.5],
  ['Error text on bg',       '#F0605E', '#0A0908', 4.5],
  ['Error text on surface',  '#F0605E', '#171310', 4.5],
];

let failed = false;
for (const [label, fg, bg, min] of pairs) {
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= min;
  if (!pass) failed = true;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${ratio.toFixed(2)}:1 (need ${min}:1)`);
}
process.exit(failed ? 1 : 0);
```
Run this as part of the build/check step (e.g. `"check:contrast": "node scripts/check-contrast.mjs"` in `package.json`, invoked from `npm run check` or CI) so BRAND-02 is enforced automatically, not just documented as pre-computed numbers in UI-SPEC.md.

### `BrandIcon.astro` wrapper for `simple-icons`
```astro
---
// Source: simple-icons@16.28.0 SimpleIcon type (verified this session)
import type { SimpleIcon } from 'simple-icons';
interface Props {
  icon: SimpleIcon;
  class?: string;
}
const { icon, class: className } = Astro.props;
---
<svg
  viewBox="0 0 24 24"
  fill="currentColor"
  class={className}
  role="img"
  aria-hidden="true"
>
  <path d={icon.path} />
</svg>
```
Usage in `Header.astro`/`Footer.astro`:
```astro
---
import { siSpotify, siInstagram, siFacebook, siYoutube, siTiktok } from 'simple-icons';
import BrandIcon from '../components/BrandIcon.astro';
---
<a href="https://open.spotify.com/artist/0uXxSPfLr36OuyGDKiBzV3" aria-label="Follow DARLNG on Spotify" class="text-text-muted hover:text-accent transition-colors min-h-11 min-w-11 flex items-center justify-center">
  <BrandIcon icon={siSpotify} class="w-5 h-5" />
</a>
```
Social URLs above are copied verbatim from `.planning/CONTENT.md`'s Social Profiles section.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `lucide-astro` (community) | `@lucide/astro` (official) | Deprecation live on npm as of this research session (2026-08-06) | CLAUDE.md's pin is stale; this phase should install the official package, not the pinned one |
| Static per-weight Fontsource packages (`@fontsource/unbounded`) | Variable-axis packages (`@fontsource-variable/unbounded`) | Ongoing Fontsource convention, not new this phase | One woff2 per subset covers the whole weight range — fewer font-face rules, smaller total payload than loading 2 static weights separately in most cases |

**Deprecated/outdated:**
- `lucide-astro`: registry-flagged deprecated, "Use `@lucide/astro`" — do not install for this phase or any future one.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Preloading only the Latin-subset woff2 file (not cyrillic/greek/vietnamese) is sufficient for this site's English-only copy | Pattern 2 | Low — if a future release title needs a non-Latin glyph, the browser still loads the matching subset lazily via the `@font-face` `unicode-range`; only the *preload* optimization would be incomplete, not correctness |
| A2 | `<Picture>` `widths={[384, 768, 1152]}` with `sizes="(min-width: 640px) 384px, 100vw"` is the right srcset shape for the skeleton page's single focal cover image | Pattern 4 | Low-Medium — a planner/executor should confirm against the final `max-w-sm` (384px) container width decision in UI-SPEC; if the container size changes, these numbers should scale with it |
| A3 | `releases.ts` TypeScript shape (Platform union, Release interface, embed config) proposed below is original design guidance, not sourced from an external authority | (see Open Questions / planner discretion) | Low — this is a design proposal for the planner to adopt or adjust, not a verified external fact; flagging so it isn't mistaken for a documented Astro convention |

## Open Questions (RESOLVED)

1. **Recommended `releases.ts` TypeScript shape (design proposal, not sourced externally)**
   - What we know: CONTEXT.md locks the data model as a plain typed TS file (not content collections), covering 4 releases with per-release platform links, one embed config (Eseriani/YouTube), and a socials export. Phase 3's listen pages need per-platform labels/ordering (per the additional_context brief).
   - What's unclear: The exact interface shape wasn't specified by the user or UI-SPEC — this is Claude's discretion per CONTEXT.md.
   - Recommendation:
     ```typescript
     export type Platform =
       | 'spotify' | 'appleMusic' | 'youtube' | 'iheartradio'
       | 'deezer' | 'amazonMusic' | 'tidal' | 'pandora'
       | 'napster' | 'anghami' | 'boomplay';

     export interface PlatformLink {
       platform: Platform;
       url: string;
       label: string; // display label for listen-page buttons, e.g. "Apple Music"
     }

     export interface YouTubeEmbed {
       videoId: string;       // e.g. 'qltP16ukVr4'
       titleForA11y: string;  // e.g. 'DARLNG x Tobiko — Eseriani (Official Video)'
     }

     export interface Release {
       slug: string;           // 'eseriani' | 'randevu' | 'brave' | 'open-wide'
       title: string;
       year: number;
       artistLine: string;     // e.g. 'Darlng x Tobiko', 'Darlng ft. Shubi Di Badman'
       cover: ImageMetadata;   // imported via top-level `import`, see Pattern 3
       isLatest: boolean;      // true only for Eseriani — drives hero selection in Phase 3
       platforms: PlatformLink[];
       youtubeEmbed?: YouTubeEmbed; // present only for Eseriani this phase
     }

     export interface SocialLink {
       platform: 'spotify' | 'instagram' | 'facebook' | 'youtube' | 'tiktok';
       url: string;
       label: string; // for aria-label, e.g. 'Spotify'
     }

     export const releases: Release[] = [ /* Eseriani, Randevu, Brave, Open Wide — data per CONTENT.md */ ];
     export const socials: SocialLink[] = [ /* order per CONTENT.md's Social Profiles list */ ];
     ```
   - This keeps `Platform` as a closed union (compile-time safety for Phase 3's per-platform button labels/ordering), keeps the YouTube embed config optional and typed rather than a loose object, and keeps `isLatest` boolean-driven rather than "assume `releases[0]`" so Phase 3's hero-selection logic is explicit and won't silently break if array order changes.

2. **`fonts` config location if a later phase wants Astro's native Fonts API**
   - What we know: The API exists and works with Fontsource as a provider even on `astro@5.18.2`, but only under `experimental: { fonts: [...] }`.
   - What's unclear: Whether the project will ever upgrade to an Astro version where it's stable (the sibling-site parity decision explicitly defers Astro 6/7 upgrades).
   - Recommendation: Skip the native API entirely for this phase (manual CSS import + `?url` preload is sufficient and lower-risk); revisit only if a future phase does a deliberate Astro major-version upgrade.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Sharp image processing, build tooling, contrast-check script | ✓ | v24.9.0 | — |
| npm | Package install/build | ✓ | 11.12.1 | — |
| sharp (installed) | `<Picture>` avif/webp generation | ✓ | already in `website/node_modules/sharp` from Phase 1 | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Security Domain

No `security_enforcement: false` override found in `.planning/config.json` (read this session) — treated as enabled by default. This phase ships zero forms, zero user input, and zero network calls (the newsletter form is explicitly Phase 4, per CONTEXT.md's Deferred Ideas). Most ASVS categories are structurally not applicable this phase.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | No auth surface anywhere in this project (fan-facing static site) |
| V3 Session Management | No | No sessions — fully static, no cookies set by this phase |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation | No | Zero user-input fields exist this phase (icons/links are static `<a href>` anchors to external profiles; no forms until Phase 4) |
| V6 Cryptography | No | No secrets, no crypto operations in this phase's scope |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Outbound social/streaming links pointing to attacker-controlled URLs (if a data-entry mistake introduces a malicious href) | Spoofing | All URLs in `releases.ts`/`socials` are copied verbatim from the reviewed, single-source-of-truth `.planning/CONTENT.md` — no user-supplied or dynamically-constructed URLs exist this phase |
| `rel` attribute omission on external `target="_blank"` links (reverse-tabnabbing) | Tampering | Header/footer social icons and any external links this phase should carry `rel="noopener noreferrer"` alongside `target="_blank"` where applicable |

## Sources

### Primary (HIGH confidence)
- `website/node_modules/astro/client.d.ts` (installed astro@5.18.2) — ambient `*.jpg`/`*.png`/etc. → `ImageMetadata` module declarations, read directly this session
- `website/.astro/types.d.ts` + `website/node_modules/astro/tsconfigs/base.json` — confirmed project-wide inclusion of `astro/client` types, read directly this session
- `website/node_modules/astro/dist/core/config/schemas/refined.js` + `.../base.js` + `.../assets/fonts/config.js` — confirmed `experimental.fonts` config location in the pinned Astro version, read directly this session
- npm registry (`npm view`) — live version/deprecation checks for `@fontsource-variable/unbounded`, `@fontsource-variable/manrope`, `lucide-astro`, `@lucide/astro`, `simple-icons`, `tailwindcss`, `@tailwindcss/vite`, `astro`, `sharp`, `@astrojs/preact` — all run this session, 2026-08-06
- Registry tarball contents (`npm pack --dry-run` + `unpkg.com` raw file fetch) for `@fontsource-variable/unbounded@5.3.0` and `@fontsource-variable/manrope@5.3.0` CSS/README — confirmed exact `font-family` strings and file paths
- `unpkg.com` raw fetch of `simple-icons@16.28.0`'s `index.d.ts`/`types.d.ts` — confirmed named export shape and `SimpleIcon` type
- `unpkg.com` raw fetch of `@lucide/astro@1.29.0`'s `package.json` and `src/lucide-astro.ts` — confirmed entry point and re-export shape

### Secondary (MEDIUM confidence)
- [Astro Imports Reference](https://docs.astro.build/en/guides/imports/) — `?url` asset-import pattern
- [Astro Experimental Fonts flag docs](https://docs.astro.build/en/reference/experimental-flags/fonts/) — confirms Fontsource-as-provider support (cross-checked against the pinned version's actual schema, which showed it is still experimental there)
- [W3C WCAG 2.1 Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — relative luminance / contrast ratio formula
- [Tailwind CSS Theme variables docs](https://tailwindcss.com/docs/theme) — `@theme` namespace-to-utility generation

### Tertiary (LOW confidence)
- General WebSearch summaries on Tailwind 4 `@theme` blog posts and lucide-astro migration commentary — used only to corroborate, not as sole source, for any claim also verified against a primary/secondary source above

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version/deprecation claim confirmed live against the npm registry this session
- Architecture: HIGH — the image-import-in-.ts and experimental-fonts findings were verified by reading the actual installed package source, not inferred from docs
- Pitfalls: HIGH — all four pitfalls trace to a verified registry fact or a verified source-code read, not speculation

**Research date:** 2026-08-06
**Valid until:** 2026-09-05 (30 days — npm package versions and the Astro experimental-flags surface can move; re-verify version pins if this research is consumed after that date)
