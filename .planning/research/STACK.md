# Stack Research

**Domain:** Static artist/musician release hub website
**Researched:** 2026-06-26
**Confidence:** HIGH — all versions verified against npm registry; config patterns verified against Context7/official Astro and Listmonk docs

---

## Version Alignment Flag

The project spec says "Astro 5" and the sibling site (robindarlington.com) currently runs `astro@^5.16.6`. As of this research:

- `astro@latest` is **7.0.3** (Astro 6 and 7 are both stable)
- Astro 6 requires Node 22.12.0+ and removes legacy content collections API
- Astro 7 is very new (June 2026), Rust compiler on by default, Vite 8

**Recommendation: Start on Astro 5.x (pinned to `^5.18.2`), the same major as the sibling site.** This keeps the two sites on identical tooling, is battle-tested, and defers the Astro 6 migration decision to a deliberate upgrade moment. The locked stack decision in PROJECT.md is validated as-is; just pin to the latest 5.x patch, not `latest`.

---

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
| lucide-astro | `^0.556.0` | SVG icon components | Social icons, streaming platform icons, UI chrome; renders as inline SVG, zero JS |
| @fontsource/* | `^5.2.8` | Self-hosted web fonts | Import specific weight CSS files in the global stylesheet; avoids Google Fonts network calls; choose fonts at build time |
| @fontsource-variable/* | `^5.2.8` | Variable font variant | Prefer this over static Fontsource packages when a variable font is available — one import covers all weights |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| @astrojs/check | Astro type-checking | Add `astro check` as a pre-build step |
| typescript | TS compiler (peer) | Keep at `^5.x`; Astro 5 is not yet compatible with TS 6 |

---

## Key Config Patterns

### astro.config.mjs (complete reference for this project)

```js
// website/astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';

export default defineConfig({
  // Required: static output (this is the default, but explicit is clear)
  output: 'static',

  // Required: full site URL so sitemap and canonical tags are correct
  site: 'https://darlng.com',

  integrations: [
    sitemap(),
    preact(),
    mdx(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
```

Notes:
- No adapter needed for `output: 'static'` — Astro pre-renders all pages to `dist/`
- `site` must be set or `@astrojs/sitemap` emits nothing useful
- `@tailwindcss/vite` goes in `vite.plugins`, NOT in `integrations`; `@astrojs/tailwind` is deprecated

### Tailwind CSS 4 Global Stylesheet

```css
/* website/src/styles/global.css */
@import "tailwindcss";

@theme {
  /* Design tokens — OKLCH for consistent dark palette */
  --color-background: oklch(8% 0.02 260);
  --color-surface:    oklch(12% 0.02 260);
  --color-accent:     oklch(65% 0.25 300);  /* neon/jewel accent */
  --color-text:       oklch(90% 0.01 260);

  --font-display: var(--font-display-family);
  --font-body:    var(--font-body-family);
}
```

Import this file in your base layout (not in `astro.config`).

### Fontsource Usage Pattern

Astro 5's native font API can pull from Fontsource directly via `astro.config.mjs`. This is the recommended approach over manual CSS imports:

```js
// astro.config.mjs — add to defineConfig
import { fontProviders } from 'astro/config';

// inside defineConfig:
fonts: [
  {
    provider: fontProviders.fontsource(),
    name: 'Inter',                          // or whatever the artist fonts are
    cssVariable: '--font-body-family',
    weights: ['400 700'],                   // variable font range
    styles: ['normal'],
  },
],
```

Then in `<head>` via the base layout:

```astro
---
import { Font } from 'astro:assets';
---
<Font cssVariable="--font-body-family" preload />
```

This auto-generates `<link rel="preload">` tags and injects scoped `@font-face` rules. The `cssVariable` value then wires up through the Tailwind `@theme` block above.

If using a variable font package directly (e.g. `@fontsource-variable/inter`), the manual approach still works — import the CSS in the layout `<head>` or global stylesheet and declare the font-family in `@theme`.

### Lucide Icons

Two packages exist: `lucide-astro` (community, uses `.svg` imports) and `@lucide/astro` (official, renders inline SVG components). Use `lucide-astro` to match the sibling site. Import named icon components:

```astro
---
import { Spotify, Music, Youtube, Instagram } from 'lucide-astro';
---
<Spotify size={24} class="text-accent" />
```

Icons render as inline SVG — no extra JS bundle. Fully tree-shakable.

---

## Platform Embeds

### Spotify

Use the standard embed iframe. Get the embed code from Spotify Web Player: Share → Embed. The URL pattern is:

```html
<iframe
  src="https://open.spotify.com/embed/album/ALBUM_ID?utm_source=generator&theme=0"
  width="100%"
  height="352"
  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
  loading="lazy"
  style="border-radius: 12px;"
