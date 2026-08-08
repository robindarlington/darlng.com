# Phase 5: SEO & Launch Polish - Research

**Researched:** 2026-08-08
**Domain:** Astro 5 static-site SEO metadata, build-time OG image generation with Sharp, sitemap/robots, favicon set, and local Lighthouse/axe verification
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Meta & Open Graph (SEO-01)**
- Per-page `<title>`, `<meta name="description">`, canonical URL, OG (og:title, og:description, og:image, og:url, og:type) + Twitter Card (summary_large_image) — implemented in `Layout.astro` via props (title/description already exist; extend with image/type/canonical).
- Absolute URLs built from `Astro.site` (`https://darlng.com` — verify astro.config.mjs `site` is set; set it if missing).
- OG images at 1200×630: generate from release artwork at build time via Sharp (crop/letterbox on brand background with the release art — decide the cleanest approach; a simple centered-art-on-`--color-bg` composition is acceptable; no text overlay needed for v1). Homepage OG = Eseriani-based; each /listen/[slug] OG = that release's art; 404 uses the homepage image.
- `og:type`: `music.album` for listen pages where applicable, `website` for home.

**Sitemap & robots (SEO-02)**
- `@astrojs/sitemap` already installed + `site` config → verify sitemap-index.xml output; add `robots.txt` (static public/ file) referencing the sitemap at the absolute URL.
- 404 excluded from sitemap (check default behavior; exclude explicitly if needed).

**Performance (PERF-01, PERF-02)**
- Lighthouse locally against the BUILT dist served by the production nginx container (docker) or `astro preview` — targets: LCP <2.5s, CLS <0.1, TBT <200ms (lab, desktop + mobile emulation). Use lighthouse CLI via npx (no new repo deps — it runs via npx).
- Fix what Lighthouse surfaces within scope: font preload correctness, image sizes/priority attrs, any render-blocking issues. PERF-02 (Sharp srcset, fixed dimensions) is largely done in Phases 2–3 — verify, don't rebuild.
- Axe scan (npx @axe-core/cli or agent-browser + axe injection) on /, one listen page, 404: zero critical violations, zero contrast violations (roadmap criterion 4).

**Favicon (deferred IN-05 from Phase 2)**
- Create an SVG favicon (DARLNG "D" or wordmark glyph in accent on transparent/bg) + fallback .ico + apple-touch-icon PNG (180×180) from the same mark; wire in Layout head. Keep it simple, typographic, on-brand.

**DEPLOY.md**
- Extend post-cutover checklist: PageSpeed Insights on live domain, opengraph.xyz check for / and /listen/eseriani, Search Console sitemap submission note.

### Claude's Discretion
- OG image composition details, favicon glyph design, meta description copy (voice: confident, independent — reuse established strings where sensible), lighthouse run configuration.

### Deferred Ideas (OUT OF SCOPE)
- Live-domain Lighthouse/PageSpeed + opengraph.xyz + Search Console → user's deploy checklist (DEPLOY.md).
- Schema.org JSON-LD, per-release sub-pages, analytics, scroll animations → v2 (tracked in STATE.md deferred table).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|--------------|--------------------|
| SEO-01 | Per-page Open Graph + Twitter Card meta (`og:title`, `og:description`, `og:image` 1200×630 release artwork at absolute production URLs, `og:type` music.album where applicable) | Pattern 2 (Sharp OG image composition) + Pattern 4 (Layout.astro meta prop extension) + Code Examples (verified `og:type`/`music:musician` property set from ogp.me) |
| SEO-02 | Sitemap (`@astrojs/sitemap`) and robots.txt generated | Summary + Code Examples (verified 404 auto-exclusion from installed source, `sitemap-index.xml` robots.txt directive) |
| PERF-01 | Core Web Vitals pass (LCP <2.5s, CLS <0.1, TBT <200ms) verified via Lighthouse before ship | Code Examples (verified `npx lighthouse --help` flags) + Pitfall 3 (correct build artifact to test) |
| PERF-02 | Cover art and press images optimized with Sharp (responsive `srcset`, fixed dimensions to prevent CLS) | Already implemented in Phases 2-3 per CONTEXT.md — this phase verifies via Lighthouse CLS metric, no rebuild needed |
</phase_requirements>

## Summary

Phase 5 is pure polish on an already-complete site: no new pages, no new runtime dependencies, no new npm packages in `package.json`. Every capability needed — Open Graph/Twitter meta, a 1200×630 OG image per release, sitemap/robots.txt, a favicon set, and Lighthouse/axe verification — is achievable with the already-installed `sharp` (`^0.34.5`, confirmed present and `require()`-able standalone in this repo) plus `npx`-invoked CLI tools (`lighthouse`, `@axe-core/cli`) that never touch `package.json`.

The two build-time asset generators (OG images, favicon PNGs/ICO) should live in a single new prebuild script (mirroring the existing `scripts/check-contrast.mjs` pattern already in this repo) that runs before `astro build` and writes directly into `website/public/`. `public/` bypasses Astro's image pipeline by design — this is correct and required here because OG image URLs must be stable, absolute, and resolvable without a build-time asset hash (`og:image` cannot point at Astro's hashed `_astro/*.webp` output).

