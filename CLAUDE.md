<!-- GSD:project-start source:PROJECT.md -->
## Project

**DARLNG**

The official artist website for **DARLNG**, an Afro/RnB/Pop artist. It's a dark, moody, fan-facing **release hub**: a cinematic landing that spotlights the latest drop, funnels listeners out to every streaming platform, and converts visitors into followers via a self-hosted newsletter. Built for fans (not industry/EPK use), it lives at **darlng.com** and is a fresh rebuild — a clean break in branding from the artist's other identity site, robindarlington.com.

**Core Value:** A fan landing on darlng.com instantly hits the latest release and can play it / save it / follow DARLNG everywhere in one move. If everything else fails, the latest-release hero and its streaming links must work.

### Constraints

- **Tech stack**: Astro 5 + Tailwind 4 + Preact + MDX, with `@astrojs/sitemap`, Fontsource fonts, Lucide icons, Sharp — Mirror robindarlington.com so the two sites share tooling and mental model.
- **Location**: All new site code in `website/` subdirectory — keeps it isolated from the legacy placeholder at repo root.
- **Deployment**: Static build deployed via existing Coolify-on-Hetzner setup (Nixpacks or small Dockerfile/nginx serving the static `dist/`) — User's own infrastructure; no new SaaS hosting.
- **Email**: Self-hosted Listmonk on Coolify — Own-infra preference; signup form posts to Listmonk's subscription API/endpoint.
- **Audience**: Fans only — Scope and tone optimize for listener discovery and conversion, not industry credibility.
- **Branding**: Must be visually distinct from robindarlington.com — Separate artist identity; dark/moody vs. whatever the other site is.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Version Alignment Flag
- `astro@latest` is **7.0.3** (Astro 6 and 7 are both stable)
- Astro 6 requires Node 22.12.0+ and removes legacy content collections API
- Astro 7 is very new (June 2026), Rust compiler on by default, Vite 8
## Recommended Stack
### Core Technologies
| Technology | Version (pin to) | Purpose | Why |
|------------|-----------------|---------|-----|
| astro | `^5.18.2` | Static site framework, build tool | Default output is `static`; zero-JS by default; islands for Preact interactive bits; matches sibling site exactly |
| @tailwindcss/vite | `^4.1.16` | CSS framework via Vite plugin | CSS-first config (`@import "tailwindcss"`) — no JS config file; `@astrojs/tailwind` is deprecated, use this directly |
| tailwindcss | `^4.1.16` | CSS framework (peer) | Must be co-installed with @tailwindcss/vite |
| preact | `^10.27.2` | Lightweight interactive islands | 3 KB vs React's ~40 KB; identical hooks API; perfect for a newsletter form island and any minimal interactivity |
| @astrojs/preact | `^4.1.3` | Astro integration for Preact | Latest 4.x is the Astro 5-era version; `^5.x` is for Astro 6+ |
| @astrojs/mdx | `^4.3.14` | MDX content in Astro | Latest 4.x for Astro 5; enables .mdx files for release notes or any prose; `^5.x` targets Astro 6+ |
| @astrojs/sitemap | `^3.7.3` | Auto-generate sitemap.xml | Filters by `site` URL set in config; trivially adds SEO value |
| sharp | `^0.34.5` | Image processing backend | Astro's `<Image />` and `<Picture />` components require Sharp for local static builds; avif + webp output |
| typescript | `^5.9.3` | Type safety | Astro 5 requires TS for `.astro` type checking; required by `@astrojs/check` |
| @astrojs/check | `^0.9.9` | Astro-aware TypeScript checking | Run in CI pre-build; catches component prop mismatches |
### Supporting Libraries
| Library | Version (pin to) | Purpose | When to Use |
|---------|-----------------|---------|-------------|
| @lucide/astro | `^1.29.0` | SVG icon components | Social icons, streaming platform icons, UI chrome; renders as inline SVG, zero JS. (`lucide-astro` was deprecated on npm 2026 — superseded 2026-08-07; installed and verified in Phase 2/3.) |
| @fontsource/* | `^5.2.8` | Self-hosted web fonts | Import specific weight CSS files in the global stylesheet; avoids Google Fonts network calls; choose fonts at build time |
| @fontsource-variable/* | `^5.2.8` | Variable font variant | Prefer this over static Fontsource packages when a variable font is available — one import covers all weights |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| @astrojs/check | Astro type-checking | Add `astro check` as a pre-build step |
| typescript | TS compiler (peer) | Keep at `^5.x`; Astro 5 is not yet compatible with TS 6 |
## Key Config Patterns
### astro.config.mjs (complete reference for this project)
- No adapter needed for `output: 'static'` — Astro pre-renders all pages to `dist/`
- `site` must be set or `@astrojs/sitemap` emits nothing useful
- `@tailwindcss/vite` goes in `vite.plugins`, NOT in `integrations`; `@astrojs/tailwind` is deprecated
### Tailwind CSS 4 Global Stylesheet
### Fontsource Usage Pattern
### Lucide Icons
## Platform Embeds
### Spotify
### Apple Music
### YouTube
## Image Optimization (Sharp)
- `formats={['avif', 'webp']}` — avif first (best compression), webp second, jpeg fallback
- `widths` — Sharp generates each size at build time; browser picks via `srcset`
- `priority` — sets `loading="eager"` and `fetchpriority="high"` for the hero image
- `loading="lazy"` (default, no prop needed) for below-fold images like catalog thumbnails
## Listmonk Newsletter Integration
### Architecture for a Static Site
### Listmonk Subscription Endpoint
- No auth required — this is the public endpoint
- `list_uuids` — find this UUID in Listmonk admin → Lists → your list → details
- Returns `{ "data": true }` on success
- Double opt-in is a per-list setting in Listmonk admin (Lists → Edit List → "Double opt-in")
### Preact Island: Newsletter Signup Form
### CORS Configuration
### Spam Protection
## Coolify Deployment (Static Build)
### Recommended: Nixpacks with "Is it a static site?" enabled
| Coolify Setting | Value |
|----------------|-------|
| Build Pack | Nixpacks |
| Base Directory | `/website` |
| Build Command | `npm run build` |
| "Is it a static site?" | checked |
| Publish Directory | `/dist` |
| Port | 80 (auto-set when static checkbox is on) |
### Alternative: Multi-stage Dockerfile (more control)
# website/Dockerfile
# website/nginx.conf
- Nixpacks default nginx config does not properly serve `404.html` — going to a missing URL redirects to the homepage instead
- You can add gzip, cache headers, and security headers explicitly
## Installation
# Create the new Astro site in website/
# Core stack
# Icons and fonts
# Dev / type checking
# Example — replace with actual DARLNG brand fonts
## Alternatives Considered
| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `astro@^5.18.2` (pin to 5.x) | `astro@latest` (7.x) | Astro 6+ requires Node 22.12+, removes legacy content collections API, and diverges from the sibling site's stack. Upgrade is a deliberate decision, not a default. |
| `@tailwindcss/vite` in `vite.plugins` | `@astrojs/tailwind` | Deprecated as of Tailwind 4; using it with v4 produces broken output |
| `preact` islands | React / React full-page | React adds ~40 KB for a form island; Preact is functionally identical for this use case |
| Self-built "listen everywhere" page | Linkfire / Feature.fm / ToneDen | Catalog is already released (no pre-save needed); third-party adds branding overhead, costs, and a dependency that can break |
| Listmonk direct POST + reverse proxy CORS | Astro API route as proxy | `output: 'static'` has no server runtime; there are no API routes. Direct POST is correct. |
| Coolify Dockerfile + nginx.conf | Nixpacks static mode | Nixpacks default nginx does not handle `404.html` correctly; Dockerfile gives explicit control over routing and headers |
| `youtube-nocookie.com` embeds | Standard `youtube.com` embeds | nocookie delays Google cookie/localStorage writes until play; minimum viable GDPR position |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@astrojs/tailwind` | Deprecated; wraps Tailwind v3; breaks with v4 | `@tailwindcss/vite` in `vite.plugins` |
| `astro@latest` (7.x) for a fresh Astro 5 project | Breaks sibling site parity; Node 22.12+ requirement; very new as of June 2026 | `astro@^5.18.2` |
| `tailwind.config.js` | Tailwind 4 is CSS-first; JS config is v3 | `@theme {}` block in global CSS |
| Third-party smart link services (Linkfire, ToneDen) | Cost, lock-in, off-brand UI, no value for already-released catalog | Native "listen everywhere" page (requirement already decided) |
| Storing `LIST_UUID` in client JS as a secret | It's a public endpoint; the UUID is not a credential — it's fine in client code | Document it clearly; double opt-in protects list quality |
| `lucide-astro` | Deprecated on npm registry in favor of the official `@lucide/astro` (verified 2026-08-06) | `@lucide/astro@^1.29.0` |
| Images in `public/` for cover art | Skips Sharp processing; no avif/webp output; no srcset | Put in `src/assets/`, use `<Picture />` |
## Version Compatibility Matrix
| Package | Compatible Astro | Notes |
|---------|-----------------|-------|
| `@astrojs/mdx@^4.x` | Astro 5.x | MDX 5.x targets Astro 6+; MDX 7.x targets Astro 7+ |
| `@astrojs/preact@^4.x` | Astro 5.x | Preact integration 5.x targets Astro 6+ |
| `@astrojs/sitemap@^3.x` | Astro 5.x | Sitemap 3.x is current and works with Astro 5-7 |
| `@tailwindcss/vite@^4.x` | Astro >=5.2.0 | `astro add tailwind` installs this; requires Astro >=5.2 |
| `sharp@^0.34.x` | Astro 5.x | Peer requirement for `astro:assets` image processing |
| `@lucide/astro@^1.29.x` | Any Astro version | Plain Astro component package (replaces deprecated `lucide-astro`) |
## Sources
- `/withastro/docs` (Context7) — `output: 'static'`, image optimization, Preact islands directives, Tailwind 4 setup, Fontsource font API, content collections
- `/knadh/listmonk` (Context7) — `POST /api/public/subscription` endpoint, parameters, double opt-in list type
- [Astro Configuration Reference](https://docs.astro.build/en/reference/configuration-reference/) — confirmed `output: 'static'` default, `site` option
- [Coolify Nixpacks docs](https://coolify.io/docs/builds/packs/nixpacks) — static site checkbox, publish directory, base directory
- [crockettford.dev — Deploy Astro to Coolify](https://crockettford.dev/blog/astro-with-coolify) — practical Nixpacks walkthrough
- [billyle.dev — Fix missing 404 pages](https://billyle.dev/posts/fix-missing-404-pages-for-coolify-static-site-deployments) — Dockerfile + nginx.conf recommendation for proper 404 handling
- [Medium — Listmonk + Coolify CORS](https://medium.com/@jonasvoland/listmonk-with-coolify-cors-problem-solved-fba1d92cc844) — CORS reverse proxy pattern
- [Listmonk GitHub issue #541](https://github.com/knadh/listmonk/issues/541) — confirmed no built-in honeypot; double opt-in + manual honeypot is the recommended mitigation
- [Spotify Embeds docs](https://developer.spotify.com/documentation/embeds) — iframe parameters, `theme=0` dark mode
- [Lucide Astro guide](https://lucide.dev/guide/astro) — confirmed `lucide-astro` package, import pattern
- npm registry — all version numbers verified 2026-06-26
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
