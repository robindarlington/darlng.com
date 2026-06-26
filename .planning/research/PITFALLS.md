# Pitfalls Research

**Domain:** Static Astro artist release-hub site + self-hosted Listmonk newsletter + Coolify/Hetzner deploy
**Researched:** 2026-06-26
**Confidence:** HIGH (most pitfalls confirmed across multiple authoritative sources; Listmonk-specific items MEDIUM — community-sourced)

---

## Critical Pitfalls

### Pitfall 1: Neon Accent Colors Failing WCAG Contrast on Near-Black Backgrounds

**What goes wrong:**
Deep black backgrounds (#000 or near-black) paired with saturated neon/jewel accent colors (cyan, magenta, gold) look striking in mockups but frequently fail the WCAG AA 4.5:1 contrast ratio for body text and 3:1 for large text. The "jewel glow" effect that looks vivid at design time can test as low as 2.8:1 when measured with a contrast analyzer. Hover/focus states are especially easy to neglect.

**Why it happens:**
Designers eyeball saturation and perceived brightness rather than running luminance-based WCAG math. Saturated mid-range hues (e.g. `hsl(285, 70%, 55%)` purple) have luminance values that fall into a contrast dead zone on very dark surfaces — they look bright but aren't.

**How to avoid:**
- Pick a WCAG-safe palette up front: test every color token against the background at the design stage using the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/) or Figma's built-in A11y plugin.
- For neon accents used on interactive elements (links, CTAs, focus rings), target at least 4.5:1 — not just 3:1 — so that even if the element renders at reduced size it still passes.
- Use `text-shadow` sparingly; it can mask failed contrast rather than fix it.
- Audit all four interaction states: default, hover, active, focus. Each must individually pass.
- Avoid pure `#000000` as a background; use `#0a0a0a` or `#111` to reduce halation on OLED displays. This also slightly increases measured contrast for text above the threshold.

**Warning signs:**
- Figma mockups look "correct" but Lighthouse accessibility audit reports contrast failures.
- Any accent color that looks "pastel" on a dark background is suspect.
- Link colors that are only distinguished by underline from body text on dark surfaces.

**Phase to address:** UI/Design phase — before any component build. Establish a design token system with pre-tested contrast pairs. Do not leave this for QA.

---

### Pitfall 2: Text-Over-Cover-Art With No Controlled Background

**What goes wrong:**
Hero sections that overlay the release title and CTAs on cover art images fail readability at any point where the image is light or busy. Cover art for a moody RnB release may be dark center + bright edges, or vice versa. The text passes in the center crop but fails at tablet viewport widths where the image composition shifts.

**Why it happens:**
Developers add a single dark gradient overlay that works at one viewport size and assume it holds. But `object-position` shifts on responsive breakpoints, and the part of the image under the text changes.