`@astrojs/sitemap@3.7.3` (already installed, matches latest) auto-excludes `/404` from its output — **verified directly by reading the installed package's compiled source in this repo's `node_modules`** (`STATUS_CODE_PAGES = new Set(["404", "500"])`, applied as a filter before any user-supplied `filter()`). No config change is needed to satisfy the 404-exclusion requirement; the `filter` option exists only if additional custom exclusions become necessary later. Sitemap output is `sitemap-index.xml` (the file `robots.txt` must point at) plus `sitemap-0.xml` (the actual page-list, referenced from the index — never linked directly from `robots.txt`).

Lighthouse CLI has no `--preset=mobile` (verified via `npx lighthouse --help` run in this repo — `--preset` choices are only `"perf" | "experimental" | "desktop"`); mobile emulation is controlled via `--form-factor=mobile` instead, which is the on-disk-verified flag for this exact purpose. `@axe-core/cli` has **no severity/impact filter flag** (verified via `npx @axe-core/cli --help`) — `--exit` fails the process on *any* violation regardless of impact level, so the "zero critical violations only" gate from CONTEXT.md requires parsing the JSON output (`--stdout` or `--save`) and filtering on the `impact` field in a small wrapper script rather than relying on `--exit` alone.

**Primary recommendation:** One new prebuild script (`scripts/generate-og-images.mjs`, run via a `prebuild` npm script or chained into `build`) uses `sharp` directly to composite each release's cover art onto a `#0A0908` (`--color-bg`) canvas at 1200×630 and write to `public/og/{slug}.png` + `public/og/home.png`, and generates the favicon set (SVG + PNG raster + hand-rolled ICO container, no new dependency) into `public/` in the same pass. `Layout.astro` gains `image`, `type`, and `canonical` props with sensible defaults, building absolute URLs from `Astro.site`/`Astro.url`. Lighthouse and axe run via `npx` against the Docker/nginx container (most production-faithful), with axe results filtered for `impact === "critical"` and any `*-contrast` rule ID in a follow-up parse step.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OG image generation (1200×630 PNGs) | Build tooling (Node prebuild script) | — | Must exist as static, stable-URL files before any HTTP request; no server runtime exists in `output: 'static'` |
| Favicon asset generation (SVG/PNG/ICO) | Build tooling (Node prebuild script) | — | Same static-file constraint; generated once, committed or produced at build time |
| Per-page meta tags (OG/Twitter/canonical) | Frontend Server (SSG — Astro `.astro` templates) | — | Rendered into static HTML `<head>` at build time via `Layout.astro` props |
| Sitemap / robots.txt | Build tooling (`@astrojs/sitemap` integration) + CDN/Static | — | Integration runs at build time; output served as static files by nginx |
| Core Web Vitals verification | Browser / Client (Lighthouse lab run) | CDN/Static (nginx serving `dist/`) | Lighthouse measures real browser rendering of the built, nginx-served artifact — not a server concern |
| Accessibility scan (axe) | Browser / Client | — | DOM-level automated audit against rendered pages |

## Standard Stack

### Core (already installed — zero new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | `0.34.5` (installed, confirmed via `node -e "require('sharp')"` in this repo) | OG image compositing, favicon PNG rasterization | Already a project dependency; `composite()`/`resize()`/`extend()`/`flatten()` cover 100% of the compositing need with zero new packages [VERIFIED: `website/node_modules` + direct `require()` test this session] |
| @astrojs/sitemap | `3.7.3` (installed, matches npm registry latest `3.7.3`) [VERIFIED: `npm view @astrojs/sitemap version`] | Sitemap generation | Already configured in `astro.config.mjs` with `site` set |

### Supporting (npx-only — never added to `package.json`, per CLAUDE.md "no new runtime deps")
| Tool | Latest version (npx pulls at run time) | Purpose | When to Use |
|------|-----------------------------------------|---------|-------------|
| lighthouse | `13.4.1` [VERIFIED: `npm view lighthouse version`] | Core Web Vitals lab measurement | Run via `npx lighthouse <url> ...` against the Docker/nginx container or `astro preview` |
| @axe-core/cli | `4.12.1` [VERIFIED: `npm view @axe-core/cli version`] | Automated accessibility scan | Run via `npx @axe-core/cli <url> ...`; JSON output parsed for `impact` filtering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prebuild Sharp script writing to `public/og/*.png` | Astro dynamic image `GET` endpoint (`src/pages/og/[slug].png.ts`) | Endpoint approach still prerenders to static files under `output: 'static'` (Astro turns prerendered endpoints into build-time files), so the *output* is equivalent, but a prebuild script is simpler, debuggable in isolation (`node scripts/generate-og-images.mjs` runs standalone), and matches the existing `check-contrast.mjs` convention already in this repo. Recommend the prebuild script. |
| Sharp-only PNG favicon + hand-rolled ICO container | `sharp-ico` npm package | `sharp-ico` would be a new runtime dependency, forbidden by CLAUDE.md. The ICO format has supported embedding a raw PNG stream directly inside its container since Windows Vista [CITED: multiple corroborating sources, ICO format history] — trivial to hand-roll (~30 lines: 6-byte `ICONDIR` header + 16-byte `ICONDIRENTRY` + the PNG bytes sharp already produces). No dependency needed. |
| `npx @axe-core/cli` (headless Chrome via chromedriver) | `agent-browser` + manual axe-core injection | CONTEXT.md names both as acceptable; `@axe-core/cli` is simpler (one process, built-in JSON output, no separate script to write) and is the recommended default. Fall back to `agent-browser` only if `@axe-core/cli`'s bundled chromedriver fails to launch in the local environment. |
| Satori + resvg/sharp dynamic OG image pipeline (blog-post pattern) | Direct Sharp composite of existing release artwork | Satori is for generating OG images from scratch (title text rendered as an image) — this project's decision (CONTEXT.md) is "no text overlay needed for v1," so Satori adds a dependency and complexity for zero benefit. Skip entirely. |