></iframe>
```

`theme=0` forces the dark player skin — right for DARLNG's aesthetic. `loading="lazy"` defers iframe load until near viewport; on a static Astro page this is just a plain HTML attribute. No JS wrapper needed; drop directly in `.astro` or `.mdx`. Logged-out / free users hear 30-second previews; full playback requires Spotify login.

### Apple Music

Get embed code from Apple Music: Share → Copy Embed Code. URL pattern:

```html
<iframe
  src="https://embed.music.apple.com/us/album/ALBUM_SLUG/ALBUM_ID"
  height="450"
  allow="autoplay *; encrypted-media *; fullscreen *"
  sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
  style="width: 100%; border-radius: 12px;"
  loading="lazy"
></iframe>
```

Previews play for all visitors; full playback requires Apple Music subscription.

### YouTube

Always use the privacy-enhanced domain to avoid dropping Google cookies on page load:

```html
<iframe
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
  title="DARLNG — Eseriani (Official Video)"
  width="100%"
  height="315"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy"
  style="border-radius: 8px;"
></iframe>
```

`youtube-nocookie.com` delays cookie/localStorage writes until the visitor actually plays the video. This is the minimum viable privacy approach without adding a full click-to-load facade. No JS required.

All three platform embeds are static HTML in `.astro` files — no Preact island needed.

---

## Image Optimization (Sharp)

Sharp is installed as a direct dependency (not dev-only). Astro uses it automatically when `<Image />` or `<Picture />` components are used with local images.

**Cover art and press photos pattern:**

```astro
---
import { Picture } from 'astro:assets';
import coverArt from '../assets/eseriani-cover.jpg';
---

<!-- Hero cover: serve avif + webp, jpg fallback, above-fold priority -->
<Picture
  src={coverArt}
  formats={['avif', 'webp']}
  widths={[640, 1280, 1920]}
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="DARLNG — Eseriani album cover"
  priority
/>
```

- `formats={['avif', 'webp']}` — avif first (best compression), webp second, jpeg fallback
- `widths` — Sharp generates each size at build time; browser picks via `srcset`
- `priority` — sets `loading="eager"` and `fetchpriority="high"` for the hero image
- `loading="lazy"` (default, no prop needed) for below-fold images like catalog thumbnails

Images in `src/assets/` are processed; images in `public/` are copied as-is (avoid for cover art).

---

## Listmonk Newsletter Integration

### Architecture for a Static Site

A fully static Astro build cannot proxy server-side requests. The signup form must POST directly from the browser to the Listmonk instance. This creates a cross-origin request (darlng.com → listmonk.darlng.com or similar).

**The correct approach:**

1. A Preact island renders the form with client-side fetch
2. The form POSTs JSON to `https://newsletter.darlng.com/api/public/subscription`
3. Listmonk's CORS config (or the reverse proxy in front of it) allows `https://darlng.com`
4. Listmonk handles double opt-in automatically when the list is configured as "double opt-in"

### Listmonk Subscription Endpoint

```
POST https://YOUR_LISTMONK_DOMAIN/api/public/subscription
Content-Type: application/json

{
  "email": "fan@example.com",
  "name": "Fan Name",
  "list_uuids": ["YOUR-LIST-UUID-HERE"]
}
```

- No auth required — this is the public endpoint
- `list_uuids` — find this UUID in Listmonk admin → Lists → your list → details
- Returns `{ "data": true }` on success
- Double opt-in is a per-list setting in Listmonk admin (Lists → Edit List → "Double opt-in")

### Preact Island: Newsletter Signup Form

