# Architecture Research

**Domain:** Static artist release-hub site (Astro 5, Coolify/Hetzner)
**Researched:** 2026-06-26
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Build Time (Astro SSG)                           │
│                                                                      │
│  src/data/releases.ts ──► getCollection("releases")                  │
│       (typed TS data)            │                                   │
│                                  ▼                                   │
│  ┌─────────────┐  ┌───────────────────┐  ┌────────────────────────┐ │
│  │ index.astro │  │  music.astro      │  │  listen/[slug].astro   │ │
│  │  (hero)     │  │  (discography)    │  │  (listen everywhere)   │ │
│  └──────┬──────┘  └─────────┬─────────┘  └──────────┬─────────────┘ │
│         │                   │                        │               │
│  ┌──────▼──────┐  ┌─────────▼─────────┐  ┌──────────▼─────────────┐ │
│  │ HeroRelease │  │ DiscographyGrid   │  │ ListenPage (static)    │ │
│  │  .astro     │  │ .astro            │  │ .astro                 │ │
│  └──────┬──────┘  └───────────────────┘  └────────────────────────┘ │
│         │                                                            │
│  ┌──────▼──────┐                                                     │
│  │ EmbedPlayer │  ← Preact island (client:visible)                   │
│  │  .tsx       │                                                     │
│  └─────────────┘                                                     │
│                                                                      │
│  ┌─────────────────────────┐                                         │
│  │  NewsletterForm.tsx     │  ← Preact island (client:load)          │
│  │  POSTs to Listmonk      │                                         │
│  └─────────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────────┘
                    │
                    │ astro build → dist/
                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Runtime (Coolify on Hetzner)                            │
│                                                                      │
│  nginx:alpine  ← serves static dist/                                 │
│                                                                      │
│  Listmonk (separate Coolify service)                                 │
│    POST /api/public/subscription  ← from NewsletterForm island       │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Type |
|-----------|----------------|------|
| `src/data/releases.ts` | Single source of truth — all release data, per-platform links | Static TS data file |
| `layouts/BaseLayout.astro` | HTML shell, meta tags, fonts, global styles | Static Astro layout |
| `components/HeroRelease.astro` | Pulls latest release from data, renders title + cover + CTAs | Static Astro component |
| `components/EmbedPlayer.tsx` | Spotify/YouTube embed for the hero (lazy-hydrated island) | Preact island |
| `components/DiscographyGrid.astro` | Renders all releases as cards with cover art and streaming links | Static Astro component |
| `components/ReleaseCard.astro` | Single release: cover, title, year, platform link buttons | Static Astro component |
| `components/ListenLinks.astro` | Platform buttons from per-release link data | Static Astro component |
| `components/NewsletterForm.tsx` | Controlled form, submits to Listmonk via fetch, shows success/error | Preact island |
| `components/SocialLinks.astro` | Follow links (Spotify, Instagram, TikTok, YouTube) | Static Astro component |
| `components/SEO.astro` | Open Graph + Twitter meta tags, structured data | Static Astro component |
| `pages/index.astro` | Hero section + newsletter signup | Static page |
| `pages/music.astro` | Full discography grid | Static page |
| `pages/listen/[slug].astro` | Per-release "listen everywhere" page (SSG routes) | Static page |

---

## Recommended Project Structure

