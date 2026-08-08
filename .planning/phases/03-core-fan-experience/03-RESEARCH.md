# Phase 3: Core Fan Experience - Research

**Researched:** 2026-08-08
**Domain:** Astro 5 static site — full-bleed hero with click-to-load YouTube facade, discography grid, dynamic listen-everywhere pages
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hero (HERO-01, HERO-02)**
- Full-bleed cinematic hero featuring Eseriani: cover art as the dominant visual (full-bleed background treatment with gradient scrim OR large art-forward composition — Claude's discretion per UI-SPEC to follow), title, artist line "Darlng x Tobiko", and primary streaming CTAs.
- Primary CTAs: Spotify, Apple Music, YouTube (minimum per roadmap) + a "listen everywhere" link to `/listen/eseriani`.
- **Embed: YouTube official video `qltP16ukVr4` via youtube-nocookie.com with a FACADE pattern** — static thumbnail + play button rendered at build; iframe injected only on click (protects LCP per HERO-02; the roadmap's "Spotify player" wording was superseded by the user's explicit choice of the YouTube official video, recorded in CONTENT.md).
- The page's LCP element must be the hero image, NOT the iframe (success criterion 2). Hero image loaded eager/fetchpriority=high via Sharp `<Picture>`.

**Discography (MUSIC-01, MUSIC-02)**
- Grid section below hero: Randevu (2024), Brave (2020), Open Wide (2019) as cards — cover art, title, year, feature credit. NO embeds for back catalog.
- Each card links out: primary streaming links (icon buttons or inline links) + a link to the release's `/listen/[slug]` page.
- Data source: `releases`/`latestRelease` exports from `src/data/releases.ts` (Phase 2). No new data entry — consume what exists.

**Listen-Everywhere Pages (LISTEN-01)**
- Static route `src/pages/listen/[slug].astro` via `getStaticPaths()` over `releases` — generates `/listen/eseriani`, `/listen/randevu`, `/listen/brave`, `/listen/open-wide`.
- Fully branded: DARLNG design system (Phase 2 tokens), release cover art, title/artist/year, one prominent button per configured platform (label + brand icon where available; platforms without simple-icons brand marks use a styled text button or generic icon — Claude's discretion).
- Platform button order: follow the `links[]` array order in releases.ts (Spotify first — already canonical).
- Each listen page links back to home.

**Social CTAs (FAN-03)**
- Header/footer follow anchors exist from Phase 2 (satisfies the requirement's placement). This phase may add an in-flow "Follow DARLNG" moment if the composition benefits — discretion, not required.

**Performance groundwork (feeds PERF-01, verified fully in Phase 5)**
- Hero `<Picture>` eager + fetchpriority high; discography/listen images lazy.
- Facade adds no third-party JS until click; the only island permitted this phase is the facade itself if implemented as a Preact island — a zero-JS `<script>` toggle in the Astro component is equally acceptable (Claude's discretion; prefer the lighter option).
- No YouTube cookies/localStorage before click (youtube-nocookie + facade).

### Claude's Discretion
- Hero composition details, scrim/gradient treatment, CTA button hierarchy (respect UI-SPEC-03, produced separately), discography card hover states, listen-page layout, facade implementation (script vs island), whether year/genre chips appear on cards.

### Deferred Ideas (OUT OF SCOPE)
- Newsletter section (Phase 4). Per-page OG images/meta + sitemap/robots + Lighthouse (Phase 5). Pre-save/countdown, video gallery, merch (out of scope per REQUIREMENTS). Scroll-reveal animations (v2 MOTION-01).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| HERO-01 | Cinematic full-bleed hero featuring the latest release (*Eseriani*, 2026) with artwork, release title, and primary streaming CTAs (Spotify, Apple Music, YouTube) | Pattern 2 (LCP-safe `<Picture priority fit="cover">`), Pitfall 2 (Sharp upscale guard), UI-SPEC's already-locked Hero Composition structure |
| HERO-02 | Facade pattern for the YouTube embed, above-the-fold WITHOUT `loading="lazy"` on the hero image, protecting LCP | Pattern 2 (`priority` prop → eager/fetchpriority=high), Pattern 3 (zero-JS facade click→iframe swap), Pitfall 3 (autoplay/`allow` attribute correctness) |
| MUSIC-01 | Discography section for Randevu/Brave/Open Wide as a grid with cover art, title, year | Recommended Project Structure (`DiscographyCard.astro`), Code Example (discography card link pattern), confirmed no upscale risk (source art 2450–3000px, far exceeds requested widths) |
| MUSIC-02 | Each back-catalog release links to streaming platforms via native links, no embeds | Code Example (discography card), `platform-icons.ts` verified mapping table, Pitfall 4 (duplicate-link `aria-label`s) |
| LISTEN-01 | Native `/listen/[slug]` pages with per-platform branded buttons, no third-party smart link | Pattern 1 (`getStaticPaths()` exact API + `Layout.astro` title/description confirmation), `platform-icons.ts` verified mapping table |
| FAN-03 | Social follow links as plain icon links (header/footer already satisfy this from Phase 2) | No new research needed — CONTEXT.md confirms this is satisfied by existing Phase 2 components; this phase adds no required work for FAN-03 |
</phase_requirements>

## Summary

This phase is almost entirely an *application* of decisions already locked in `03-CONTEXT.md` and `03-UI-SPEC.md` — the design contract is unusually complete (exact gradient math, exact component tree, exact copy strings). Research here focused on verifying the *mechanics* the UI-SPEC assumes but doesn't itself verify: the facade click→autoplay behavior, Astro's current image-priority API, `getStaticPaths()`'s exact type shape, and — most importantly — a real discrepancy between the icon package **documented** in `CLAUDE.md`/`UI-SPEC.md` (`lucide-astro`) and the icon package **actually installed** in this project (`@lucide/astro`). That discrepancy is load-bearing: this is the first phase that actually imports a Lucide icon (`Play`, `ChevronRight`, `ExternalLink`), so getting the import wrong at plan time would produce a build failure on the executor's first `astro check`.

All core mechanics check out: Astro 5.18.2 ships a `priority` shorthand prop that sets `loading="eager"`/`decoding="sync"`/`fetchpriority="high"` in one line (verified in installed source); `getStaticPaths()`'s `{ params, props }` shape and `satisfies GetStaticPaths` pattern are unchanged and verified against the installed type declarations; `Layout.astro` already accepts `title`/`description` props, so listen pages need zero layout changes, just per-page prop values; the click-into-iframe facade pattern is the standard, correctly-documented approach and will autoplay-with-sound because the iframe is created synchronously inside the click handler (a valid user gesture) with `allow="autoplay"` on the iframe. Sharp's upscale behavior needs one explicit safeguard: without a `fit` prop, Astro's Sharp service does NOT cap width at the source image's native size (`withoutEnlargement` is only `true` when `transform.fit` is set) — the 1254×1254 Eseriani source will be silently upscaled if the hero's `<Picture>` requests a wider crop without passing `fit="cover"`.

**Primary recommendation:** Implement almost verbatim per `03-UI-SPEC.md` — it is a correct, self-consistent design contract. The two things to get right that the UI-SPEC doesn't spell out at the code level: (1) import Lucide icons from `@lucide/astro` (already installed), NOT `lucide-astro` (deprecated, not installed); (2) always pass `fit="cover"` on the hero `<Picture>` to prevent Sharp from upscaling past the 1254px source.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hero rendering (art, scrim, copy, CTAs) | Static/Build (Astro SSG) | — | Fully pre-rendered at build time; zero runtime server, `output: 'static'` |
| Hero LCP image delivery | CDN/Static (nginx) | Build (Sharp) | Sharp generates avif/webp/widths at build; nginx serves the static asset with immutable cache headers under `/_astro/` |
| Facade click→iframe swap | Browser/Client | — | Pure client-side DOM mutation via a scoped inline `<script>`; no server round-trip, no island hydration |
| Discography grid | Static/Build (Astro SSG) | — | Iterates the typed `releases` array at build time; no client JS |
| `/listen/[slug]` pages | Static/Build (Astro SSG, `getStaticPaths`) | — | 4 fully pre-rendered static routes, one per release; no runtime routing |
| Platform icon resolution | Static/Build (Astro SSG) | — | `platform-icons.ts` lookup table resolved at build time into inline SVG; no client JS |

## Standard Stack

### Core (already installed — no new packages this phase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | `5.18.2` [VERIFIED: website/node_modules/astro/package.json] | SSG, `<Picture>`, `getStaticPaths()` | Locked project stack |
| @lucide/astro | `1.29.0` installed, `1.30.0` latest [VERIFIED: website/node_modules/@lucide/astro/package.json; npm view] | Generic icons (Play, ChevronRight, ExternalLink) for facade button + link chevrons | Already installed by Phase 2; official current Lucide/Astro package (see Common Pitfalls — CLAUDE.md/UI-SPEC name the deprecated alternative) |
| simple-icons | `16.28.0` [VERIFIED: website/node_modules/simple-icons/package.json] | Brand marks for streaming platforms | Already installed, already used by `social-icons.ts`/`BrandIcon.astro` in Phase 2 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro:assets` `<Picture>` | bundled with astro 5.18.2 | Hero LCP image, discography cards, listen-page cover art, facade thumbnail | Every raster image in this phase — matches Phase 2's established pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain inline `<script>` facade | Preact island for the facade | CONTEXT.md already decided against this ("prefer the lighter option") — a script needs no hydration payload, no `client:*` directive, and the interaction (one click → one DOM swap) has no state complex enough to justify a component framework |
| Sharp-cropped cover-art still for facade thumbnail | ffmpeg-extracted video frame | UI-SPEC already decided in favor of the cover-art crop (see Facade Mechanic Contract) — reuses the existing asset pipeline, avoids introducing a second non-Sharp-managed image file that bypasses `astro:assets` optimization. ffmpeg 8.0 is installed locally [VERIFIED: `ffmpeg -version` this session] as a fallback only if the crop reads poorly in visual QA — not needed for the initial build |

**Installation:** None required — every package this phase needs is already in `package.json`.

**Version verification:** All versions above verified directly against `website/node_modules/*/package.json` and `npm view` in this session — no training-data guesses.

## Package Legitimacy Audit

No new packages are installed this phase. Re-verified the two packages this phase newly *imports for the first time* (both already dependencies since Phase 2, but unused until now):

| Package | Registry | Age (latest publish) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@lucide/astro` | npm | Latest version published 2026-08-07 [VERIFIED: `npm view @lucide/astro time.modified`] | 72,304/wk | github.com/lucide-icons/lucide | SUS (`too-new` heuristic) | **Approved** — flag is a false positive: the heuristic checks latest-*version* publish date, not package age; 72k weekly downloads, official `lucide-icons` org repo, no `postinstall` script, no deprecation notice, already installed since Phase 2 with no incident |
| `simple-icons` | npm | Latest version published 2026-08-02 [VERIFIED: `npm view simple-icons time.modified`] | 765,690/wk | github.com/simple-icons/simple-icons | SUS (`too-new` heuristic) | **Approved** — same false-positive reasoning; already in production use since Phase 2 (`social-icons.ts`, `BrandIcon.astro`) |

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** both above, resolved as approved false positives — no `checkpoint:human-verify` needed since neither is a new install and both have a multi-year, high-download production history under their listed org repos.

## Architecture Patterns

### System Architecture Diagram

```
Build time (astro build, output: 'static')
  releases.ts (typed data) ──┬──> index.astro
                              │      ├─ Hero: latestRelease → <Picture priority fit="cover"> (LCP)
                              │      │         → YouTubeFacade.astro (thumbnail + <script> trigger)
                              │      └─ Discography: releases.filter(!isLatest) → 3× card
                              │
                              └──> listen/[slug].astro (getStaticPaths over releases)
                                     → 4 static HTML files: /listen/{eseriani,randevu,brave,open-wide}
                                     → platform-icons.ts lookup per platforms[] entry

Runtime (browser, zero JS until interaction)
  Page load ──> hero <Picture> paints (LCP) ──> facade thumbnail paints (lazy, below CTA row)
                                                       │
                                                click on [data-facade-trigger]
                                                       │
                                          createElement('iframe')
                                          src = youtube-nocookie.com/embed/{id}?autoplay=1
                                          allow="autoplay; encrypted-media; picture-in-picture"
                                                       │
                                          replaces thumbnail node inside fixed 16:9 container
                                                       │
                                          browser: iframe request → youtube-nocookie.com (first
                                          3rd-party request of the whole page load, gated on click)
```

### Recommended Project Structure
```
src/
├── components/
│   ├── YouTubeFacade.astro   # new — thumbnail + play button + inline <script>
│   ├── DiscographyCard.astro # new — one <article> per back-catalog release
│   └── PlatformButton.astro  # new — reusable "full-width List button" (hero CTAs use a lighter pill variant inline, not this component — see UI-SPEC CTA row anatomy vs Platform button anatomy, two distinct button treatments)
├── data/
│   └── platform-icons.ts     # new — Platform → SimpleIcon | null lookup (per UI-SPEC table)
├── pages/
│   ├── index.astro           # replaced — hero + discography
│   └── listen/
│       └── [slug].astro      # new — getStaticPaths over releases
```

### Pattern 1: `getStaticPaths()` over the releases array
**What:** Astro 5.18.2's exact type contract for a dynamic SSG route.
**When to use:** `src/pages/listen/[slug].astro`.
**Example:**
```typescript
---
// Source: node_modules/astro/dist/types/public/common.d.ts (installed 5.18.2, read this session)
import type { GetStaticPaths } from 'astro';
import Layout from '../../layouts/Layout.astro';
import { releases } from '../../data/releases';

export const getStaticPaths = (() => {
  return releases.map((release) => ({
    params: { slug: release.slug },
    props: { release },
  }));
}) satisfies GetStaticPaths;

const { release } = Astro.props;
---
<Layout title={`Listen to ${release.title} — DARLNG`} description={`Listen to ${release.title} by ${release.artistLine} on every platform.`}>
  <!-- ... -->
</Layout>
```
`Layout.astro`'s `Props` interface is `{ title?: string; description?: string; }` [VERIFIED: website/src/layouts/Layout.astro:8-11] — no changes to `Layout.astro` needed; every listen page just needs to pass distinct `title`/`description` values.

### Pattern 2: LCP-safe hero `<Picture>` with the `priority` shorthand
**What:** Astro 5.10+'s `priority` boolean prop.
**When to use:** The hero background `<Picture>` only (max one per page).
**Example:**
```astro
<!-- Source: node_modules/astro/dist/assets/internal.js:100-109 (installed 5.18.2, read this session) -->
<Picture
  src={latestRelease.cover}
  formats={['avif', 'webp']}
  widths={[640, 960, 1254]}
  sizes="100vw"
  fit="cover"
  priority
  alt={`DARLNG — ${latestRelease.title} cover art`}
  class="absolute inset-0 h-full w-full object-cover object-[35%_28%]"
/>
```
`priority` expands to `loading="eager"`, `decoding="sync"`, `fetchpriority="high"` automatically [VERIFIED: website/node_modules/astro/dist/assets/internal.js:100-104 — `if (resolvedOptions.priority) { resolvedOptions.loading ??= "eager"; resolvedOptions.decoding ??= "sync"; resolvedOptions.fetchpriority ??= "high"; }`]. This satisfies HERO-02's "above-the-fold WITHOUT `loading=\"lazy\"`" requirement in one prop instead of three explicit HTML attributes — either form is acceptable; `priority` is less error-prone to hand-author.

**Critical: the `fit="cover"` prop is not optional here** — see Common Pitfalls (Sharp upscale).

### Pattern 3: Zero-JS facade, click→iframe swap
**What:** The exact click handler UI-SPEC's Facade Mechanic Contract specifies, now confirmed against real autoplay/user-gesture mechanics.
**When to use:** `YouTubeFacade.astro`, scoped inline `<script>`.
**Example:**
```astro
---
interface Props { videoId: string; titleForA11y: string; }
const { videoId, titleForA11y } = Astro.props;
---
<div class="facade-container relative aspect-video overflow-hidden rounded-card">
  <!-- Picture thumbnail + play <button data-facade-trigger aria-label={`Play ${titleForA11y}`}> per UI-SPEC -->
</div>
<script define:vars={{ videoId, titleForA11y }}>
  const container = document.querySelector('.facade-container');
  const trigger = container?.querySelector('[data-facade-trigger]');
  trigger?.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    iframe.title = titleForA11y;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.className = 'absolute inset-0 h-full w-full border-0';
    container?.replaceChildren(iframe);
  }, { once: true });
</script>
```
Null-safety on `querySelector` (`?.`) is required for `astro check` to pass cleanly under `astro/tsconfigs/strict` [VERIFIED: website/tsconfig.json — `"extends": "astro/tsconfigs/strict"`] — an un-guarded `document.getElementById(...).addEventListener` will type-error under strict mode since the return type is nullable. Use `define:vars` (Astro's built-in mechanism for passing server-known values into a client `<script>`) rather than string-templating the videoId into the script body — avoids any HTML-injection surface and is the idiomatic Astro pattern.

`{ once: true }` on `addEventListener` is a small, correct addition beyond what UI-SPEC's contract states explicitly — prevents a double-fire if the button somehow receives two rapid clicks/taps before the DOM swap completes.

**Autoplay-on-click confirmation** [CITED: web.dev third-party-facades guidance + general Chrome autoplay-policy consensus, MEDIUM confidence]: creating the iframe with `src` containing `autoplay=1` **inside** the synchronous click event handler counts as a user-gesture-triggered load — Chrome's autoplay-with-sound policy permits this because the DOM insertion is causally attached to the click, not a delayed/async injection. The iframe's `allow="autoplay"` attribute is what actually grants the *cross-origin* child frame permission to invoke `play()` with sound using the parent's momentary user-activation — omitting it is the single most common reason this exact pattern silently fails to autoplay (video loads, but sits paused). `mute=1` is unnecessary here since this is gesture-triggered, not page-load-triggered, autoplay.

**Zero third-party requests pre-click:** confirmed by construction — the thumbnail is a local Sharp-processed asset (`src/assets/releases/eseriani.jpg`, not `i.ytimg.com`), and no `<iframe>`/`<script src="youtube...">` exists in the DOM until the click handler runs. This matches CONTEXT.md's explicit "No YouTube cookies/localStorage before click" constraint.

### Anti-Patterns to Avoid
- **Requesting a hero `<Picture>` width array without `fit`:** silently upscales past the 1254px source (see Common Pitfalls).
- **Importing icons from `lucide-astro`:** package is deprecated and not installed in this project — will fail to resolve at build (see Common Pitfalls).
- **Using a Preact island for the facade:** unnecessary hydration cost for a one-shot click→DOM-swap; CONTEXT.md already rejected this.
- **String-templating `videoId` into an inline `<script>` body:** use `define:vars` instead — same output, safer pattern, matches Astro's documented idiom for server→client value passing in non-island scripts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Responsive image `srcset`/`sizes` generation | Manual `<picture>` + manual Sharp CLI calls | `astro:assets` `<Picture>` (already the project's established pattern) | Handles avif/webp negotiation, width descriptors, and lazy/eager attributes in one component; Phase 2 already proved this pipeline works |
| Brand icon SVGs for 8 verified platforms | Hand-traced/downloaded logo SVGs | `simple-icons` package, `BrandIcon.astro` wrapper (already exists) | Guarantees pixel-accurate, license-correct marks; the UI-SPEC's Platform Icon Mapping table is already verified against the installed package version — reuse it verbatim, don't re-derive |
| Per-page `<title>`/meta description | A new prop-drilling scheme | `Layout.astro`'s existing `title`/`description` props | Already supports exactly this; zero layout changes needed |

**Key insight:** every "don't hand-roll" concern for this phase was already solved by Phase 2's infrastructure — the only genuinely new mechanic in Phase 3 is the facade click handler, and even that has a single well-documented industry-standard shape (web.dev's own "third-party facades" guidance describes exactly this).

## Common Pitfalls

### Pitfall 1: `lucide-astro` vs `@lucide/astro` — the package named in CLAUDE.md/UI-SPEC is deprecated and not installed
**What goes wrong:** A plan or executor writes `import { Play } from 'lucide-astro'` (as literally named in both `CLAUDE.md`'s Recommended Stack table and `03-UI-SPEC.md`'s Design System table) and the build fails — `lucide-astro` is not a dependency in this project's `package.json`.
**Why it happens:** Both docs were authored before this discrepancy was caught; `@lucide/astro@^1.29.0` (a *different* package, not a scoped alias of the same thing) was installed during Phase 2 for icon needs that Phase 2 ultimately didn't end up using (grep confirms zero `lucide` imports in `src/` before this phase) — so the mismatch has been latent and untested until now.
**How to avoid:** Import all generic icons (`Play`, `ChevronRight`, `ExternalLink`) from `@lucide/astro`, matching what's actually in `package.json`/`node_modules`. Component API: `import { Play, ChevronRight, ExternalLink } from '@lucide/astro'`, each a PascalCase Astro component accepting `size` (default 24), `color` (default `currentColor`), `stroke-width`/`strokeWidth` (default 2), and `class` [VERIFIED: website/node_modules/@lucide/astro/src/Icon.astro:7-15 and website/node_modules/@lucide/astro/src/icons/index.ts:344,589,1193 — `export { default as ChevronRight } from './chevron-right'`, `export { default as ExternalLink } from './external-link'`, `export { default as Play } from './play'`].
**Warning signs:** `astro check` or `npm run build` failing with a module-not-found on `lucide-astro`; this is the first phase where that failure would actually surface, since Phase 2 never imported the package.
**Additional context** [CITED: github.com/lucide-icons/lucide, MEDIUM confidence]: `lucide-astro` (the `dzeiocom` community package referenced in CLAUDE.md) states in its own docs "deprecated — use `@lucide/astro`." `@lucide/astro` is the official `lucide-icons` org package, current registry version `1.30.0` (installed: `1.29.0` — a minor bump behind, not blocking). **Recommend updating `CLAUDE.md`'s Recommended/Supporting Libraries tables and any future UI-SPEC generation to reference `@lucide/astro`, not `lucide-astro`**, so this doesn't resurface in a later phase.

### Pitfall 2: Sharp silently upscales the hero image past its 1254px source
**What goes wrong:** The hero `<Picture>` requests `widths={[640, 960, 1254, 1920]}` (a plausible-looking desktop-safe array) without a `fit` prop; Sharp enlarges the 1254px source up to 1920px, producing a soft/blurry hero on large viewports instead of erroring or clamping.
**Why it happens:** Astro's Sharp service only sets `withoutEnlargement: true` when `transform.fit` is truthy — `const withoutEnlargement = Boolean(transform.fit)` [VERIFIED: website/node_modules/astro/dist/assets/services/sharp.js:50, applied to all three resize branches at lines 59, 65, 71]. A `widths`-only `<Picture>` call (the pattern already used in the current `index.astro` skeleton, which also omits `fit`) does not set `transform.fit`, so enlargement is permitted by default.
**How to avoid:** Always pass `fit="cover"` on the hero `<Picture>` (which is also semantically correct here, since the hero uses `object-cover` CSS treatment) — this sets `withoutEnlargement: true` on Sharp's resize call, capping output at the source's native 1254px regardless of what width the `widths` array requests. Cap the `widths` array itself at `1254` as a second, explicit safeguard (e.g. `widths={[640, 960, 1254]}`) — don't request 1440/1920 entries that will just get silently clamped to 1254 duplicate output.
**Warning signs:** Hero art looking soft/blurry specifically on 1440px+ desktop viewports; this is exactly the "overflow" backstop item `03-UI-SPEC.md` already flagged ("Sharp will either upscale (soft) or the browser will stretch the largest generated size... requires a human visual check").

### Pitfall 3: Facade autoplay silently fails to play (loads paused)
**What goes wrong:** Iframe is created and inserted correctly, video loads, but does not autoplay — user has to click YouTube's own in-frame play button a second time.
**Why it happens:** Missing or incorrect `allow="autoplay"` on the injected `<iframe>` — without it, the browser does not extend the parent page's user-activation state to the cross-origin child frame, and YouTube's player falls back to a paused state despite `?autoplay=1` in the URL.
**How to avoid:** Set `iframe.allow = 'autoplay; encrypted-media; picture-in-picture'` (exact string from UI-SPEC's contract) before or immediately after setting `src`, and insert the iframe into the DOM synchronously inside the click handler (not after an `await`/`setTimeout`/promise chain, which can break the user-gesture attribution).
**Warning signs:** Manual click-test shows the thumbnail replaced by a paused YouTube player frame instead of playing video.

### Pitfall 4: Two links to the same `/listen/{slug}` destination read as duplicate/ambiguous to screen readers
**What goes wrong:** Discography card has both an art+title link and an "All platforms →" text link pointing to the same URL; without distinct `aria-label`s, screen reader users hear two identical "Randevu" links with no differentiation.
**Why it happens:** Easy to copy-paste the same generic link text/label across both anchors.
**How to avoid:** UI-SPEC already specifies distinct `aria-label`s (`"{title} — listen and platforms"` on the art+title link, `"All {title} platforms"` on the text link) — implement both as written, don't collapse to one shared label.
**Warning signs:** An accessibility audit (VoiceOver/axe) flagging duplicate link text within the same card.

## Code Examples

### Discography card link pattern (avoids duplicate-link a11y issue)
```astro
<!-- Source: 03-UI-SPEC.md Card anatomy, translated to Astro -->
<article>
  <a href={`/listen/${release.slug}`} aria-label={`${release.title} — listen and platforms`}>
    <Picture src={release.cover} formats={['avif', 'webp']} widths={[300, 400, 600, 800]}
      sizes="(min-width:1280px) 384px, (min-width:768px) 224px, 100vw"
      loading="lazy" fit="cover"
      alt={`${release.title} cover art`}
      class="aspect-square rounded-card object-cover" />
    <h3>{release.title}</h3>
  </a>
  <p>{release.year} · ft. {release.artistLine}</p>
  <!-- platform icon row, first 3 entries -->
  <a href={`/listen/${release.slug}`} aria-label={`All ${release.title} platforms`}>All platforms →</a>
</article>
```

### `platform-icons.ts` (as locked by UI-SPEC, verified this session)
```typescript
// Verified this session via: node -e "require('simple-icons')" against installed simple-icons@16.28.0
// amazonMusic, anghami, boomplay confirmed to have NO simple-icons export — fallback required.
import { siSpotify, siApplemusic, siYoutube, siIheartradio, siDeezer, siTidal, siPandora, siNapster } from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';
import type { Platform } from './releases';

export const platformIcons: Record<Platform, SimpleIcon | null> = {
  spotify: siSpotify,
  appleMusic: siApplemusic,
  youtube: siYoutube,
  iheartradio: siIheartradio,
  deezer: siDeezer,
  tidal: siTidal,
  pandora: siPandora,
  napster: siNapster,
  amazonMusic: null,
  anghami: null,
  boomplay: null,
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Manually setting `loading="eager" fetchpriority="high" decoding="sync"` on `<Image>`/`<Picture>` | `priority` boolean shorthand prop | Astro 5.10 (2026) [CITED: astro.build/blog/astro-5100] | One prop instead of three attributes; less room for a typo'd attribute name |
| `lucide-astro` (community, dzeiocom) | `@lucide/astro` (official, lucide-icons org) | `lucide-astro` deprecated ~8 months prior to this research date per its own repo | This project's own `package.json` already reflects the migration (installed `@lucide/astro`), but `CLAUDE.md` and `03-UI-SPEC.md` still reference the old name — see Pitfall 1 |

**Deprecated/outdated:** `lucide-astro` — do not install or reference it; use `@lucide/astro` (already installed).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Click-triggered iframe autoplay-with-sound reliably works across current Chrome/Safari/Firefox without `mute=1` | Pattern 3, Pitfall 3 | Low — if a specific browser blocks it, the video simply loads paused (one extra click); the CTA row's direct YouTube link remains a working fallback per UI-SPEC's documented backstop. Verify manually across 2-3 browsers during implementation. |

**If this table is empty:** N/A — see A1 above; all other technical claims in this research were verified directly against installed source files or cross-checked web sources this session.

## Open Questions

1. **Does `@lucide/astro`'s tree-shaking behave correctly with Astro 5's static build when importing only 2-3 icons from the barrel `@lucide/astro` export?**
   - What we know: the package exports via `export * from './icons/index'` (a large barrel file) [VERIFIED: website/node_modules/@lucide/astro/src/lucide-astro.ts]; each icon is a separate `.ts` file re-exported through the barrel.
   - What's unclear: whether Vite's tree-shaking during `astro build` eliminates the ~1600 unused icon exports from the final bundle, or whether the barrel import pulls in dead code.
   - Recommendation: not a blocker — icons render as static Astro components with zero client JS shipped (they're server-rendered to inline SVG at build time, same as `BrandIcon.astro`'s `simple-icons` pattern), so even an imperfect tree-shake has no client bundle-size impact. No action needed; noted for completeness only.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ffmpeg | Facade thumbnail (only if cover-art crop needs replacing with a video still) | ✓ [VERIFIED: `ffmpeg -version` this session] | 8.0 (Homebrew) | Not needed — UI-SPEC already locks the cover-art-crop approach as primary |
| Node.js / npm | Build tooling | ✓ (project already builds) | — | — |
| `src/assets/releases/eseriani.jpg` | Hero LCP image + facade thumbnail source | ✓ [VERIFIED: `identify` command this session — 1254×1254 JPEG] | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — everything this phase needs is already present.

## Security Domain

> `security_enforcement` not found in `.planning/config.json` — treated as enabled per default.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V5 Input Validation | No | No user input this phase (no forms — deferred to Phase 4) |
| V6 Cryptography | No | Not applicable |
| General web hygiene | Yes | `rel="noopener noreferrer"` on every `target="_blank"` external link (already an audited invariant from Phase 2, `check-contrast.mjs`-adjacent pattern); `youtube-nocookie.com` (not `youtube.com`) for the embed, minimizing tracking cookie surface per CLAUDE.md's stated GDPR rationale |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Inline `<script>` blocked by a future CSP | Tampering (config drift) | Current `nginx.conf` sets no `Content-Security-Policy` header at all [VERIFIED: website/nginx.conf:1-27 — headers present are `Cache-Control`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; no CSP directive anywhere in the file], so the facade's inline `<script>` is unaffected today. Flag for Phase 5 (or whenever a CSP is introduced): an inline script without a nonce/hash will break under a strict `script-src` — note this dependency if CSP is ever added. |
| Clickjacking on embedded iframe | Tampering | `X-Frame-Options: SAMEORIGIN` already set at the *outer* page level [VERIFIED: website/nginx.conf:9] — protects darlng.com from being framed; irrelevant to the *inner* youtube-nocookie iframe darlng.com itself embeds (that's YouTube's own framing posture, out of this project's control) |
| Reflected/stored XSS via `videoId`/`titleForA11y` in `define:vars` | Tampering | Both values are hard-coded, build-time-typed constants from `releases.ts` (`YouTubeEmbed.videoId`, `titleForA11y`), never user input — no injection surface exists this phase |

## Sources

### Primary (HIGH confidence — verified this session against installed source/files)
- `website/node_modules/astro/dist/types/public/common.d.ts` — `getStaticPaths`/`GetStaticPaths` exact type shape, installed astro@5.18.2
- `website/node_modules/astro/dist/assets/internal.js` — `priority` prop → `loading`/`decoding`/`fetchpriority` expansion
- `website/node_modules/astro/dist/assets/services/sharp.js` — `withoutEnlargement` upscale behavior tied to `transform.fit`
- `website/node_modules/@lucide/astro/src/icons/index.ts`, `Icon.astro` — confirmed `Play`, `ChevronRight`, `ExternalLink` exports and prop API
- `website/node_modules/@lucide/astro/package.json`, `website/package.json` — confirmed installed package name/version
- `website/nginx.conf` — confirmed no CSP header, confirmed `X-Frame-Options` scope
- `website/src/layouts/Layout.astro` — confirmed existing `title`/`description` Props interface
- `website/src/data/releases.ts` — confirmed `Release`/`PlatformLink`/`YouTubeEmbed` types and all 4 releases' data
- `node -e "require('simple-icons')"` run this session — confirmed exact icon export availability matching UI-SPEC's Platform Icon Mapping table
- `identify` / `ffmpeg -version` run this session — confirmed asset dimensions and local tool availability

### Secondary (MEDIUM confidence — web search cross-checked)
- github.com/lucide-icons/lucide + npmjs.com/package/@lucide/astro + npmjs.com/package/lucide-astro — `lucide-astro` deprecation, `@lucide/astro` as official successor
- web.dev "Lazy load third-party resources with facades" / "Embedding YouTube Videos Without Slowing Down Your Site" — facade pattern shape, click-triggered autoplay-with-sound user-gesture mechanics
- astro.build/blog/astro-5100 — `priority` prop introduction

### Tertiary (LOW confidence)
- None used unqualified — all web-search findings above were cross-checked against either official repos/npm or this project's own installed source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package/version verified against installed `node_modules`, zero new installs
- Architecture: HIGH — UI-SPEC.md is an unusually complete, already-locked design contract; this research only had to verify the code-level mechanics it assumes
- Pitfalls: HIGH — the two most consequential findings (lucide package mismatch, Sharp upscale behavior) were verified by reading actual installed source, not inferred

**Research date:** 2026-08-08
**Valid until:** 2026-09-07 (30 days — stable stack, no fast-moving dependencies in scope)