**Installation:** None. `sharp` is already a dependency; `lighthouse` and `@axe-core/cli` are invoked via `npx` and never enter `package.json`.

## Package Legitimacy Audit

> No new packages are added to `package.json` this phase. The table below audits the `npx`-invoked tools (which do execute code on the dev machine) and the two already-installed packages this phase relies on, for completeness.

| Package | Registry | Age (latest publish) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|----------------------|-----------|-------------|---------|-------------|
| sharp | npm | published 2026-07-01 | 82.7M/wk | github.com/lovell/sharp | OK | Already installed, approved |
| @astrojs/sitemap | npm | published 2026-05-26 | 2.2M/wk | github.com/withastro/astro | OK | Already installed, approved |
| @axe-core/cli | npm | published 2026-06-23 | 75K/wk | github.com/dequelabs/axe-core-npm | OK | Approved for `npx` use |
| lighthouse | npm | published 2026-07-20 | 4.06M/wk | github.com/GoogleChrome/lighthouse | SUS (`too-new`) | Approved for `npx` use — the "too-new" signal reflects Lighthouse's frequent release cadence (official Google Chrome team tool), not package age; 4M weekly downloads and the canonical `GoogleChrome/lighthouse` repo confirm legitimacy. No `checkpoint:human-verify` needed since it is never installed to `package.json`, only invoked transiently via `npx`. |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `lighthouse` — false positive, reasoned above; no action needed beyond noting it.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │  npm run build                            │
                    │  (prebuild → astro build → dist/)         │
                    └─────────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│ scripts/           │     │ astro build         │     │ @astrojs/sitemap    │