```
website/
├── astro.config.mjs          # site: "https://darlng.com", preact, sitemap, mdx, tailwind
├── tsconfig.json
├── package.json
├── .env                      # PUBLIC_LISTMONK_URL, PUBLIC_LISTMONK_LIST_UUID
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── og-default.jpg        # fallback OG image
└── src/
    ├── data/
    │   └── releases.ts       # typed release data (THE single source of truth)
    ├── config/
    │   └── meta.ts           # site title, description, social handles
    ├── assets/
    │   └── releases/
    │       ├── eseriani.jpg
    │       ├── randevu.jpg
    │       ├── brave.jpg
    │       └── open-wide.jpg
    ├── layouts/
    │   └── BaseLayout.astro  # <html> shell, global styles, font imports
    ├── components/
    │   ├── SEO.astro
    │   ├── HeroRelease.astro
    │   ├── EmbedPlayer.tsx         # Preact island
    │   ├── DiscographyGrid.astro
    │   ├── ReleaseCard.astro
    │   ├── ListenLinks.astro
    │   ├── NewsletterForm.tsx      # Preact island
    │   ├── SocialLinks.astro
    │   ├── Header.astro
    │   └── Footer.astro
    ├── pages/
    │   ├── index.astro             # hero + newsletter
    │   ├── music.astro             # discography
    │   ├── listen/
    │   │   └── [slug].astro        # per-release listen everywhere (SSG)
    │   ├── robots.txt.ts
    │   └── sitemap.xml             # auto-generated by @astrojs/sitemap
    └── styles/
        └── global.css              # Tailwind base imports, CSS custom properties
```

### Structure Rationale

- **`src/data/releases.ts` (not content collections):** The release catalog is small (4 releases), hand-curated, and has structured typed data with arrays of platform links. A plain TypeScript data file with `satisfies` typing is simpler and more explicit than MDX content collections for this use case. Content collections add MDX body rendering overhead that isn't needed — there's no long-form prose per release. If editorial content (liner notes, blog posts) is added later, content collections can be layered in then.
- **`src/assets/releases/`:** Cover art imported here gets processed by Astro's Sharp pipeline at build time — automatic WebP conversion, responsive `srcset`, optimised sizes. Images referenced from `src/` (not `public/`) get this treatment automatically.
- **`pages/listen/[slug].astro`:** SSG dynamic route — `getStaticPaths()` maps each release slug to a fully-static listen page. No runtime routing needed.
- **`components/` flat structure:** Small component count doesn't warrant subdirectories. Islands and static components coexist; naming convention (`.tsx` = island, `.astro` = static) is the distinction.

---

## Data Model

The release data file is the single source of truth that drives the hero, discography, and listen pages:

```typescript
// src/data/releases.ts

export type Platform =
  | "spotify"
  | "apple-music"
  | "youtube"
  | "youtube-music"
  | "bandcamp"
  | "soundcloud"
  | "tidal"
  | "deezer"
  | "amazon-music";

export interface PlatformLink {
  platform: Platform;
  url: string;
  label: string; // "Listen on Spotify", "Apple Music", etc.
}

export interface EmbedConfig {
  type: "spotify" | "youtube" | "bandcamp" | "soundcloud";
  src: string;       // iframe src URL
  height?: number;   // defaults vary by provider
}

export interface Release {
  slug: string;              // URL-safe, e.g. "eseriani"
  title: string;
  artist: string;            // "DARLNG" or "DARLNG x TOBIKO"
  year: number;
  releaseType: "single" | "ep" | "album";
  cover: ImageMetadata;      // imported image, processed by Sharp
  description?: string;      // short promo line for OG / listen page
  embed?: EmbedConfig;       // primary embed (hero uses this; discography may show it)
  links: PlatformLink[];     // ordered list of streaming destinations
  featured: boolean;         // true = latest release → drives hero
}

export const releases: Release[] = [
  {
    slug: "eseriani",
    title: "Eseriani",
    artist: "DARLNG x TOBIKO",
    year: 2026,
    releaseType: "single",
    cover: (await import("../assets/releases/eseriani.jpg")).default,
    description: "Latest single — out now.",
    embed: {
      type: "youtube",
      src: "https://www.youtube.com/embed/qltP16ukVr4?si=Z_J3SzuXynNWuuYK",
    },
    links: [
      { platform: "spotify", url: "https://open.spotify.com/...", label: "Spotify" },
      { platform: "apple-music", url: "https://music.apple.com/...", label: "Apple Music" },
      { platform: "youtube", url: "https://youtube.com/...", label: "YouTube" },
      // ...
    ],
    featured: true,
  },
  {
    slug: "randevu",
    title: "Randevu",
    artist: "DARLNG",
    year: 2024,
    releaseType: "single",
    cover: (await import("../assets/releases/randevu.jpg")).default,
    embed: {
      type: "bandcamp",
      src: "https://bandcamp.com/EmbeddedPlayer/track=3865221633/size=large/bgcol=000000/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/",
      height: 120,
    },
    links: [
      { platform: "spotify", url: "...", label: "Spotify" },
      // ...
    ],
    featured: false,
  },
  // Brave (2020), Open Wide (2019) ...
];

// Derived helpers used by pages
export const featuredRelease = releases.find(r => r.featured)!;
export const sortedReleases = [...releases].sort((a, b) => b.year - a.year);
```