**How to avoid:**
- Use a scrim: a dedicated `::before` pseudo-element with `background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)` placed between image and text layers. This ensures the text zone is always darkened regardless of image content.
- For full-bleed hero areas, additionally apply a subtle vignette on all edges: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)`.
- Keep all hero text within a controlled z-index layer above the scrim, never directly on the image.
- After the build, screenshot the hero at 320px, 768px, 1280px, and 1920px widths and run each through a contrast checker.

**Warning signs:**
- Hero looks fine at the development viewport (typically 1440px) but shipping at mobile widths exposes a bright region of the image under the heading.
- Responsive image `object-position` is set to `center center` and never revisited for specific release artwork.

**Phase to address:** Hero/layout build phase. Establish the scrim pattern as the default for any image-backed text section before plugging in real artwork.

---

### Pitfall 3: Spotify/YouTube Embed Tanking LCP and CLS

**What goes wrong:**
Dropping a Spotify or YouTube `<iframe>` in the above-the-fold hero without dimensions or lazy loading causes two simultaneous problems: (1) the iframe initiates a ~600 KB JS bundle download from `open.spotify.com` on first paint, stealing main-thread time from the hero image and destroying LCP; (2) if the iframe has no reserved height, the page jumps when it loads — a CLS violation.

**Why it happens:**
Copying the platform's embed snippet verbatim and pasting it into the template. The default snippets don't include `loading="lazy"`, explicit `width`/`height`, or an `aspect-ratio` wrapper — they assume you'll handle that.

**How to avoid:**
- For any embed below the fold (discography section, catalog): add `loading="lazy"` to the iframe.
- For the above-the-fold hero embed (the Eseriani player): use the **facade pattern** — render a static image of the cover art + a play icon; replace with the real iframe only when the user clicks. This eliminates the third-party network hit from LCP entirely.
- Always wrap iframes in an `aspect-ratio` container so layout space is reserved before the embed initializes:
  ```html
  <div style="aspect-ratio: 16/9; width: 100%;">
    <iframe loading="lazy" style="width:100%;height:100%;" ...></iframe>
  </div>
  ```
- For Spotify, the compact embed is `352px × 152px`; always set explicit `width` and `height` attributes.

**Warning signs:**
- PageSpeed Insights shows "Eliminate render-blocking resources" pointing to `open.spotify.com` or `youtube.com`.
- CLS score > 0.1 in Lab data.
- LCP element is the iframe placeholder image rather than your own hero art.

**Phase to address:** Hero build phase (facade pattern). Embed/performance audit pass before first deploy.

---

### Pitfall 4: Listmonk CORS Rejection on Cross-Origin Form POST

**What goes wrong:**
The static site lives at `darlng.com`; Listmonk lives at (e.g.) `mail.darlng.com` or a separate Hetzner IP. The signup form `fetch()` POSTs cross-origin to Listmonk's `/api/public/subscription`. The browser sends a preflight OPTIONS request. If Listmonk or the nginx proxy in front of it does not return `Access-Control-Allow-Origin: https://darlng.com` (and `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`), the browser rejects the response before the user sees any feedback, and signups silently fail.