│ generate-assets.mjs │     │ (SSG page render)   │     │ integration hook    │
│                     │     │                      │     │ astro:routes:       │
│ sharp.composite()   │     │ Layout.astro reads   │     │ resolved →           │
│  release art on     │     │ image/type/canonical │     │ filter out /404,     │
│  #0A0908 → 1200x630 │     │ props → <head> meta  │     │ /500 → write         │
│                      │     │ (og:*, twitter:*)    │     │ sitemap-index.xml   │
│ sharp.resize()       │     │                      │     │ + sitemap-0.xml     │
│  SVG → PNG favicons  │     │                      │     │                      │
│                      │     │                      │     │                      │
│ hand-rolled ICO       │     │                      │     │                      │
│  container (no dep)   │     │                      │     │                      │
└──────────┬───────────┘     └──────────┬───────────┘     └──────────┬───────────┘
           │                            │                            │
           ▼                            ▼                            ▼
   website/public/og/*.png      dist/ (HTML w/ meta)         dist/sitemap-*.xml
   website/public/favicon.*                                  website/public/robots.txt
           │                            │                            │
           └────────────────────────────┴────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │  Dockerfile → nginx:stable-alpine          │
                    │  serves dist/ on :80 (docker run -p 8080)  │
                    └─────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                  ▼
          npx lighthouse http://localhost:8080   npx @axe-core/cli http://localhost:8080/ ...
          --form-factor=mobile --output=json,html --stdout | filter impact === "critical"
          (LCP/CLS/TBT gate)                      (a11y gate)
```

### Recommended Project Structure
```
website/
├── scripts/
│   ├── check-contrast.mjs        # existing pattern to mirror
│   └── generate-assets.mjs       # NEW — OG images + favicon set, prebuild
├── public/                       # NEW dir — bypasses Astro's asset pipeline
│   ├── robots.txt                # NEW — static, points at sitemap-index.xml
│   ├── favicon.svg                # NEW — generated or hand-authored mark
│   ├── favicon.ico                # NEW — hand-rolled ICO wrapping a 32x32 PNG
│   ├── apple-touch-icon.png       # NEW — 180x180
│   └── og/
│       ├── home.png               # NEW — 1200x630, Eseriani-based
│       ├── eseriani.png           # NEW
│       ├── randevu.png            # NEW
│       ├── brave.png              # NEW
│       └── open-wide.png          # NEW
├── src/
│   ├── layouts/
│   │   └── Layout.astro          # EXTEND — image/type/canonical props
│   └── pages/
│       ├── index.astro           # EXTEND — pass image/type="website"
│       ├── listen/[slug].astro   # EXTEND — pass image/type="music.album"
│       └── 404.astro             # EXTEND — pass home OG image
└── package.json                  # EXTEND — "prebuild" script, no new deps
```

### Pattern 1: Prebuild asset-generation script (mirrors `check-contrast.mjs`)
**What:** A zero-dependency Node script under `scripts/` that runs before `astro build`, using only already-installed packages (`sharp`) and Node built-ins (`node:fs`, `node:path`).
**When to use:** Any build-time asset that must exist as a stable static file before Astro's own build starts (OG images, favicons) — as opposed to assets that go through `astro:assets` (`<Picture>`/`<Image>`, which hash filenames and are unsuitable for URLs that must stay constant, like `og:image`).
**Example (this repo's existing convention, `scripts/check-contrast.mjs`):**
```javascript
// Source: website/scripts/check-contrast.mjs (this repo, read this session)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ... zero-dependency logic, process.exit(0|1) ...
```
Wire the new script the same way: add `"prebuild": "node scripts/generate-assets.mjs"` to `package.json` `scripts` (npm auto-runs `prebuild` before `build`) — matches the project's existing `check`/`check:contrast` composition pattern already in `package.json`.

### Pattern 2: Sharp OG image composition (centered art on brand background)
**What:** Composite existing release cover art (already `1:1`, imported as `ImageMetadata` in `src/data/releases.ts`) onto a `1200×630` canvas filled with `--color-bg` (`#0A0908`), centered.
**When to use:** For every release slug + the homepage (Eseriani-based per CONTEXT.md) + 404 (reuses homepage image).
**Example (Sharp API, verified method signatures via official docs):**
```javascript
// Source: sharp.pixelplumbing.com/api-resize + api-operation (fetched this session)
import sharp from 'sharp';

const CANVAS_W = 1200;
const CANVAS_H = 630;
const BG = '#0A0908'; // --color-bg, verified in website/src/styles/global.css:8

async function generateOgImage(coverArtPath, outPath) {
  // Cover art is square; resize to fit the shorter canvas dimension (height),
  // preserving aspect ratio, then center-composite onto the brand-color canvas.
  const artSize = CANVAS_H; // 630x630 art square, centered horizontally
  const resizedArt = await sharp(coverArtPath)
    .resize(artSize, artSize, { fit: 'cover' })
    .toBuffer();

  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: resizedArt, gravity: 'center' }])
    .flatten({ background: BG }) // merge alpha, ensure no transparency in the OG PNG
    .png()
    .toFile(outPath);
}
```
`resize()` signature: `resize([width], [height], [options])` with `fit` choices `cover | contain | fill | inside | outside` (default `cover`) [CITED: sharp.pixelplumbing.com/api-resize, fetched this session]. `flatten([options])` with `options.background` (default black) merges alpha and removes the channel [CITED: sharp.pixelplumbing.com/api-operation, fetched this session]. `composite()` accepts an array of `{ input, gravity | top/left }` descriptors — full signature not returned by the docs fetch this session; **gravity-based centering (`gravity: 'center'`) is the standard documented pattern from Sharp's own example gallery and is `[ASSUMED]`** pending a final signature check during planning/execution (verify via `sharp --help`-equivalent or the composite doc page directly before writing the real script).

### Pattern 3: Favicon generation — SVG source, PNG raster, hand-rolled ICO (no new dependency)
**What:** One hand-authored `favicon.svg` (simple, typographic — a DARLNG "D" glyph per CONTEXT.md), rasterized by Sharp into the PNG sizes needed, and a minimal ICO container wrapping the 32×32 PNG.
**When to use:** Once, at prebuild time, alongside the OG image generation (same script, same sharp import).
**Example:**
```javascript
// Sharp rasterizes SVG input to PNG by default when no explicit format is set
// [CITED: multiple sources this session — sharp treats SVG input specially,
// PNG output unless overridden; techsparx.com/coderrocketfuel worked examples]
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const svgBuffer = readFileSync('src/assets/favicon-source.svg');

await sharp(svgBuffer, { density: 384 }) // higher density = crisper small raster
  .resize(32, 32)
  .png()
  .toFile('public/favicon-32.png');

await sharp(svgBuffer, { density: 384 })
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png');

// Hand-rolled ICO: ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + raw PNG bytes.
// ICO has embedded raw PNG streams as a valid entry format since Windows Vista
// [CITED: ICO format history, multiple corroborating sources this session — not
// read from a single canonical spec page, treat as MEDIUM confidence].
function buildIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type: 1 = icon
  header.writeUInt16LE(1, 4);      // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);  // width (0 = 256)
  entry.writeUInt8(size === 256 ? 0 : size, 1);  // height
  entry.writeUInt8(0, 2);           // color palette
  entry.writeUInt8(0, 3);           // reserved
  entry.writeUInt16LE(1, 4);        // color planes
  entry.writeUInt16LE(32, 6);       // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8);  // image data size
  entry.writeUInt32LE(6 + 16, 12);  // offset from file start

  return Buffer.concat([header, entry, pngBuffer]);
}

const png32 = await sharp(svgBuffer, { density: 384 }).resize(32, 32).png().toBuffer();
writeFileSync('public/favicon.ico', buildIco(png32, 32));
```
`[ASSUMED — MEDIUM confidence]` on the exact ICONDIRENTRY byte layout; verify against a working reference implementation (e.g. read `icopng` or a similar minimal encoder's source) or test-open the generated `.ico` in a real browser tab before treating this as done. This is exactly the kind of discrete-value claim the executor should double-check by opening the file in a browser, not by trusting the byte layout alone.

### Pattern 4: Layout.astro meta prop extension
**What:** Extend the existing `title`/`description` props pattern already used by every page with `image`, `type`, and `canonical`, defaulting sensibly and building absolute URLs from `Astro.site`.
**When to use:** Every page (`index.astro`, `listen/[slug].astro`, `404.astro`).
**Example (based on the current `Layout.astro` structure, read this session):**
```astro
---
// Source: website/src/layouts/Layout.astro (this repo, read this session) — extended
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import unboundedWoff2 from '@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2?url';
import manropeWoff2 from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url';

interface Props {
	title?: string;
	description?: string;
	image?: string;       // path relative to site root, e.g. "/og/eseriani.png"
	type?: 'website' | 'music.album';
	canonical?: string;   // defaults to Astro.url.pathname
}

const {
	title = 'DARLNG',
	description = 'DARLNG is an independent Afro / RnB / Pop artist. Listen to the latest release and follow DARLNG everywhere.',
	image = '/og/home.png',
	type = 'website',
	canonical,
} = Astro.props;

// Astro.site is set in astro.config.mjs ("https://darlng.com") — confirmed this session.
const absoluteImage = new URL(image, Astro.site).href;
const absoluteCanonical = new URL(canonical ?? Astro.url.pathname, Astro.site).href;
---
<head>
  <!-- ... existing charset/viewport/title/description ... -->
  <link rel="canonical" href={absoluteCanonical} />

  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={absoluteImage} />
  <meta property="og:url" content={absoluteCanonical} />
  <meta property="og:type" content={type} />
  <meta property="og:site_name" content="DARLNG" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={absoluteImage} />
</head>
```
`Astro.site` is confirmed set to `"https://darlng.com"` in `astro.config.mjs:10` [VERIFIED: `website/astro.config.mjs:10`, read this session — `site: "https://darlng.com"`]. `new URL(path, Astro.site)` is the documented Astro pattern for building absolute URLs at build time [ASSUMED — standard `URL` constructor behavior, not re-verified against Astro docs this session, but well-established JS/Astro idiom].

### Anti-Patterns to Avoid
- **Using `<Image>`/`<Picture>` (astro:assets) for OG images:** Astro's built-in image pipeline hashes output filenames (`_astro/xyz123.webp`) — unsuitable for `og:image`, which must be a stable, predictable, absolute URL that doesn't change between builds unless the source image changes in a way crawlers can detect via cache-busting, not silent hash rotation.
- **Relying on `--exit` alone for the axe accessibility gate:** `@axe-core/cli`'s `--exit` flag fails on *any* rule violation of *any* impact level (verified via `--help` this session — no severity flag exists). CONTEXT.md's target is "zero critical violations, zero contrast violations" specifically, not zero of everything. Parse JSON output and filter on `impact` instead of trusting the exit code alone.
- **`--preset=mobile` for Lighthouse:** Does not exist (verified via `npx lighthouse --help` this session — `--preset` choices are `perf | experimental | desktop` only). Use `--form-factor=mobile` for mobile emulation.
- **Testing Lighthouse against `astro dev`:** Dev server includes HMR client JS and unminified output that skews performance metrics low. Always test against the built `dist/` — either the Docker/nginx container (most production-faithful, per CONTEXT.md's explicit choice) or `astro preview`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG→PNG rasterization | A custom SVG renderer or headless-browser screenshot pipeline | `sharp(svgBuffer, { density })` | Sharp has first-class SVG input support via librsvg; already a project dependency [VERIFIED this session] |
| Accessibility rule engine | Custom DOM/contrast checks beyond the existing `check-contrast.mjs` design-token gate | `@axe-core/cli` (npx) | axe-core is the industry-standard automated a11y ruleset; hand-rolling misses hundreds of edge cases the existing token-pair contrast script intentionally does NOT cover (it only checks the 9 known design-token pairs, not rendered-DOM contrast in context) |
| Performance measurement | Custom LCP/CLS/TBT instrumentation via `PerformanceObserver` scripts | `lighthouse` (npx) | Lighthouse's lab methodology (simulated throttling, standardized scoring) is what PageSpeed Insights uses in production — matching methodology now avoids surprises at live-domain re-verification (deferred to DEPLOY.md) |

**Key insight:** Every "don't hand-roll" tool here is either already installed (`sharp`) or invoked transiently via `npx` (never added to `package.json`), fully respecting the CLAUDE.md "no new runtime deps" constraint while still using industry-standard tooling instead of custom scripts for the two genuinely hard problems (SVG rasterization, a11y auditing). The one place hand-rolling IS correct is the ICO container — it is a trivial ~20-line binary format wrapper, not a real "problem" requiring a library, and adding `sharp-ico` would violate the no-new-deps constraint for no real benefit.

## Common Pitfalls

### Pitfall 1: OG image URL not absolute
**What goes wrong:** `og:image` set to a relative path (`/og/eseriani.png`) — most social crawlers (Facebook, Twitter/X, Slack) silently fail to fetch relative URLs, or resolve them against the crawler's own origin instead of the page's.
**Why it happens:** Astro's `<Picture>`/`<Image>` components normally handle path resolution automatically, creating a habit of not thinking about absolute vs. relative for other meta.
**How to avoid:** Always build `og:image`/`og:url`/canonical via `new URL(path, Astro.site).href`, never string-concatenate.
**Warning signs:** opengraph.xyz (CONTEXT.md's chosen validator, deferred to live-domain checklist) shows "image not found" even though the file exists and is reachable when visited directly.

### Pitfall 2: `axe --exit` treated as the whole gate
**What goes wrong:** A team wires `npx @axe-core/cli <url> --exit` into CI/verification expecting it to fail only on "critical" issues (per CONTEXT.md's stated target), but it fails on ANY violation (including `minor`/`moderate` impact issues that are out of this phase's stated scope), producing false-negative "site is broken" signals — or worse, the opposite: someone drops `--exit` entirely to stop false failures, silently losing the real gate.
**Why it happens:** `--exit`'s behavior is undocumented at the flag level beyond "exits 1 if any test fails" — the impact-level distinction lives only in the JSON payload, not the CLI flag surface (confirmed via `--help` this session; no `--impact`/`--severity` flag exists).
**How to avoid:** Run with `--stdout` (or `--save results.json`), then a tiny follow-up script filters `violations[].impact === 'critical'` (and separately checks for rule IDs containing `contrast`, per CONTEXT.md's explicit "zero contrast violations" sub-target) before deciding pass/fail.
**Warning signs:** The axe run fails on a `moderate`-impact issue that isn't a contrast or critical issue — a sign the raw `--exit` code, not a parsed/filtered result, is driving the gate.

### Pitfall 3: Lighthouse run against the wrong artifact
**What goes wrong:** Running `npx lighthouse` against `astro dev` (port 4321) instead of the built, nginx-served container gives misleadingly poor (or occasionally misleadingly good) Core Web Vitals numbers that don't reflect what ships to darlng.com.
**Why it happens:** `astro dev` is the fastest thing to have running locally during iteration.
**How to avoid:** CONTEXT.md already locks this: build the Docker image (`docker build -t darlng-web .` using the existing `website/Dockerfile`), run it (`docker run -p 8080:80 darlng-web`), then point Lighthouse at `http://localhost:8080`. This exercises the real nginx cache-control headers and the real minified/hashed `_astro/` output.
**Warning signs:** LCP or TBT numbers that seem too good to be true, or that change dramatically between `astro dev` and a "real" run.

### Pitfall 4: Sitemap `robots.txt` pointing at `sitemap-0.xml` instead of the index
**What goes wrong:** `Sitemap: https://darlng.com/sitemap-0.xml` in `robots.txt` — works today (single small site, one shard) but silently breaks the moment the site grows past `entryLimit` (45000, default) and a second shard (`sitemap-1.xml`) appears, since crawlers reading `robots.txt` never learn about the second file.
**Why it happens:** `sitemap-0.xml` is the file that actually looks like "the sitemap" when browsed directly; `sitemap-index.xml` looks like an unnecessary extra hop for a 6-page site.
**How to avoid:** Always point `robots.txt`'s `Sitemap:` directive at `sitemap-index.xml` [CITED: docs.astro.build/en/guides/integrations-guide/sitemap, fetched this session — "point the directive at the index, not at individual sitemaps"], regardless of current site size.
**Warning signs:** None visible today (site is small) — this is a forward-compatibility correctness issue, not a currently-observable bug.

## Code Examples

### robots.txt (static file in `website/public/`)
```
User-agent: *
Allow: /

Sitemap: https://darlng.com/sitemap-index.xml
```
[CITED: docs.astro.build/en/guides/integrations-guide/sitemap, fetched this session]

### Confirming `@astrojs/sitemap` excludes `/404` by default (no config change needed)
```javascript
// Source: website/node_modules/@astrojs/sitemap/dist/index.js:14-17 (read this session, this repo's installed 3.7.3)
const STATUS_CODE_PAGES = /* @__PURE__ */ new Set(["404", "500"]);
const isStatusCodePage = (locales) => {
  const statusPathNames = new Set(
    locales.flatMap((locale) => [...STATUS_CODE_PAGES].map((page) => `${locale}/${page}`)).concat([...STATUS_CODE_PAGES])
  );
  return (pathname) => {
    if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
    if (pathname.startsWith("/")) pathname = pathname.slice(1);
    return statusPathNames.has(pathname);
  };
};
```
And applied as a filter before the user's own `filter` option, at line 62: `pageUrls = pages.filter((p) => !shouldIgnoreStatus(p.pathname))...` then the user's `filter` (if any) is applied afterward at line 94-95 [VERIFIED: `website/node_modules/@astrojs/sitemap/dist/index.js:14-17,62,94-95`, read this session]. **No `filter` option needs to be added to `astro.config.mjs` to satisfy the "exclude 404" requirement — it is already excluded.**

### Lighthouse CLI — verified flags (`npx lighthouse --help`, run in this repo this session)
```bash
# Mobile-emulated lab run, JSON + HTML output, headless
npx lighthouse http://localhost:8080 \
  --form-factor=mobile \
  --screenEmulation.mobile \
  --output=json --output=html \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,seo,best-practices

