# Walking Skeleton — DARLNG (darlng.com)

**Phase:** 1 — Infrastructure & Deploy
**Generated:** 2026-08-04
**Scope note:** LOCAL-ONLY per the 2026-08-04 scope revision in `01-CONTEXT.md` and `.planning/CONTENT.md`. The skeleton is proven end-to-end on this machine; the user executes the live cutover from `website/DEPLOY.md`.

## Capability Proven End-to-End

> A browser request to the containerised site returns a real DARLNG page built by Astro 5, with a genuine 404 for missing URLs and correct per-path cache headers — exercised locally against `localhost:8080` before any live infrastructure is touched.

Every later phase (brand tokens, hero, discography, listen pages, newsletter island) adds content *inside* this proven pipeline. None of them re-litigate how a page gets from source to browser.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Astro 5, pinned `astro@^5.18.2` | Sibling-site parity (robindarlington.com runs `^5.16.6`); zero-JS by default; `output: 'static'` is the framework default. Astro 6/7 are explicitly forbidden by `CLAUDE.md` — they require Node ≥22.12 and drop the legacy content-collections API. |
| Styling | Tailwind 4 via `@tailwindcss/vite` in `vite.plugins` | Tailwind 4 is CSS-first (`@import "tailwindcss"` + `@theme {}` in global CSS). The `@astrojs/tailwind` integration is deprecated and breaks against v4 — forbidden by `CLAUDE.md`. No `tailwind.config.js`. |
| Interactive islands | Preact 10 via `@astrojs/preact@^4.1.3` | 3 KB runtime vs React's ~40 KB. Installed now (integration requires it) even though the first island ships in Phase 4 (newsletter form). Must stay on `^4.x` — `^5.x`+ target Astro 6+. |
| Content authoring | MDX via `@astrojs/mdx@^4.3.14` | Sibling parity. Release *data* is a plain typed TS file (`src/data/releases.ts`, Phase 2), not a content collection — decided pre-roadmap. |
| Images | Sharp `^0.34.5` + `astro:assets` | Cover art goes in `src/assets/` (never `public/`) so Sharp emits AVIF/WebP with `srcset`. Phase 2/3 consume this; Phase 1 only guarantees the dependency is present and the build succeeds. |
| Data layer | **None — no database, no server runtime** | v1 is a static release hub. The only external backend is Listmonk, reached from the browser by a direct `POST` to its public subscription endpoint (Phase 4). `output: 'static'` means there are no Astro API routes to proxy through. |
| Serving | Multi-stage `Dockerfile` (`node:22-alpine` build → `nginx:stable-alpine` serve) + custom `nginx.conf` | D-07. Coolify's Nixpacks "static site" mode redirects missing URLs to the homepage with a `200` instead of serving a real `404`, and gives no per-path cache-header control. |
| Stylesheet emission | `build: { inlineStylesheets: 'never' }` | Deliberate deviation from strict sibling-config parity. Astro's `'auto'` default inlines stylesheets under ~4KB into the HTML, which on a near-empty page leaves `dist/_astro/` empty — breaking roadmap success criterion 1 and leaving D-08's immutable rule with nothing to apply to. Hashed assets must exist as files for the cache policy to mean anything. |
| Cache policy | HTML `no-cache`; `/_astro/` `public, max-age=31536000, immutable` | D-08. `/_astro/` filenames are content-hashed by Astro, so they are safe to cache forever; HTML filenames are stable, so they must always revalidate or deploys stay invisible. |
| TLS / canonical host | Coolify's built-in Traefik + Let's Encrypt; www→apex and HTTP→HTTPS via Coolify's domain "Direction" setting | D-13/D-14. There is **no Cloudflare** in front of darlng.com — DNS is at LWS and the A record already points at the Coolify box. All Cloudflare "Full (Strict)" guidance in the general research is moot. The nginx container is HTTP-only on port 80 internally. |
| Deployment target | Coolify on Hetzner, Base Directory `website/`, Build Pack = Dockerfile, auto-deploy on push to `master` | D-09/D-10. Base Directory `website/` is what keeps the archived legacy tree out of the build context. |
| Directory layout | Site code in `website/`; archived 2019 placeholder in `legacy/`; planning artifacts in `.planning/` | `CLAUDE.md` constraint + D-12. `website/` is unambiguously the site; repo root holds only `CLAUDE.md`, `legacy/`, `website/`, `.planning/`. |
| Newsletter backend | Self-hosted Listmonk at `mail.darlng.com`, sending through Resend as an SMTP **client** on port 587 | D-02/D-03. Listmonk is not an MTA, so Hetzner's port-25 block is irrelevant — this reframing is the key insight of the phase. No self-hosted Postfix (D-04). |

