---
phase: 05-seo-launch-polish
plan: 01
subsystem: seo
tags: [astro, sharp, open-graph, twitter-card, social-cards, meta]

# Dependency graph
requires:
  - phase: 03-core-fan-experience
    provides: "Layout.astro, index.astro, listen/[slug].astro, 404.astro, and releases.ts release/social data model"
provides:
  - "website/scripts/generate-assets.mjs — zero-dependency Sharp prebuild generator producing five deterministic 1200x630 social cards"
  - "npm prebuild lifecycle hook wiring the generator into `npm run build` automatically"
  - "Layout.astro image/type/canonical/musician/noindex props and full absolute-URL Open Graph + Twitter Card head block"
  - "Per-page OG wiring on all six built pages: home, four listen pages (music.album), 404 (noindex, reused home card)"
affects: [05-02, 05-03]

actuals:
  tokens: 2700
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Zero-dependency scripts/*.mjs convention (ESM, node: builtins, fileURLToPath path resolution) extended to a Sharp-based image generator"
    - "Absolute URL construction via `new URL(path, Astro.site).href` — never string concatenation — for every OG/Twitter/canonical value"
    - "public/ (not astro:assets) for build-output images whose URL must stay stable across rebuilds"

key-files:
  created:
    - website/scripts/generate-assets.mjs
  modified:
    - website/package.json
    - website/.gitignore
    - website/src/layouts/Layout.astro
    - website/src/pages/index.astro
    - website/src/pages/listen/[slug].astro
    - website/src/pages/404.astro

key-decisions:
  - "Home card sourced independently from Eseriani artwork (its own generator entry) so the home card URL never changes when a future release becomes latest"
  - "Release slugs and source filenames transcribed as literals in generate-assets.mjs (not imported from releases.ts) to keep the script pure ESM with no build-tooling dependency, with a comment tying it back to releases.ts"
  - "Slug validated against a strict lowercase-alphanumeric-and-hyphen pattern before path composition, closing off any path-escape vector even though slugs are currently repo-owned literals"
  - "music:musician pulled from the existing socials array's spotify entry rather than a second copy of the literal URL"

patterns-established:
  - "OG/Twitter meta block ordering in Layout.astro: canonical/robots -> og: core -> og:image dimensions/alt -> og:url/type/site_name -> music:musician (conditional) -> twitter: block -> font preloads"

requirements-completed: [SEO-01]

coverage:
  - id: D1
    description: "npm run build alone (via prebuild hook) produces five 1200x630 Sharp-composited social cards under public/og/ and dist/og/"
    requirement: SEO-01
    verification:
      - kind: automated_ui
        ref: "clean-tree npm run build; sharp metadata check on all five dist/og/*.png"
        status: pass
    human_judgment: false
  - id: D2
    description: "All six built pages carry a complete, absolute-URL Open Graph + Twitter Card head block with no empty/unresolved content attributes"
    requirement: SEO-01
    verification:
      - kind: automated_ui
        ref: "node script assertions over dist/{index,404,listen/*/index}.html"
        status: pass
      - kind: automated_ui
        ref: "agent-browser document.head reads on preview server for all six pages"
        status: pass
    human_judgment: false
  - id: D3
    description: "Listen pages declare og:type=music.album with music:musician; 404 is noindex with no canonical and reuses the home card"
    requirement: SEO-01
    verification:
      - kind: automated_ui
        ref: "node script assertions + agent-browser DOM read on /listen/randevu/ (og:type, music:musician, exact og:description string match)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Card generation is deterministic across rebuilds — byte-identical PNG checksums and og: head blocks on two consecutive clean builds"
    requirement: SEO-01
    verification:
      - kind: automated_ui
        ref: "sha256 diff of dist/og/*.png and sorted og: meta diff across two clean `npm run build` runs"
        status: pass
    human_judgment: false
  - id: D5
    description: "Card URLs resolve over real HTTP (200, PNG, >20KB) and the composited artwork is centered on the brand background, confirmed visually"
    verification:
      - kind: automated_ui
        ref: "curl against astro preview for all five /og/*.png; five 1200x630 screenshots captured to /tmp/darlng-phase5/og-*.png"
        status: pass
    human_judgment: true
    rationale: "Visual composition correctness (art centered, right release, on-brand background) benefits from a human glance at the captured screenshots even though the automated checks (dimensions, HTTP status, byte size) already passed"

duration: 35min
completed: 2026-08-09
status: complete
---

# Phase 5 Plan 1: Social Cards & Open Graph Meta Summary

**Build-time Sharp generator composites each release's artwork onto a 1200x630 brand-canvas PNG, wired via an npm `prebuild` hook, and `Layout.astro` gained a full absolute-URL Open Graph + Twitter Card head block consumed by all six built pages.**

## Performance

- **Duration:** 35 min
- **Tasks:** 3/3 complete (Task 1 tracer, Task 2 expansion, Task 3 verification-only)
- **Commits:** 2 (Task 3 required zero code changes)