**Why it happens:**
Listmonk's built-in CORS setting (`[cors]` in `config.toml`) exists but is easily overlooked. There is also a conflict risk: if *both* nginx and Listmonk's app-layer CORS emit the header, browsers reject the duplicate. Confirmed in [listmonk#1521](https://github.com/knadh/listmonk/issues/1521) and [listmonk#2724](https://github.com/knadh/listmonk/issues/2724).

**How to avoid:**
- Pick one CORS authority: either Listmonk's `config.toml` `[cors]` block, or an nginx `add_header` directive — not both.
- Recommended: configure CORS at the nginx/Traefik reverse proxy level in front of Listmonk, since Coolify's Traefik is already the TLS terminator.
- The nginx config must handle OPTIONS preflight explicitly and return 204:
  ```nginx
  if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' 'https://darlng.com' always;
    add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    return 204;
  }
  add_header 'Access-Control-Allow-Origin' 'https://darlng.com' always;
  ```
- Include the `always` flag on every `add_header` directive so headers appear on 4xx/5xx responses too (browsers still need them on error responses).
- Test cross-origin requests from the deployed static site, not just from `localhost`.

**Warning signs:**
- Sign-up form submits, UI gives no error, but no confirmation email arrives.
- Browser DevTools Network tab shows the OPTIONS preflight returning 405 or missing CORS headers.
- Working locally (same origin, no preflight) but broken on production.

**Phase to address:** Newsletter integration phase — before any user-facing launch. Test with a real cross-origin request from the deployed domain.

---

### Pitfall 5: Listmonk Bot Signups Without CAPTCHA

**What goes wrong:**
The public subscription endpoint (`/api/public/subscription`) is unauthenticated by design. Without a CAPTCHA, bots will find it — either crawling the HTML for the endpoint URL, or by discovering Listmonk's standard paths — and spam it. Even with double opt-in, this floods the configured mail relay with confirmation emails, which burns sending reputation and may trigger spam filter scoring on your domain.

**Why it happens:**
CAPTCHA feels like friction for a launch MVP and gets deferred. Listmonk's default install has no CAPTCHA enabled.

**How to avoid:**
- Enable ALTCHA (Listmonk's current preferred CAPTCHA, self-hosted, privacy-first, GDPR/WCAG compliant) in Listmonk Settings → Security before the form goes live.
- ALTCHA works via proof-of-work in the browser — no user puzzle, no third-party cookie. It's the lowest-friction protection available.
- If using a custom HTML subscription form (via `--static-dir`), update your template to include the ALTCHA widget script and hidden field — the template changed when ALTCHA was introduced and old custom templates silently skip CAPTCHA validation.
- Additionally, add nginx-level rate limiting on the Listmonk subscription endpoint (`limit_req_zone`): this caps burst attempts even if CAPTCHA is bypassed.

**Warning signs:**
- Subscriber list grows by hundreds with no corresponding traffic uptick.
- Mail relay logs show thousands of "confirm your subscription" sends per hour.
- Bounce/complaint rate spikes from confirmation emails to invalid addresses.

**Phase to address:** Newsletter integration phase — CAPTCHA must be live before any public form URL is exposed, including in staging.

---

### Pitfall 6: Exposing the Listmonk Admin Interface Without Auth Hardening

**What goes wrong:**
Coolify exposes Listmonk at a subdomain, and the admin interface (`/`) is reachable from the open internet. Default Listmonk credentials (`admin`/`listmonk`) are well-known. If the Coolify deployment does not enforce a strong password on first run, the admin panel is effectively open.

**Why it happens:**
Self-hosted tooling often prioritizes getting started quickly. Listmonk requires an initial admin setup, but that setup is done via a web UI that's already publicly accessible.

**How to avoid:**
- Change the admin password immediately after first deploy, before adding the real domain.
- Consider restricting the `/` admin path to a Coolify-level IP allowlist or HTTP Basic Auth header at the nginx/Traefik layer. Only the public `/api/public/subscription` and `/subscription/*` paths need to be internet-accessible.
- Do not deploy Listmonk on the same domain/subdomain as the artist site (e.g. `darlng.com/listmonk`). Use a separate subdomain (`mail.darlng.com`) so Coolify's per-service access controls apply.
- Enable 2FA on the Listmonk admin account once available (tracked upstream).

**Warning signs:**
- Listmonk admin URL is indexed in Google (check `site:yourdomain.com/admin`).
- Auth logs show repeated login attempts.

**Phase to address:** Infrastructure setup phase — harden before configuring any lists or subscribers.

---

### Pitfall 7: Coolify Static Deploy — Wrong Build Output Path or Missing Nixpacks Detection

**What goes wrong:**
The Astro source lives in `website/` (not the repo root). Coolify Nixpacks auto-detects the build command from `package.json`, but if the `package.json` is at `website/package.json`, the root directory in Coolify must be set to `website/`. Leaving it at repo root causes Nixpacks to find the old stale `package.json` (if any) or fail to detect the project type, resulting in a failed build or serving the legacy placeholder files from the repo root's `index.html`.

**Why it happens:**
Monorepo layout where the Astro project is in a subdirectory. Coolify's "Base Directory" field defaults to `/` (repo root) and developers forget to override it.

**How to avoid:**
- In Coolify's application config, set **Base Directory** to `website/` and **Publish Directory** to `dist` (relative to base directory). Coolify will then run `npm run build` from `website/` and serve `website/dist/`.
- Verify by checking deploy logs: the Nixpacks build step should show "Detected Astro" and run `astro build`, not a generic static server.
- After first deploy, confirm the live site shows the new Astro build and not the old `index.html` from the repo root.

**Warning signs:**
- Coolify deploy succeeds but visiting the domain shows the old 2019 placeholder site.
- Build log shows Nixpacks installing dependencies from a `package.json` you don't recognize.
- No `_astro/` directory visible in the served output (Astro always creates this for hashed assets).

**Phase to address:** First deploy phase — verify build path as the very first deploy step before any content is added.

---

### Pitfall 8: www/Apex Domain Mismatch and "Too Many Redirects" With Coolify + Traefik

**What goes wrong:**
Coolify uses Traefik as the reverse proxy/TLS terminator. If you configure `darlng.com` but also want `www.darlng.com` to redirect to the apex (or vice versa), Coolify does not automatically set this up. Assigning both hostnames to the same Coolify application serves content at both URLs without a redirect, creating a duplicate-content SEO issue. Attempting to force HTTPS in both Cloudflare and Traefik simultaneously creates a "Too many redirects" loop.

**Why it happens:**
Developers add both `www` and apex to Coolify's Domains field expecting Coolify to handle the canonical redirect. It doesn't — it treats them as equivalent aliases.

**How to avoid:**
- Choose one canonical URL (recommend: `darlng.com` apex — shorter for fans to type). Configure `astro.config.mjs` `site:` to the canonical URL.
- Handle `www` → apex redirect at the DNS/CDN layer. If using Cloudflare: set up a single Redirect Rule: `concat("https://darlng.com", http.request.uri.path)` triggered on hostname `www.darlng.com`. This avoids any Traefik/Coolify configuration entirely.
- In Coolify, set the application domain to `darlng.com` only. Set Cloudflare SSL mode to **Full (Strict)** — not Flexible — to avoid the "Cloudflare re-encrypts what Coolify already redirected to HTTPS" loop.

**Warning signs:**
- Both `darlng.com` and `www.darlng.com` return 200 with identical content.
- Browser shows "ERR_TOO_MANY_REDIRECTS" on the www variant.
- `curl -I https://www.darlng.com` returns anything other than 301.

**Phase to address:** Domain/DNS setup phase — canonical URL decision must be made before launch and baked into `astro.config.mjs`.

---

### Pitfall 9: Nginx Caching — HTML Cached Aggressively, Assets Not Cached at All

**What goes wrong:**
Two opposite mistakes happen in practice: (A) HTML pages get `Cache-Control: public, max-age=31536000` because a blanket rule catches all files, meaning deploys don't reach users for a year. (B) Astro's hashed `_astro/` assets get `no-cache` or short TTLs because no specific location block targets them, wasting CDN and browser cache.

**Why it happens:**
The Coolify static build pack's default nginx config doesn't differentiate between HTML and fingerprinted assets. Developers who add a custom nginx config often apply one blanket `expires` value.

**How to avoid:**
- Use a custom Dockerfile for Coolify's static deploy (not the built-in static build pack) so you can ship your own `nginx.conf`.
- Differentiate by path:
  - `location ~* /_astro/` → `Cache-Control: public, max-age=31536000, immutable` (hashed: safe to cache forever)
  - `location ~* \.(html)$` → `Cache-Control: no-cache` (always revalidated; new deploys surface immediately)
  - `location ~* \.(jpg|jpeg|png|webp|avif|gif|ico|woff2)$` → `Cache-Control: public, max-age=604800` (1 week; not hashed but changes rarely)
- The `immutable` flag is the critical piece: it tells browsers not to revalidate the file even if it's expired. Safe only for content-hashed filenames.

**Warning signs:**
- After deploying a site update, users still see old content after hard refresh.
- Lighthouse shows `Serve static assets with an efficient cache policy` for `_astro/` files.
- `curl -I https://darlng.com/index.html | grep cache-control` shows `max-age=31536000`.

**Phase to address:** Infrastructure/deploy phase — alongside the Dockerfile and nginx.conf.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using third-party Spotify smart link instead of own listen page | Zero build time | No analytics ownership, third-party branding, can change/break | Never — the project explicitly decided against this |
| Hardcoding streaming URLs as plain `<a>` tags instead of a data-driven list | Fast to ship | Adding a new release means editing multiple files; no consistency | MVP only if data structure is added in next phase |
| Single og:image for entire site | One image to maintain | Every page share looks the same; no per-release social cards | Acceptable for v1 if image is release-specific hero art |
| Skipping `<picture>` / `srcset` on cover art | Simpler HTML | Mobile users download full-res images intended for desktop | Never — Sharp is already in the stack; use `<Image />` from `@astrojs/image` |
| Embedding iframes with no facade or lazy loading | Plays immediately | Destroys LCP; mobile users pay for 600 KB JS on page load | Never for above-the-fold embeds |
| Serving Listmonk on the same Coolify app as the static site | One service to manage | Mixes static file serving with app server; restart of one affects the other | Never — keep as separate Coolify services |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Listmonk subscription API | POSTing `application/x-www-form-urlencoded` instead of JSON | Listmonk's `/api/public/subscription` expects JSON `Content-Type: application/json` |
| Listmonk CORS | Both nginx and Listmonk config.toml emit CORS headers → duplicate headers → browser rejects | Configure CORS in exactly one place; disable the other |
| Spotify embed | Using default embed snippet with no `loading="lazy"` | Always add `loading="lazy"` and an `aspect-ratio` wrapper |
| YouTube embed | Using `youtube.com` domain in iframe `src` | Always use `youtube-nocookie.com` for privacy compliance; avoids cookie consent requirement in EU |
| YouTube autoplay | Setting `autoplay=1` without `mute=1` | Browsers block unmuted autoplay; always pair `autoplay=1&mute=1` |
| Coolify + Cloudflare | Setting Cloudflare SSL to "Flexible" while Traefik also forces HTTPS | Set Cloudflare to "Full (Strict)" — both ends must agree on TLS |
| Astro `site:` config | Leaving `site:` unset or wrong domain | `site:` is required for sitemap, canonical tags, and Open Graph absolute URLs to resolve correctly |
| Listmonk double opt-in | Using `optin: single` on the list | GDPR requires documented proof of consent; always use `optin: double` for EU audiences |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-res cover art JPEGs served as-is | Lighthouse "Properly size images" failure; mobile LCP > 4s | Use Astro's `<Image />` component with Sharp to emit WebP/AVIF at multiple sizes; add `srcset` | On any mobile connection; 3000×3000px press photo served at 400px display width |
| Multiple Spotify iframes on one page (catalog) | Page TTI > 5s; each iframe spins up its own player runtime | Facade pattern for all non-hero embeds; real iframe injected on click only | Any page with 3+ iframes |
| Google Fonts over network instead of Fontsource | Layout shift from FOIT; extra DNS lookup | Use Fontsource (already in stack) with `font-display: swap`; fonts are self-hosted at build time | Inconsistent on slow connections; affects CLS score |
| No compression on static files | Transfer sizes 3–5× larger than necessary | Nginx Brotli + gzip static pre-compression (`brotli_static on; gzip_static on;`) | Every page load; most visible on mobile |
| Unoptimized SVG icon files | Minor but cumulative payload inflation | Run SVGs through SVGO at build time or use Lucide icons (already tree-shaken by the stack) | Low traffic — becomes meaningful when pages are hot |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Listmonk admin at public subdomain with default password | Full list exfiltration; spam campaign from your domain | Change password before DNS propagation; restrict admin path to IP allowlist in Traefik |
| Embedding Spotify/YouTube without a cookie consent gate | GDPR/ePrivacy violation in EU; fines up to 4% global revenue | Use YouTube's `youtube-nocookie.com` domain (no consent needed for embed itself); for Spotify consider lazy-load on user click (defer cookie setting) |
| Newsletter form exposing list UUID in client HTML | Bots can enumerate and spam specific list IDs | This is expected for public lists — mitigate with CAPTCHA and rate limiting, not by hiding the UUID |
| Missing `Content-Security-Policy` headers | XSS vector if ever user content is added | Set CSP via nginx headers; allow `frame-src open.spotify.com www.youtube-nocookie.com` for embeds |
| Open-graph `og:image` using relative URL | Social platforms can't fetch the image; share previews show blank | Always use absolute URLs: `https://darlng.com/og/eseriani.jpg` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Newsletter form gives no feedback after submit | Users don't know if they signed up; they try again → duplicate entries | Show an explicit success state ("Check your inbox to confirm") and disable the submit button after first click |
| Streaming CTAs only link to Spotify | Non-Spotify users (Apple Music, YouTube Music, Tidal) bounce immediately | Show all major platforms; the "listen everywhere" page is a core requirement, not optional |
| Focus indicator removed ("outline: none" global reset) | Keyboard-only users cannot navigate | Never remove focus indicators; use custom ring styles that match the dark aesthetic instead |
| Autoplay on page load for embedded player | Users on mobile or shared audio contexts are startled; many browsers block it anyway | Default to paused; let user initiate playback |
| Newsletter double opt-in email goes to spam | Subscriber is confused; blames the artist | Ensure Listmonk's sending domain has SPF, DKIM, and DMARC records configured before first send |

---

## "Looks Done But Isn't" Checklist

- [ ] **Newsletter form:** CORS verified from the live deployed domain (not localhost). Submitting the form actually delivers a confirmation email.
- [ ] **Newsletter double opt-in:** Opt-in confirmation email is received and styled (not Listmonk default template). Click-through confirms subscription.
- [ ] **CAPTCHA:** ALTCHA is visibly present and blocks a test submission with no JS or a bot-like rapid POST. (Many deploys have CAPTCHA configured in settings but the custom form template hasn't been updated to include the widget.)
- [ ] **Canonical URL:** `curl -I https://www.darlng.com` returns a 301 to `https://darlng.com`, not a 200.
- [ ] **HTTPS only:** `curl -I http://darlng.com` returns 301 to HTTPS. No mixed-content warnings in browser console.
- [ ] **Open Graph:** Paste `https://darlng.com` into [https://opengraph.xyz](https://opengraph.xyz). Confirm image, title, and description all resolve correctly.
- [ ] **Contrast:** Run Axe or WAVE against the live deployed site (not the dev server). Zero color contrast violations.
- [ ] **Embeds:** PageSpeed Insights run on the live hero page shows LCP element is the Astro-served hero image, not an iframe.
- [ ] **Image formats:** Inspect network panel on mobile viewport. No JPEG/PNG over 200 KB served to a modern browser that accepts WebP/AVIF.
- [ ] **SPF/DKIM/DMARC:** Use [https://mxtoolbox.com](https://mxtoolbox.com) to verify all three DNS records for the sending domain. Listmonk confirmation emails must not land in spam.
- [ ] **Streaming links:** Manually verify every platform link (Spotify, Apple Music, YouTube, Tidal, etc.) from the listen-everywhere page. Third-party deep links rot when artists change distributor.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CORS blocking all signups since launch | MEDIUM | Add CORS header to nginx config on Listmonk server; redeploy; no data loss but signups during outage are lost |
| HTML pages cached for 1 year on CDN | MEDIUM | Set correct `Cache-Control: no-cache` on HTML; purge Cloudflare cache via API; no data loss |
| Bot spam flooded subscriber list | HIGH | Enable CAPTCHA; bulk-delete unconfirmed subscribers via Listmonk admin; check mail relay sending reputation; may need to warm IP again |
| Wrong Coolify base directory → old site deployed | LOW | Change Base Directory in Coolify to `website/`; redeploy |
| www and apex both serving content (duplicate SEO) | LOW-MEDIUM | Add Cloudflare redirect rule; submit updated sitemap to Google Search Console; disavow duplicate URLs via canonical tags |
| Spotify embeds destroying LCP on launch | MEDIUM | Implement facade pattern; deploy updated components; no data loss but requires code change + redeploy |
| Admin panel compromised | HIGH | Rotate credentials immediately; audit subscriber list and send history; rotate mail relay API keys; consider IP allowlisting Listmonk admin path |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Neon contrast failures | Design/token setup phase | Axe automated scan passes; manual check of all interactive states |
| Text-over-image legibility | Hero component build | Screenshot at 320px/768px/1280px; contrast checker on each |
| Embed LCP/CLS | Hero + catalog component build | PageSpeed Insights shows LCP ≥ 2.5s met; CLS < 0.1 |
| Listmonk CORS | Newsletter integration phase | Real POST from live domain returns 200; confirmation email received |
| Listmonk bot signups | Newsletter integration phase (before any public URL) | ALTCHA widget visible; rapid-fire POST returns 400 |
| Listmonk admin hardening | Infrastructure/Coolify setup phase | Admin path requires strong credentials; optionally IP-restricted |
| Coolify wrong base directory | First deploy phase | `_astro/` directory present in served output; correct site version displayed |
| www/apex redirect + TLS loop | DNS/domain setup phase | `curl -I https://www.darlng.com` → 301; no redirect loop |
| Nginx caching misconfiguration | Infrastructure phase (Dockerfile + nginx.conf) | `curl -I` on HTML → `no-cache`; on `/_astro/` → `immutable` |
| Image weight / no WebP | Image/performance phase | No PNG/JPEG > 200 KB in mobile network panel; WebP confirmed |
| SPF/DKIM/DMARC missing | Newsletter integration phase | mxtoolbox.com shows all three pass; test email not in spam |
| Open Graph mistakes | SEO/meta phase | opengraph.xyz shows correct image + title on all key pages |
| Structured data missing | SEO/meta phase | Rich Results Test passes for MusicAlbum / MusicGroup schema |

---

## Sources

- [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/) — WCAG contrast requirements
- [Primer: Color Considerations (Accessibility)](https://primer.style/accessibility/design-guidance/color-considerations/) — Dark mode token strategy
- [Smashing Magazine: Accessible Text Over Images](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) — Scrim and overlay techniques
- [CSS-Tricks: Text on Images](https://css-tricks.com/design-considerations-text-images/) — Gradient overlay patterns
- [NNGroup: Text Over Images](https://www.nngroup.com/articles/text-over-images/) — Legibility research
- [Listmonk issue #2724: CORS ALTCHA CAPTCHA](https://github.com/knadh/listmonk/issues/2724) — Confirmed CORS issue with ALTCHA on subdomain
- [Listmonk issue #1521: Allow CORS Origin fixation](https://github.com/knadh/listmonk/issues/1521) — Duplicate headers problem
- [Listmonk issue #541: Honeypot/spam protection](https://github.com/knadh/listmonk/issues/541) — Bot protection history
- [Listmonk issue #2530: Disable /subscription/form when public form disabled](https://github.com/knadh/listmonk/issues/2530) — Endpoint exposure concern
- [ALTCHA: Self-hosted CAPTCHA](https://altcha.org/) — Listmonk's preferred CAPTCHA solution
- [Coolify Docs: Static Build Packs](https://coolify.io/docs/applications/build-packs/static) — Build pack behavior
- [Coolify Discussion #1999: www redirect](https://github.com/coollabsio/coolify/discussions/1999) — Confirmed Coolify doesn't auto-redirect www
- [Eventuallymaking.io: Coolify + Traefik custom domains](https://eventuallymaking.io/p/managing-custom-domains-and-dynamic-ssl-with-coolify-and-traefik) — TLS configuration pitfalls
- [Crockettford: Astro with Coolify](https://crockettford.dev/blog/astro-with-coolify) — Base directory gotcha
- [DEV.to: Astro + Nginx Brotli guide](https://dev.to/lovestaco/serving-an-astro-static-site-with-brotli-and-gzip-on-nginx-a-complete-practical-guide-3ef7) — Caching header configuration
- [Astro GitHub #9106: Assets Cache-Control](https://github.com/withastro/astro/issues/9106) — Discussion on aggressive asset caching
- [web.dev: Optimize CLS](https://web.dev/articles/optimize-cls) — iframe CLS prevention
- [YouTube Embedded Players: Player Parameters](https://developers.google.com/youtube/player_parameters) — Autoplay and privacy mode docs
- [Tidy Design: Privacy Enhanced YouTube Embeds](https://www.tidydesign.com/blog/privacy-enhanced-youtube-embeds/) — `youtube-nocookie.com` guidance
- [legalweb.io: Spotify GDPR compliance](https://legalweb.io/en/gdpr/embeddings_spotify/) — Spotify embed consent requirements
- [Schema.org: MusicRecording](https://schema.org/MusicRecording) — Structured data type reference
- [Schema.org: MusicAlbum](https://schema.org/MusicAlbum) — Structured data type reference
- [inclassics.com: Schema Markup for Musicians](https://inclassics.com/blog/seo-for-musicians-schema-markup) — Music site SEO structured data
- [DEV.to: 7 Open Graph Mistakes](https://dev.to/levinunnink/7-open-graph-tag-mistakes-that-make-your-links-look-broken-5h2g) — OG implementation errors

---
*Pitfalls research for: Static Astro artist release-hub + Listmonk newsletter + Coolify/Hetzner deploy*
*Researched: 2026-06-26*