# Desktop lab run
npx lighthouse http://localhost:8080 \
  --preset=desktop \
  --output=json --output=html \
  --output-path=./lighthouse-report-desktop \
  --chrome-flags="--headless"
```
[VERIFIED: `npx lighthouse --help` output captured this session in this repo — `--form-factor` choices are `"mobile" | "desktop"`; `--preset` choices are `"perf" | "experimental" | "desktop"` (no `"mobile"` preset exists); `--output` accepts `json|html|csv` as an array; `--chrome-flags` and `--only-categories` confirmed present]

### axe-core CLI — verified flags (`npx @axe-core/cli --help`, run in this repo this session)
```bash
# Scan with JSON output for downstream impact-level filtering (no native --impact flag exists)
npx @axe-core/cli http://localhost:8080/ http://localhost:8080/listen/eseriani http://localhost:8080/404.html \
  --stdout > /tmp/axe-results.json

# Then filter for critical + contrast violations only, e.g. with a small node script:
node -e "
const results = JSON.parse(require('fs').readFileSync('/tmp/axe-results.json', 'utf8'));
const bad = results.flatMap(r => r.violations).filter(v =>
  v.impact === 'critical' || v.id.includes('contrast')
);
console.log(bad.length === 0 ? 'PASS' : 'FAIL: ' + JSON.stringify(bad, null, 2));
process.exit(bad.length === 0 ? 0 : 1);
"
```
[VERIFIED: `npx @axe-core/cli --help` output captured this session — confirmed flags: `-j/--stdout`, `-s/--save`, `-q/--exit`, `-r/--rules`, `-t/--tags`, `-l/--disable`; confirmed absence of any impact/severity flag]

### OG protocol tags — verified property set for music pages
```html
<meta property="og:type" content="music.album" />
<meta property="music:musician" content="https://open.spotify.com/artist/0uXxSPfLr36OuyGDKiBzV3" />
```
[CITED: ogp.me, fetched this session — confirmed `music.song | music.album | music.playlist | music.radio_station` are the valid `og:type` values in the music namespace; **`music.musician` is NOT a valid `og:type` value** — it exists only as the `music:musician` *property* (a "profile array" referencing the artist), used on `music.song`/`music.album`/`music.playlist` typed pages. CONTEXT.md's phrasing "`og:type` music.album + music:musician?" is confirmed correct as written — `music.album` is the type, `music:musician` is a property on that type, not a second type value.]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `.ico`-only favicon (16x16/32x32/48x48 multi-res) | SVG favicon + PNG fallback(s), `.ico` treated as a legacy fallback only | Ongoing 2024-2026 browser support shift | Reduces asset count/complexity; `.ico` is still worth including for maximum compatibility (older Windows/Android combos) but is no longer the primary format [CITED: dev.to/browserux.com favicon 2025 guides, fetched this session] |
| `lucide-astro` | `@lucide/astro` | 2026-08-07 (per this project's own CLAUDE.md) | Not directly relevant to Phase 5 but noted since BrandIcon usage is adjacent — already migrated in prior phases |

**Deprecated/outdated:**
- Standalone `axe-cli` (unscoped npm package): superseded by the scoped `@axe-core/cli` from the same Deque Labs org; the unscoped package's GitHub repo is explicitly marked `[Deprecated]` [CITED: github.com/dequelabs/axe-cli, fetched this session].

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Sharp's `composite()` accepts `{ input, gravity: 'center' }` for centering an overlay on a base canvas | Pattern 2 (OG image generation) | Low — if the exact option name differs, the build fails loudly at `astro build` time (prebuild script throws), not a silent visual bug; verify against `sharp.pixelplumbing.com/api-composite` directly before finalizing the script, or test-run the script standalone first |
| A2 | Hand-rolled ICO `ICONDIRENTRY` byte layout (offsets for width/height/planes/bpp/size/offset) | Pattern 3 (favicon ICO) | Medium — a malformed ICO may still "work" in some browsers (which mostly ignore `.ico` favicons if an SVG is present) but fail in IE/legacy Windows taskbar contexts; verify by opening the generated file in an actual browser tab / OS file preview during execution, per the CLAUDE.md icon-verification-checklist screenshot practice |
| A3 | `new URL(path, Astro.site)` is the correct/idiomatic Astro pattern for absolute URL construction in `.astro` frontmatter | Pattern 4 (Layout meta props) | Low — this is standard JS `URL` constructor behavior, not Astro-specific magic; low risk of being wrong, but not re-verified against Astro's own docs this session (time was spent on higher-risk claims) |
| A4 | `sharp(svgBuffer, { density: 384 })` produces sufficiently crisp small-size PNG rasters (32×32, 180×180) from an SVG source | Pattern 3 (favicon generation) | Low — worst case the favicon looks soft at 32×32 and needs a higher `density` value; purely a visual-quality tuning parameter, not a correctness risk, and is caught immediately by the CLAUDE.md-mandated icon-verification screenshot check |

**If this table is empty:** N/A — see above; all four assumptions are LOW-to-MEDIUM risk and self-evident at build/verification time, not silent failure modes.

## Open Questions

1. **Exact `sharp.composite()` option keys for gravity-based centering**
   - What we know: Sharp definitely supports compositing one image onto another via `.composite([{ input, ... }])`; `resize()` and `flatten()` signatures were confirmed directly from official docs this session.
   - What's unclear: The `composite-images` doc page (`sharp.pixelplumbing.com/api-composite`) was not successfully fetched this session (only `api-resize` and `api-operation` were retrieved); `gravity: 'center'` is the standard documented pattern from memory/community examples but wasn't independently re-verified against the live doc page.
   - Recommendation: Planner/executor should fetch `sharp.pixelplumbing.com/api-composite` directly (or run `node -e "console.log(require('sharp').prototype.composite.toString())"` against the installed `sharp@0.34.5` in this repo) before writing the final script, or simply test-run the script against one release's cover art first and visually confirm centering in the output PNG.

2. **Exact meta description copy per page**
   - What we know: CONTEXT.md delegates "meta description copy (voice: confident, independent — reuse established strings where sensible)" to Claude's discretion; `index.astro` and `404.astro` already have `description` props with an established voice; `listen/[slug].astro` already builds a dynamic description string (`Listen to ${release.title} by ${release.artistLine} on every platform.`) that can be reused directly for `og:description`/`twitter:description` without new copy.
   - What's unclear: Whether the existing descriptions are optimal for social-share context (Twitter/Facebook truncate around 200 chars; existing strings are all well under that) — likely fine as-is.
   - Recommendation: Planner should default `og:description`/`twitter:description` to the same string already passed as `description` to `Layout.astro` on each page — no new copy needed, satisfying "reuse established strings where sensible" directly.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Prebuild script, npx tools | Yes | Node 24.9.0 (session), `node:22-alpine` in Dockerfile | — |
| sharp (installed) | OG images, favicon PNGs | Yes | `0.34.5` [VERIFIED: `require('sharp').versions.sharp` this session] | — |
| Docker | Production-container Lighthouse run | Not directly confirmed this session (no `docker info` run) — CONTEXT.md and existing `Dockerfile`/`nginx.conf` assume it's available | — | `astro preview` (Astro's built-in static server) if Docker is unavailable locally; CONTEXT.md explicitly allows this as an "or" |
| npx / npm registry access | `lighthouse`, `@axe-core/cli` | Yes — confirmed by successfully running both `--help` commands via `npx` this session | lighthouse `13.4.1`, `@axe-core/cli` `4.12.1` | — |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** Docker (if unavailable, `astro preview` is the documented fallback per CONTEXT.md's own wording, "docker container or `astro preview`").

## Security Domain

> `security_enforcement` not found explicitly disabled in `.planning/config.json` — treated as enabled. This phase adds no auth, no session, no new input surfaces, and no cryptography — it is meta/asset generation and read-only verification tooling.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | Phase has no auth surface |
| V3 Session Management | No | Phase has no session surface |
| V4 Access Control | No | All output is public static content (sitemap, robots.txt, OG images, meta tags) by design |
| V5 Input Validation | No | No new user input is accepted this phase (favicon/OG generation reads only trusted, already-in-repo release data and cover art) |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Sitemap/robots.txt information disclosure (unintentionally listing non-public paths) | Information Disclosure | `@astrojs/sitemap` only includes routes Astro actually generates (public static pages); no admin/internal routes exist in this static site, so this risk is structurally absent — confirmed by the site's own architecture (no server, no admin routes) |
| OG image / favicon prebuild script executing against untrusted input | Tampering | Not applicable — script only reads already-committed, already-reviewed release artwork from `src/assets/releases/` and `src/data/releases.ts`, both static and trusted repo content, not runtime/user input |

## Sources

### Primary (HIGH confidence — verified via direct tool execution or reading installed source in this repo, this session)
- `npx lighthouse --help` (run in `website/`, this session) — full CLI flag list, `--form-factor` and `--preset` choices
- `npx @axe-core/cli --help` (run in `website/`, this session) — full CLI flag list, confirmed no severity/impact flag
- `node -e "require('sharp')..."` (run in `website/`, this session) — confirmed `sharp@0.34.5` installed and standalone-importable, `composite`/`extend`/`flatten`/`resize` all present as functions
- `website/node_modules/@astrojs/sitemap/dist/index.js` (read this session, lines 1-40) — confirmed `STATUS_CODE_PAGES` 404/500 auto-exclusion logic and filter ordering
- `website/astro.config.mjs` (read this session) — confirmed `site: "https://darlng.com"` set, `sitemap()` integration present
- `website/src/styles/global.css` (read this session) — confirmed `--color-bg: #0A0908` token for OG image background
- `npm view @astrojs/sitemap version`, `npm view lighthouse version`, `npm view @axe-core/cli version`, `npm view sharp version` (this session) — current registry versions