**Why a TS file over content collections:** Astro 5 content collections excel at prose-heavy content (blog posts, MDX with body). For a typed catalog with embedded objects (arrays of platform links, embed configs) and image imports, a plain TS data file is more explicit, easier to validate with TypeScript, and removes indirection. The `image()` helper from `astro:content` schema adds value when images live next to markdown files — not needed here since images are centrally managed in `src/assets/`.

---

## Architectural Patterns

### Pattern 1: Static-First, Islands Only Where Needed

**What:** Default to `.astro` components (zero client JS). Hydrate as Preact islands only where user interaction is required.

**When to use:** Always — the default. Opt into islands only for newsletter form and embed player.

**Trade-offs:** Maximum performance, no hydration overhead on static sections. Islands load independently and don't block render.

**Island inventory:**

| Component | Directive | Reason |
|-----------|-----------|--------|
| `EmbedPlayer.tsx` | `client:visible` | Defer iframe load until scrolled into view; avoids blocking LCP |
| `NewsletterForm.tsx` | `client:load` | Form needs to be interactive immediately; small component |

Everything else — hero text, cover art, discography grid, platform link buttons, social links, header, footer — is zero-JS static Astro.

### Pattern 2: Single Data Import → Multiple Consumers

**What:** `releases.ts` exports `releases`, `featuredRelease`, and `sortedReleases`. Pages import the relevant export and pass to components as props.

**When to use:** Whenever the same data drives multiple pages/components. Avoids duplication, ensures consistency (changing a URL or title propagates everywhere).

**Data flow:**
```
src/data/releases.ts
    ├── featuredRelease → pages/index.astro → HeroRelease.astro → EmbedPlayer.tsx
    │                                      → ListenLinks.astro
    │                                      → (snippet) → NewsletterForm.tsx (below hero)
    ├── sortedReleases → pages/music.astro → DiscographyGrid.astro → ReleaseCard.astro
    │                                                              → ListenLinks.astro
    └── sortedReleases → pages/listen/[slug].astro (getStaticPaths)
                           → ListenPage layout → ListenLinks.astro (full platform list)
```

### Pattern 3: Cross-Origin Form Submission via Listmonk Public API

**What:** `NewsletterForm.tsx` island submits to Listmonk's unauthenticated public endpoint via `fetch()`.

**Endpoint:** `POST https://listmonk.yourdomain.com/api/public/subscription`

**Request (JSON):**
```json
{
  "email": "fan@example.com",
  "name": "Fan Name",
  "list_uuids": ["<list-uuid-from-listmonk>"]
}
```

**Response:** `{"data": true}` on success.

**Authentication:** None required — this endpoint is specifically designed for public unauthenticated form submissions.

**CORS:** Listmonk does not set CORS headers on this endpoint by default. Two options:
1. Put Listmonk behind a Caddy/nginx reverse proxy on Coolify and add CORS headers in the proxy config (`Access-Control-Allow-Origin: https://darlng.com`). This is the recommended approach.
2. Use an Astro API endpoint (SSR mode for one route) as a thin proxy — but this requires switching from pure static output, so avoid it.