```tsx
// website/src/components/NewsletterForm.tsx
import { useState } from 'preact/hooks';

const LIST_UUID = 'YOUR-LIST-UUID';
const LISTMONK_URL = 'https://newsletter.darlng.com';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  // Honeypot — spam bots fill this, humans don't
  const [honeypot, setHoneypot] = useState('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (honeypot) return; // bot detected, silently drop

    setStatus('sending');
    try {
      const res = await fetch(`${LISTMONK_URL}/api/public/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          list_uuids: [LIST_UUID],
        }),
      });
      if (!res.ok) throw new Error('bad response');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') return <p>Check your inbox to confirm.</p>;

  return (
    <form onSubmit={handleSubmit} novalidate>
      {/* Honeypot field — hidden from humans, filled by bots */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onInput={(e) => setHoneypot((e.target as HTMLInputElement).value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autocomplete="off"
      />
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
      />
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Subscribe'}
      </button>
      {status === 'error' && <p>Something went wrong. Try again.</p>}
    </form>
  );
}
```

Use in an Astro page:

```astro
---
import NewsletterForm from '../components/NewsletterForm';
---
<NewsletterForm client:visible />
```

`client:visible` defers Preact hydration until the form scrolls into view — no JS cost until needed.

### CORS Configuration

Listmonk does not expose a `config.toml` CORS block out of the box in the self-hosted Docker setup; configure CORS at the **reverse proxy level** (Caddy or nginx in front of Listmonk on Coolify).

Caddy snippet (on the Listmonk service domain in Coolify):

```
newsletter.darlng.com {
  @cors_preflight method OPTIONS
  handle @cors_preflight {
    header Access-Control-Allow-Origin "https://darlng.com"
    header Access-Control-Allow-Methods "POST, OPTIONS"
    header Access-Control-Allow-Headers "Content-Type"
    header Access-Control-Max-Age "3600"
    respond 204
  }
  header Access-Control-Allow-Origin "https://darlng.com"
  reverse_proxy listmonk:9000
}
```

If Coolify manages TLS and reverse proxy via Traefik, add the CORS middleware labels to the Listmonk service container.

### Spam Protection

Listmonk does not have a built-in honeypot (GitHub issue #541, open). Defense layers:

1. **Honeypot field** in the form (implemented above) — catches basic bots, zero UX cost
2. **Double opt-in** on the list — invalid/spam emails never confirm; protects list quality
3. **Cloudflare Turnstile** (optional) — if bot abuse becomes a problem post-launch; add as a Preact island component before the submit button. Turnstile is invisible by default and requires no user interaction.

Double opt-in alone is sufficient for a musician fan list at typical scale.

---

## Coolify Deployment (Static Build)

### Recommended: Nixpacks with "Is it a static site?" enabled

Since the Astro site lives in `website/` within the repo:

| Coolify Setting | Value |
|----------------|-------|
| Build Pack | Nixpacks |
| Base Directory | `/website` |
| Build Command | `npm run build` |
| "Is it a static site?" | checked |
| Publish Directory | `/dist` |
| Port | 80 (auto-set when static checkbox is on) |

Coolify will cd into `/website`, run `npm install && npm run build`, then serve `website/dist/` with nginx:alpine.

**Note:** "Publish Directory" in Coolify's static mode is relative to the base directory, so `/dist` means `website/dist/`.

### Alternative: Multi-stage Dockerfile (more control)

Use a Dockerfile when you need custom nginx config (e.g., proper 404 page routing):

```dockerfile
# website/Dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# website/nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/css application/javascript image/svg+xml;

  location / {
    try_files $uri $uri/ $uri/index.html =404;
  }

  error_page 404 /404.html;
}
```

The Dockerfile approach is worth the minor extra setup because:
- Nixpacks default nginx config does not properly serve `404.html` — going to a missing URL redirects to the homepage instead
- You can add gzip, cache headers, and security headers explicitly

In Coolify, point the resource at the repo, set Base Directory to `/website`, and select "Dockerfile" as the build method. Coolify/Traefik handles TLS.

---

## Installation

```bash
# Create the new Astro site in website/
cd /path/to/darlng.com
npm create astro@5 website -- --template minimal --typescript strict --no-install

cd website

# Core stack
npm install astro@^5.18.2 @tailwindcss/vite@^4.1.16 tailwindcss@^4.1.16 \
  @astrojs/preact@^4.1.3 @astrojs/mdx@^4.3.14 @astrojs/sitemap@^3.7.3 \
  preact@^10.27.2 sharp@^0.34.5

# Icons and fonts
npm install lucide-astro@^0.556.0

# Dev / type checking
npm install @astrojs/check@^0.9.9 typescript@^5.9.3
```

Fontsource packages are installed on demand based on chosen typefaces:

```bash
# Example — replace with actual DARLNG brand fonts
npm install @fontsource-variable/inter@^5.2.8
```

---

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

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@astrojs/tailwind` | Deprecated; wraps Tailwind v3; breaks with v4 | `@tailwindcss/vite` in `vite.plugins` |
| `astro@latest` (7.x) for a fresh Astro 5 project | Breaks sibling site parity; Node 22.12+ requirement; very new as of June 2026 | `astro@^5.18.2` |
| `tailwind.config.js` | Tailwind 4 is CSS-first; JS config is v3 | `@theme {}` block in global CSS |
| Third-party smart link services (Linkfire, ToneDen) | Cost, lock-in, off-brand UI, no value for already-released catalog | Native "listen everywhere" page (requirement already decided) |
| Storing `LIST_UUID` in client JS as a secret | It's a public endpoint; the UUID is not a credential — it's fine in client code | Document it clearly; double opt-in protects list quality |
| `@lucide/astro` | Different package from what the sibling site uses (`lucide-astro`); maintain consistency | `lucide-astro@^0.556.0` |
| Images in `public/` for cover art | Skips Sharp processing; no avif/webp output; no srcset | Put in `src/assets/`, use `<Picture />` |

---

## Version Compatibility Matrix

| Package | Compatible Astro | Notes |
|---------|-----------------|-------|
| `@astrojs/mdx@^4.x` | Astro 5.x | MDX 5.x targets Astro 6+; MDX 7.x targets Astro 7+ |
| `@astrojs/preact@^4.x` | Astro 5.x | Preact integration 5.x targets Astro 6+ |
| `@astrojs/sitemap@^3.x` | Astro 5.x | Sitemap 3.x is current and works with Astro 5-7 |
| `@tailwindcss/vite@^4.x` | Astro >=5.2.0 | `astro add tailwind` installs this; requires Astro >=5.2 |
| `sharp@^0.34.x` | Astro 5.x | Peer requirement for `astro:assets` image processing |
| `lucide-astro@^0.556.x` | Any Astro version | Plain Astro component package |

---

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

---

*Stack research for: DARLNG.com — static artist release hub*
*Researched: 2026-06-26*
