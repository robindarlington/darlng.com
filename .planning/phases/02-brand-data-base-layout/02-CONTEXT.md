# Phase 2: Brand, Data & Base Layout - Context

**Gathered:** 2026-08-06
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — decisions sourced from the user's direct answers in-session (2026-08-04) recorded in `.planning/CONTENT.md`; remaining areas explicitly delegated to Claude's discretion by the user ("you get to pick something original").

<domain>
## Phase Boundary

Establish the DARLNG visual identity and data foundation: a WCAG-AA-verified dark/moody design token system with a single swappable jewel accent, Fontsource typography, a base layout (header/nav/footer with social follow anchors) that renders responsively, and `src/data/releases.ts` — the complete typed catalog for all four releases with Sharp-processed cover art. Every later page (hero, discography, listen pages) consumes what this phase produces. No hero, no discography sections, no newsletter form yet — those are Phases 3–4.
</domain>

<decisions>
## Implementation Decisions

### Visual Identity (user-decided)
- Dark, moody, cinematic base — deep near-black background; must "pop" and read as original, not a template. Visually distinct from robindarlington.com.
- **Single jewel accent color** implemented as ONE swappable design token (e.g. `--accent` in the Tailwind 4 `@theme` block) so it can be re-tinted to match the latest release later with a one-line change. No second accent.
- Accent choice: Claude picks — user suggested it may later match the latest release (Eseriani cover art is the natural derivation source).
- Genre line: exactly "Afro / RnB / Pop".

### Typography (delegated to Claude)
- Claude picks fonts from Fontsource: a cinematic/characterful display face for headings + a clean, highly legible body face. Prefer `@fontsource-variable/*` packages where available. Fonts must be self-hosted (no Google Fonts network calls) and preloaded per PERF-01 groundwork.

### Copy Voice (user-directed)
- Artist positioning for all copy: 100% independent artist; releases music when he feels like it, no schedule; full creative freedom in collaborations and direction. Tone: confident, not corporate.
- Tagline/meta copy drafted by Claude in that voice; user vetoes in review.

### Data Model (locked pre-roadmap + content gathered)
- `src/data/releases.ts` plain typed TS file (NOT MDX content collections) — single source of truth for hero, discography, and listen pages.
- All four releases with data EXACTLY as recorded in `.planning/CONTENT.md`: Eseriani (2026, Darlng x Tobiko — latest, hero), Randevu (2024, ft. Shubi Di Badman), Brave (2020, ft. Ray Pineapple), Open Wide (2019, ft. Don Classic). Slugs: `eseriani`, `randevu`, `brave`, `open-wide`.
- Cover art copied from the user's Desktop folders (paths in CONTENT.md) into `website/src/assets/releases/`, imported as `ImageMetadata`, processed by Sharp (avif+webp+srcset at build).
- Platform links per release exactly per CONTENT.md (omit platforms a release isn't on; skip the dead Google Play link for Open Wide). Include the Eseriani YouTube embed config (video id `qltP16ukVr4`, youtube-nocookie facade — consumed in Phase 3).
- Social profile URLs per CONTENT.md (Spotify artist, Instagram, Facebook, YouTube, TikTok) — exposed via the data layer for header/footer anchors.

### Layout & Responsiveness
- Mobile-first: single column on mobile, grid/flex multi-column on desktop (BRAND-03).
- Base `Layout.astro` with shared head (meta groundwork), header + footer containing social follow icon links (lucide or inline SVG for brand icons — note: simple-icons-style brand glyphs may be needed since Lucide lacks TikTok/Spotify brand marks; Claude's discretion on cleanest zero-JS approach).
- A skeleton index page must render the full token system (fonts, colors, spacing) to prove the layout locally.

### Accessibility (requirement-locked)
- Every color token pair (body text/bg, accent/bg, heading/bg) ≥ 4.5:1 contrast, verified programmatically (contrast-check script or documented measured ratios) — NOT by eye. Accent must be chosen to pass on the dark background, or used only at large-text/decorative sizes with a compliant text variant.

### Claude's Discretion
- Exact accent hue (jewel tone family — derive from/harmonize with Eseriani artwork), exact font pairing, spacing scale, header/footer composition details, icon implementation approach.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `website/` scaffold from Phase 1: Astro 5.18.2 + Tailwind 4 (via `@tailwindcss/vite` in vite.plugins) + Preact + MDX + sitemap + Sharp, `src/styles/global.css` with `@import "tailwindcss"`, placeholder `index.astro`/`404.astro`, working Dockerfile/nginx pipeline.
- Sibling site `/Users/rob/Desktop/projects/RobinDarlington/robindarlington.com` for config/tooling patterns ONLY — branding must diverge completely.

### Established Patterns
- Tailwind 4 CSS-first config: design tokens go in `@theme {}` in `global.css` — no tailwind.config.js.
- Exact-pinned `@tailwindcss/vite`/`tailwindcss` 4.1.16 + `overrides.vite` (do NOT bump — see website/DEPLOY.md Notes).
- `npm run build` + `npm run check` must stay green; build works with `PUBLIC_LISTMONK_*` unset.

### Integration Points
- `src/data/releases.ts` consumed by Phase 3 pages; keep exports typed and stable.
- Cover art source files (verified on disk): `/Users/rob/Desktop/DARLNG/ESERIANI/ESERIANI.jpg` (1254px), `/Users/rob/Desktop/DARLNG/RANDEVU/RANDEVU.jpg` (2450px), `/Users/rob/Desktop/DARLNG/BRAVE/BRAVE.jpg` (3000px), `/Users/rob/Desktop/DARLNG/OPEN WIDE/OPEN_WIDE.jpg` (3000px).

</code_context>

<specifics>
## Specific Ideas

- "Make it pop" — the user explicitly wants bold and original over safe/minimal. Dark cinematic canvas + one luminous jewel accent used decisively (glows, gradient washes, selection color) rather than sprinkled.
- Accent architecture: one token, swappable per latest release — treat this as a first-class design constraint, not an afterthought.
- Browser testing loop per CONTENT.md scope revision: after build passes, verify at 375px / 768px / 1440px minimum via the preview browser before considering layout done.

</specifics>

<deferred>
## Deferred Ideas

- Hero section, embed player, discography grid, listen pages, social CTAs beyond header/footer anchors → Phase 3.
- Newsletter form island → Phase 4. Per-page OG/meta polish → Phase 5.
- Scroll-reveal/entrance animations → v2 (MOTION-01).

</deferred>

---

*Phase: 2-Brand, Data & Base Layout*
*Context gathered: 2026-08-06*