**Env vars in website/:**
```ini
# .env (build-time, baked in as PUBLIC_ for client-side island)
PUBLIC_LISTMONK_URL=https://listmonk.yourdomain.com
PUBLIC_LISTMONK_LIST_UUID=<uuid-from-listmonk-admin>
```

In the Preact island, read via:
```typescript
const LISTMONK_URL = import.meta.env.PUBLIC_LISTMONK_URL;
const LIST_UUID = import.meta.env.PUBLIC_LISTMONK_LIST_UUID;
```

These are baked into the static bundle at build time. Not secret — they're client-visible by design (public subscription form). Keep the admin API credentials server-side only (they never appear in this site).

---

## Data Flow

### Hero Data Flow (index.astro)

```
releases.ts → featuredRelease
    │
    ▼
pages/index.astro
    ├── <HeroRelease release={featuredRelease} />
    │       ├── cover art (astro:assets <Image> → Sharp-processed)
    │       ├── title, artist, year (static text)
    │       ├── <EmbedPlayer embed={release.embed} client:visible />
    │       │       └── iframe renders on scroll into view (no blocking)
    │       └── <ListenLinks links={release.links} />
    │               └── platform buttons (all static <a> tags)
    └── <NewsletterForm client:load />
            └── POST https://listmonk.yourdomain.com/api/public/subscription
```

### Discography Data Flow (music.astro)

```
releases.ts → sortedReleases
    │
    ▼
pages/music.astro
    └── <DiscographyGrid releases={sortedReleases} />
            └── {releases.map(r => <ReleaseCard release={r} />)}
                    ├── cover art (<Image />)
                    ├── title, artist, year
                    └── <ListenLinks links={r.links} />
                            └── buttons → /listen/{r.slug} page
```

### Listen Page Data Flow (listen/[slug].astro)

```
releases.ts → sortedReleases
    │
    ▼
getStaticPaths() → generates /listen/eseriani, /listen/randevu, etc.
    │
    ▼
pages/listen/[slug].astro (one per release)
    ├── large cover art
    ├── release title + artist
    ├── optional embed (EmbedPlayer client:visible)
    └── full <ListenLinks /> with ALL platform buttons
```

---

## Coolify Deploy Configuration

### Nixpacks (preferred for simplicity)

| Setting | Value |
|---------|-------|
| Base Directory | `/website` |
| Build Command | `npm run build` (Nixpacks may detect automatically) |
| Publish Directory | `/dist` (relative to base dir, so `website/dist`) |
| Is Static Site? | Yes (checked) |
| Port | 80 (auto-set when static is checked) |

Nixpacks reads `website/package.json`, installs deps, runs `astro build`, serves `dist/` with nginx:alpine.

### Dockerfile alternative (for nginx CORS config)

If Listmonk CORS headers can't be set at the proxy layer, an nginx config in the Dockerfile gives full control:

