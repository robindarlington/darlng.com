# Phase 3: Core Fan Experience - Context

**Gathered:** 2026-08-07
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — decisions sourced from ROADMAP requirements, the user's in-session direction (`.planning/CONTENT.md`), and the Phase 2 design system; remaining choices delegated to Claude per the user's standing "you pick, make it pop" brief.

<domain>
## Phase Boundary

The fan-facing heart of the site: a cinematic full-bleed hero for Eseriani with a click-to-load YouTube embed and streaming CTAs, a back-catalog discography grid (Randevu, Brave, Open Wide), per-release `/listen/[slug]` listen-everywhere pages with branded platform buttons for all four releases, and social follow links (already in header/footer from Phase 2 — this phase adds any in-flow CTAs). This replaces the Phase 2 skeleton index page. Newsletter form is Phase 4; OG/meta polish is Phase 5.
</domain>

<decisions>
## Implementation Decisions

### Hero (HERO-01, HERO-02)
- Full-bleed cinematic hero featuring Eseriani: cover art as the dominant visual (full-bleed background treatment with gradient scrim OR large art-forward composition — Claude's discretion per UI-SPEC to follow), title, artist line "Darlng x Tobiko", and primary streaming CTAs.
- Primary CTAs: Spotify, Apple Music, YouTube (minimum per roadmap) + a "listen everywhere" link to `/listen/eseriani`.
- **Embed: YouTube official video `qltP16ukVr4` via youtube-nocookie.com with a FACADE pattern** — static thumbnail + play button rendered at build; iframe injected only on click (protects LCP per HERO-02; the roadmap's "Spotify player" wording was superseded by the user's explicit choice of the YouTube official video, recorded in CONTENT.md).
- The page's LCP element must be the hero image, NOT the iframe (success criterion 2). Hero image loaded eager/fetchpriority=high via Sharp `<Picture>`.

### Discography (MUSIC-01, MUSIC-02)
- Grid section below hero: Randevu (2024), Brave (2020), Open Wide (2019) as cards — cover art, title, year, feature credit. NO embeds for back catalog.
- Each card links out: primary streaming links (icon buttons or inline links) + a link to the release's `/listen/[slug]` page.
- Data source: `releases`/`latestRelease` exports from `src/data/releases.ts` (Phase 2). No new data entry — consume what exists.

### Listen-Everywhere Pages (LISTEN-01)
- Static route `src/pages/listen/[slug].astro` via `getStaticPaths()` over `releases` — generates `/listen/eseriani`, `/listen/randevu`, `/listen/brave`, `/listen/open-wide`.
- Fully branded: DARLNG design system (Phase 2 tokens), release cover art, title/artist/year, one prominent button per configured platform (label + brand icon where available; platforms without simple-icons brand marks use a styled text button or generic icon — Claude's discretion).
- Platform button order: follow the `links[]` array order in releases.ts (Spotify first — already canonical).
- Each listen page links back to home.

### Social CTAs (FAN-03)
- Header/footer follow anchors exist from Phase 2 (satisfies the requirement's placement). This phase may add an in-flow "Follow DARLNG" moment if the composition benefits — discretion, not required.

### Performance groundwork (feeds PERF-01, verified fully in Phase 5)
- Hero `<Picture>` eager + fetchpriority high; discography/listen images lazy.
- Facade adds no third-party JS until click; the only island permitted this phase is the facade itself if implemented as a Preact island — a zero-JS `<script>` toggle in the Astro component is equally acceptable (Claude's discretion; prefer the lighter option).
- No YouTube cookies/localStorage before click (youtube-nocookie + facade).

### Claude's Discretion
- Hero composition details, scrim/gradient treatment, CTA button hierarchy (respect UI-SPEC-03 to be produced), discography card hover states, listen-page layout, facade implementation (script vs island), whether year/genre chips appear on cards.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/releases.ts`: typed `releases`, `latestRelease` (invariant-checked), `socials`, `Release`/`PlatformLink`/`YouTubeEmbed` types; Eseriani has `embed` config (videoId `qltP16ukVr4`, nocookie).
- `src/data/social-icons.ts` shared brand-icon map; `BrandIcon.astro` (zero-JS inline SVG, currentColor).
- `Layout.astro` (skip link, `#main` landmark, font preloads), `Header.astro`/`Footer.astro`, full token system in `global.css` (bg/surface/text/muted/accent #2DD9C5/error; Unbounded display, Manrope body; `check:contrast` gate).
- Cover art in `src/assets/releases/` at source resolution (1254–3000px), Sharp pipeline proven (avif/webp).

### Established Patterns
- Zero-JS-by-default; `<Picture formats={['avif','webp']}>` with explicit widths; 44px tap targets; `rel="noopener noreferrer"` on all external links (security-audited invariant — maintain the target=_blank/rel pairing count checks).
- Browser verification via `npx agent-browser` at 375/768/1440 with objective DOM/geometry assertions + screenshots to /tmp/ for orchestrator review.
- Contrast gate must stay green; do not add color pairs without adding them to `check-contrast.mjs` (or reuse existing tokens only).

### Integration Points
- `index.astro` skeleton content (headline demo, token swatches) gets REPLACED by hero + discography; keep the copy voice ("Independent. No schedule." material may be reused as a section or dropped — discretion).
- Phase 4 will insert a newsletter section on the homepage — leave a sensible slot in the composition.
- Phase 5 needs per-page titles/descriptions — listen pages should already set unique `<title>` via Layout props.

</code_context>

<specifics>
## Specific Ideas

- "Make it pop": the hero is THE moment — cinematic, art-forward, confident type. Use the accent decisively (CTA fill, play button, glows) per the UI-SPEC accent-reserved-for list.
- Facade play button should feel premium (accent glow on hover), not a generic YouTube red triangle clone.
- Success criterion: fan lands → sees Eseriani → can play/save/follow in one move. Every CTA above the fold on mobile if feasible.

</specifics>

<deferred>
## Deferred Ideas

- Newsletter section (Phase 4). Per-page OG images/meta + sitemap/robots + Lighthouse (Phase 5). Pre-save/countdown, video gallery, merch (out of scope per REQUIREMENTS). Scroll-reveal animations (v2 MOTION-01).

</deferred>

---

*Phase: 3-Core Fan Experience*
*Context gathered: 2026-08-07*