## Stack Touched in Phase 1

- [x] Project scaffold — Astro 5 + Tailwind 4 + Preact + MDX + sitemap + Sharp, all versions pinned, `astro check` available
- [x] Routing — at least two real routes: `/` (`src/pages/index.astro`) and the 404 route (`src/pages/404.astro` → `dist/404.html`)
- [x] Build — `npm run build` emits `dist/` containing `index.html`, `404.html`, and a hashed `dist/_astro/` bundle
- [x] Packaging — multi-stage `Dockerfile`: the Node build stage and its `node_modules` never reach the shipped image
- [x] Serving — `nginx.conf` with a real 404 chain and path-differentiated `Cache-Control`, exercised via `docker run` + `curl` against `localhost:8080`
- [x] Deployment — **documented, not executed.** `website/DEPLOY.md` is a step-by-step runbook the user follows to perform every live action.
- [ ] Database — **N/A.** No data layer exists in v1. This checklist item from the generic skeleton template does not apply to a static release hub; substituting a fake DB round-trip to tick a box would misrepresent the architecture.
- [ ] Interactive UI element wired to an API — **deferred to Phase 4.** The first island is the newsletter form posting to Listmonk. Phase 1 ships the Preact integration so the island lands without re-architecting.

## Out of Scope (Deferred to Later Slices)

Explicit so later phases do not re-open Phase 1's minimalism:

- **All live infrastructure.** Coolify app creation, domain binding, Let's Encrypt issuance, the legacy cutover, Listmonk + Postgres deployment, Resend account/domain setup, LWS DNS records, mxtoolbox verification. Authored as a runbook; executed by the user.
- **Brand tokens, fonts, real layout.** The Phase 1 `index.astro` exists to prove the pipeline emits a hashed `_astro/` bundle. Phase 2 (BRAND-01..04) owns the visual system.
- **Icons and fonts.** `lucide-astro` and `@fontsource-variable/*` are deliberately not installed. `lucide-astro@0.556.0` was found upstream-deprecated in favour of `@lucide/astro` during research, which conflicts with `CLAUDE.md`'s sibling-parity directive — that conflict is resolved in whichever phase first needs icons, not here.
- **Release data.** `src/data/releases.ts`, cover art in `src/assets/releases/`, embeds — Phase 2.
- **Newsletter wiring.** `PUBLIC_LISTMONK_URL` / `PUBLIC_LISTMONK_LIST_UUID` consumption, CORS at the proxy, ALTCHA — Phase 4. Phase 1 must build cleanly with those variables **unset**.
- **SEO metadata and Core Web Vitals.** Phase 5. `@astrojs/sitemap` is installed and `site:` is set, so `sitemap-index.xml` falls out of the build for free, but per-page OG tags are not Phase 1's concern.
- **Deleting `legacy/`.** Archived, not removed. Revisit at milestone cleanup.

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering the decisions above:

- **Phase 2 — Brand, Data & Base Layout:** WCAG-verified dark token set in the `@theme {}` block, Fontsource fonts, base layout, `src/data/releases.ts`.
- **Phase 3 — Core Fan Experience:** hero for *Eseriani* with a facade-pattern embed, discography grid, `/listen/[slug]` pages, social follow links.
- **Phase 4 — Newsletter Fan Capture:** the first Preact island, posting to the Listmonk instance this phase's runbook stands up.
- **Phase 5 — SEO & Launch Polish:** per-page Open Graph, robots.txt, Core Web Vitals against the live domain.

## Skeleton Integrity Rules

1. A later phase that needs to change a row in **Architectural Decisions** must say so explicitly in its CONTEXT.md — this table is a contract, not a scratchpad.
2. The `/_astro/` immutable cache rule assumes Astro keeps content-hashing bundle filenames. Any future config change that disables hashing invalidates D-08 and must update `nginx.conf` in the same commit.
3. The Docker build context is `website/` only. Nothing outside `website/` may ever become a runtime dependency of the served image.