```dockerfile
# website/Dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

However: CORS headers belong on the Listmonk side (set at the Caddy/nginx proxy in front of Listmonk on Coolify), not on the static site serving layer. The Nixpacks path is simpler and preferred.

### Environment Variables in Coolify

Set in the Coolify UI under the application's "Environment Variables" tab:
- `PUBLIC_LISTMONK_URL` — full URL of the Listmonk instance
- `PUBLIC_LISTMONK_LIST_UUID` — UUID of the fan list in Listmonk

These are available to Vite/Astro at build time and baked into the static output.

---

## Suggested Build Order

Build in this order to avoid dependency loops and backtracking:

1. **Data model first** (`src/data/releases.ts`) — All components depend on this type shape. Define it with real release data before building any UI. Block everything else until this is correct.

2. **Layout + base styles** (`layouts/BaseLayout.astro`, `styles/global.css`, `config/meta.ts`) — Shell that every page uses. Tailwind 4 config, font imports (Fontsource), CSS custom properties for the dark/moody palette. Blocking dependency for all pages.

3. **Static core components** — Build in dependency order:
   - `SEO.astro` (goes inside `BaseLayout`)
   - `ListenLinks.astro` (leaf component, no deps beyond data types)
   - `ReleaseCard.astro` (uses `ListenLinks`)
   - `HeroRelease.astro` (uses cover image, `ListenLinks`)
   - `DiscographyGrid.astro` (uses `ReleaseCard`)
   - `SocialLinks.astro`, `Header.astro`, `Footer.astro` (independent)

4. **Pages** (after components are in place):
   - `pages/index.astro` — hero page, exercises `HeroRelease` + newsletter stub
   - `pages/music.astro` — discography, exercises `DiscographyGrid`
   - `pages/listen/[slug].astro` — listen pages, exercises `ListenLinks` at full depth

5. **Preact islands** (after static structure is proven):
   - `EmbedPlayer.tsx` (`client:visible`) — drop into HeroRelease; validate embed loads correctly
   - `NewsletterForm.tsx` (`client:load`) — build last; requires Listmonk instance to be running for integration testing

6. **Coolify deploy config** — After local build (`npm run build`) produces a clean `dist/`, wire up Coolify with base dir `/website`, publish dir `/dist`, and env vars.

7. **Listmonk CORS wiring** — Set `Access-Control-Allow-Origin: https://darlng.com` on the Caddy/nginx proxy in front of the Listmonk Coolify service. Test newsletter form end-to-end in staging.

---

## Anti-Patterns

### Anti-Pattern 1: Storing Release Data in MDX Files

**What people do:** Mirror the sibling site's content collections pattern — one `.mdx` file per release with an iframe embed in the body.

**Why it's wrong for this site:** The sibling site (robindarlington.com) uses MDX because releases have embed body content and the site renders individual release pages from that content. DARLNG's site needs releases to drive *three different views simultaneously* (hero, discography grid, listen page) from typed structured data with arrays of platform links. MDX frontmatter can't express `links: PlatformLink[]` cleanly, and using `retainBody` to extract iframe src strings via regex (as the sibling site does) is fragile. For 4 releases, a typed TS file is far cleaner.

**Do this instead:** `src/data/releases.ts` with explicit TypeScript types. If prose body is needed later (liner notes), add an optional `notes?: string` MDX-rendered field or a separate content collection for that specific use case.

### Anti-Pattern 2: Using `client:load` for the Embed Player

**What people do:** Apply `client:load` to `EmbedPlayer.tsx` to ensure the iframe loads immediately.

**Why it's wrong:** The embed player is below the fold in the hero section. `client:load` sends JavaScript immediately and blocks — it hurts LCP and CLS. The iframe itself causes a network request to YouTube/Bandcamp/Spotify on page load regardless.

**Do this instead:** Use `client:visible`. The Preact island hydrates when the user scrolls to it. For above-the-fold cover art and CTAs (the actual LCP elements), those are pure static HTML — they load instantly.

### Anti-Pattern 3: Proxying Listmonk Through an Astro API Endpoint

**What people do:** Add a server-side Astro endpoint (`pages/api/subscribe.ts`) to avoid CORS by proxying the Listmonk request server-side.

**Why it's wrong:** Astro in `output: 'static'` mode (which this site uses) cannot have runtime server endpoints. Adding one requires switching to `output: 'hybrid'` or `'server'`, which introduces Node.js runtime requirements and breaks the pure static deploy on Coolify with nginx.

**Do this instead:** Configure CORS on the Listmonk Caddy/nginx reverse proxy in Coolify. Add `Access-Control-Allow-Origin: https://darlng.com` to the proxy headers for the Listmonk service. The `POST /api/public/subscription` endpoint requires no auth and is designed for this pattern.