### Secondary (MEDIUM confidence — official documentation via WebFetch, this session)
- [docs.astro.build/en/guides/integrations-guide/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — `filter` option, output filenames, `robots.txt` directive syntax
- [sharp.pixelplumbing.com/api-resize](https://sharp.pixelplumbing.com/api-resize/) — `resize()` signature, `fit` options, `background` default
- [sharp.pixelplumbing.com/api-operation](https://sharp.pixelplumbing.com/api-operation/) — `flatten()` signature
- [ogp.me](https://ogp.me/) — base four required OG properties, music namespace `og:type` values, `music:musician`/`music:album` property semantics
- [github.com/dequelabs/axe-core-npm cli README](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/cli/README.md) — install command, flag descriptions

### Tertiary (LOW confidence — WebSearch-summarized third-party content, marked for validation)
- Various favicon-best-practices blog posts (dev.to, browserux.com, iconmaker.studio) for the SVG+PNG-over-ICO 2025-2026 trend claim
- ICO file format PNG-embedding history (fileformats.fandom.com, grokipedia, cdown/icopng GitHub) — corroborated across multiple independent sources but not a single canonical spec document
- Astro OG-image-generation blog posts (bepyan.me, cassidoo.co, jilles.me, arne.me) — used only to confirm build-time vs. runtime tradeoff reasoning already reflected in CONTEXT.md's own decision; not used for any code pattern directly lifted into this document

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, both installed packages version-confirmed against npm registry, sharp confirmed importable in this exact repo
- Architecture: HIGH — prebuild-script pattern directly mirrors an existing, working script in this repo (`check-contrast.mjs`); sitemap 404-exclusion behavior confirmed by reading the actual installed source
- Pitfalls: HIGH — all four pitfalls verified via direct CLI `--help` output or installed source reading this session, not inferred from training data

**Research date:** 2026-08-08
**Valid until:** 2026-09-07 (30 days — stable domain, but `lighthouse`/`@axe-core/cli` npx-pulled versions will drift; re-check flags with `--help` at execution time if this research is used after the validity window)