## Accomplishments

- `website/scripts/generate-assets.mjs`: new zero-dependency ESM script mirroring the existing `check-contrast.mjs` convention. Reads each source JPEG, fails loudly if either dimension is below 630px, resizes to 630x630, composites onto a 1200x630 `#0A0908` canvas via `sharp({create...}).composite([...]).flatten({...}).png()`, and writes deterministic output to `public/og/`.
- `website/package.json`: added exactly one `prebuild` script entry (`node scripts/generate-assets.mjs`) so `npm run build` alone regenerates all five cards with zero manual steps. No dependency was added; both `4.1.16` Tailwind pins and `overrides.vite` survive byte-identical (verified by the plan's own package.json assertion).
- `website/.gitignore`: added `public/og/` — the cards are deterministic build output, not committed binaries.
- `website/src/layouts/Layout.astro`: extended `Props` with `image`, `type`, `canonical`, `musician`, `noindex`; derives absolute URLs via `new URL(value, Astro.site).href` and throws a descriptive error if `Astro.site` is unset; emits the full OG core block, `og:image` dimensions/alt, conditional `music:musician`, and the Twitter `summary_large_image` block, all through normal Astro attribute interpolation (no `set:html`).
- `website/src/pages/index.astro`: passes `image="/og/home.png"` and `type="website"`.
- `website/src/pages/listen/[slug].astro`: passes `image` per release slug, `type="music.album"`, and `musician` sourced from `socials.find(s => s.platform === 'spotify')` with a fail-loud guard if that entry is ever removed.
- `website/src/pages/404.astro`: passes `image="/og/home.png"` (reuses the home card) and `noindex`, which suppresses the canonical link and emits `<meta name="robots" content="noindex">`.

## Task Breakdown

1. **Task 1 (tracer):** homepage-only end-to-end slice — generator, prebuild hook, Layout head extension, index.astro wiring. Full `<verify>` block run and passed before expanding (tracer feedback gate).
2. **Task 2:** extended the generator with a literal, slug-validated list of the four releases; wired `listen/[slug].astro` and `404.astro`. Determinism (two consecutive clean builds, byte-identical PNG checksums and sorted `og:` head blocks) verified directly.
3. **Task 3 (verification-only):** served the built `dist/` via `astro preview`, drove all six pages through `agent-browser` reading `document.head` live, fetched all five card URLs over HTTP (200, PNG, >20KB each), captured five 1200x630 screenshots to `/tmp/darlng-phase5/og-*.png`, and confirmed `git status --porcelain website/` was clean. No source defect found; zero commits from this task.

## Verification Evidence

- `npm run build` from a clean tree (`rm -rf dist public/og`) produced all five cards automatically via the `prebuild` hook.
- `npx astro check` exits 0 (1 pre-existing unrelated hint on `YouTubeFacade.astro`, not touched by this plan).
- All five `dist/og/*.png` report exactly 1200x630 via sharp metadata.
- All six pages carry the six core `og:` properties and four `twitter:` names; every `og:image`/`og:url`/`twitter:image` value is absolute and begins `https://darlng.com/`.
- Six `og:url` values are pairwise distinct; four `/listen/*` `og:image` values are pairwise distinct.
- `/listen/*` pages: `og:type=music.album` + `music:musician`; `/` and `/404.html`: `og:type=website`.
- `/404.html`: `noindex` present, no canonical, reuses `https://darlng.com/og/home.png`. Other five pages: canonical present, no noindex.
- No page contains `content="undefined"` or `content=""`.
- Two consecutive clean builds produced identical sha256 sums for all five PNGs and identical sorted `og:` head blocks.
- Live-DOM `agent-browser` reads confirmed all of the above from the rendered page, not just the file on disk; `/listen/randevu/` `og:description` matched the exact expected string; no raw `<`/`>` found inside any meta `content` attribute across all six pages.
- All five card URLs returned HTTP 200 with PNG bodies well over 20KB (810KB-1.1MB) over the preview server.
- Five 1200x630 screenshots captured to `/tmp/darlng-phase5/`; visual inspection of `og-eseriani.png` confirmed the artwork is centered on the brand-dark canvas with correct pillarboxing.
- `git status --porcelain website/` empty after Task 3 — no generated artifact leaked into the repo.

## Deviations from Plan

None — plan executed exactly as written. Task 3 found no defects requiring a `Layout.astro` fix.

## Known Stubs

None.

## Threat Flags

None — the threat model's four mitigate-dispositioned threats (T-05-01 slug path-escape, T-05-02 unescaped attribute injection, T-05-03 og:image/url origin spoofing, T-05-SC supply-chain) were all implemented exactly as specified (slug regex validation, Astro attribute interpolation with no `set:html`, `new URL(..., Astro.site)` construction, zero new dependencies) and verified by this plan's own acceptance criteria.

## Self-Check: PASSED