### Anti-Pattern 4: Putting Cover Art in `public/`

**What people do:** Drop cover art JPGs in `public/` for simplicity.

**Why it's wrong:** Images in `public/` bypass Astro's asset pipeline — no WebP conversion, no responsive `srcset`, no lazy loading hints, no size optimisation. Cover art is the primary visual element; unoptimised JPGs will hurt performance noticeably on mobile.

**Do this instead:** Import images from `src/assets/` and use Astro's `<Image>` component. The Sharp service processes them at build time. For release cover art in the data file, store the processed `ImageMetadata` (from a top-level await import) in the release object.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Listmonk (self-hosted) | `fetch POST /api/public/subscription` from `NewsletterForm.tsx` island | Requires CORS header at Listmonk's proxy; list UUID configured via env var |
| Spotify embed | `<iframe>` inside `EmbedPlayer.tsx` island | `client:visible` defers load; no API key needed for embeds |
| YouTube embed | `<iframe>` inside `EmbedPlayer.tsx` island | Same pattern as Spotify |
| Bandcamp embed | `<iframe>` inside `EmbedPlayer.tsx` island | Background colour param adjusts for dark theme |
| @astrojs/sitemap | Auto-generates `sitemap.xml` at build | Add `site: "https://darlng.com"` in `astro.config.mjs` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `releases.ts` → all pages | Direct TS import at build time | No runtime; data baked at build |
| Pages → static components | Astro props | Typed with `Release` interface |
| Pages → Preact islands | Astro props serialised to JSON | Islands receive plain-serialisable props only (no `ImageMetadata` — pass `src` string) |
| `EmbedPlayer.tsx` → embed providers | `<iframe src>` | Cross-origin iframes; no postMessage needed |
| `NewsletterForm.tsx` → Listmonk | `fetch()` POST with JSON body | Cross-origin; CORS must be permissive on Listmonk side |

**Important:** When passing image data to a Preact island, pass `release.cover.src` (a string URL) not the full `ImageMetadata` object — only serialisable values can cross the static/island boundary.

---

## Scaling Considerations

This is a static site with no runtime server. Scaling concerns are almost entirely on the CDN/edge layer, not the application.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–10k visitors/month | Coolify nginx as-is; no changes needed |
| 10k–100k visitors/month | Add Cloudflare in front of Coolify for CDN caching; static files served from edge |
| 100k+ visitors/month | Static files on object storage (S3-compatible, e.g. Hetzner Object Storage) + CDN; Coolify becomes CI/CD only |

The only runtime component is Listmonk. If newsletter signup volume becomes significant, Listmonk can be scaled independently (it's a separate Coolify service).

---

## Sources

- [Astro content collections — glob() loader](https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/content-loader-reference.mdx) (Context7 / official docs) — HIGH confidence
- [Astro islands / client directives](https://github.com/withastro/docs/blob/main/src/content/docs/en/concepts/islands.mdx) (Context7 / official docs) — HIGH confidence
- [Astro environment variables](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/environment-variables.mdx) (Context7 / official docs) — HIGH confidence
- [Listmonk /api/public/subscription endpoint](https://listmonk.app/docs/apis/subscribers/) (official docs) — HIGH confidence
- [Listmonk subscription form template](https://github.com/knadh/listmonk/blob/master/static/public/templates/subscription-form.html) (official source) — HIGH confidence
- [Coolify Nixpacks base directory / static site config](https://coolify.io/docs/applications/build-packs/nixpacks) (official docs) — HIGH confidence
- [How to Deploy an Astro Site Using Coolify](https://crockettford.dev/blog/astro-with-coolify) — MEDIUM confidence
- Sibling site source (`/Users/rob/Desktop/projects/RobinDarlington/robindarlington.com`) — direct reference

---
*Architecture research for: DARLNG static artist site (Astro 5, Coolify/Hetzner)*
*Researched: 2026-06-26*
