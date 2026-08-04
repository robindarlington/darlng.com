# Phase 1: Infrastructure & Deploy - Research

**Researched:** 2026-08-04
**Domain:** Astro 5 static-site scaffold, Docker/nginx packaging, and a deploy runbook for a Coolify-on-Hetzner target the user operates by hand
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**AMENDED 2026-08-04 — Scope Revision (overrides conflicting decisions below): LOCAL-ONLY BUILD.** The user will personally handle all live infrastructure after approving the local build. This phase now delivers (code artifacts only, all local):
- Astro 5 scaffold in `website/` per INFRA-01 (pinned versions, mirror sibling site config) — `npm run build` produces clean `dist/`
- Multi-stage `website/Dockerfile` + `website/nginx.conf` per D-07/D-08 (404 handling, cache headers) — build the Docker image locally IF Docker is available; otherwise validate nginx.conf syntax and dist/ contents
- Legacy root files moved into `legacy/` per D-12
- `website/DEPLOY.md` runbook covering everything the user does themselves: Coolify app creation (Base Directory `website/`, Dockerfile build pack), domain + TLS via Traefik/Let's Encrypt, www→apex + HTTP→HTTPS redirects (D-13/D-14/D-15), Listmonk+Postgres deploy at mail.darlng.com, Resend SMTP relay on 587 (D-03), SPF/DKIM/DMARC at LWS, fan list creation with double opt-in, and where to paste `PUBLIC_LISTMONK_URL` / `PUBLIC_LISTMONK_LIST_UUID` env vars

DEFERRED to user's deploy step (do NOT attempt): D-01..D-06 live Listmonk/Resend/DNS work, D-10 Coolify app wiring, D-15 cutover, and roadmap success criteria 2–5 (live domain checks). Local verification instead: clean build, dist/ serves correctly via local preview, nginx.conf encodes the required cache-header/404 behavior.

**Phase Boundary:** Stand up the delivery pipeline for darlng.com: an Astro 5 project scaffolded in `website/` that builds to static `dist/`, deployed via Coolify-on-Hetzner behind a custom Dockerfile+nginx, resolving at `https://darlng.com` with correct TLS/redirects/cache headers — plus a freshly deployed, deliverability-ready Listmonk instance at `mail.darlng.com` ready for Phase 4 newsletter wiring. This phase is plumbing only. No site UI, brand tokens, or content — those are Phase 2+.

**Listmonk & Email Deliverability:**
- D-01: Deploy Listmonk fresh on Coolify this phase (not currently running), including its required Postgres database.
- D-02: Listmonk lives at `mail.darlng.com`.
- D-03: Listmonk sends via Resend as a transactional SMTP relay — Listmonk configured as an SMTP client pointing at Resend's submission endpoint on port 587. Sidesteps Hetzner's port-25 block (which only affects direct MTA delivery). No self-hosted Postfix/MTA.
- D-04: Rejected — ngrok/local-box/self-hosted mail server. A residential/tunneled IP has no sending reputation or PTR record and would land double-opt-in confirmations in spam.
- D-05: SPF, DKIM, DMARC for `darlng.com` must be configured via Resend's DNS records. Verify with a tool (e.g. mxtoolbox) before considering the phase done.
- D-06: Create a fan list in Listmonk with double opt-in enabled; log in with a non-default admin password. List UUID is an output of this phase, consumed by Phase 4 env var `PUBLIC_LISTMONK_LIST_UUID`.

**Static Site Deploy:**
- D-07: Serve the static build via a multi-stage Dockerfile + custom `nginx.conf`, both in `website/` — NOT the Nixpacks "static site" checkbox. Rationale: full control over 404 handling and explicit cache headers.
- D-08: Cache headers — HTML (`index.html` etc.) → `Cache-Control: no-cache`; hashed `_astro/` assets → `Cache-Control: public, max-age=31536000, immutable`.
- D-09: Coolify Base Directory = `website/` so legacy root files are never served and the Dockerfile/build run from the site subdirectory.
- D-10: Coolify builds from the existing GitHub remote (`git@github.com:robindarlington/darlng.com.git`), auto-deploying on push to `master` (webhook-driven CD).

**Legacy Cutover:**
- D-11: The old 2019 placeholder is currently live at darlng.com — this phase is a real production cutover, not a first deploy.
- D-12: Move legacy root files (`index.html`, `randevu.mp3`, `scss/`, `js/`, `css/`, `fonts/`, `img/`, `json/`, `files/`, `Gruntfile.js`, `package.json`, `yarn.lock`) into a `legacy/` folder. Git history preserves them regardless.

**DNS & TLS:**
- D-13: DNS is managed at registrar LWS (not Cloudflare); the A record already points at the Coolify box. No Cloudflare in front — the Cloudflare "Full (Strict)" SSL and Cloudflare redirect-rule guidance from general research is moot/does not apply.
- D-14: TLS via Coolify's built-in Traefik + Let's Encrypt for both `darlng.com` and `mail.darlng.com`. www→apex and HTTP→HTTPS redirects are configured in Coolify's domain settings, not at a CDN.
- D-15: Cutover strategy — flip directly. DNS already resolves to Coolify, so the cutover is pointing the Coolify application at the new `website/` build and letting Let's Encrypt (HTTP-01) issue.

### Claude's Discretion
- Exact Dockerfile base images (e.g. `node:lts-alpine` build stage → `nginx:alpine` serve stage) and nginx.conf specifics — standard patterns, planner/executor choose.
- Whether Listmonk + Postgres are deployed as a Coolify one-click/service template vs. a compose stack — pick whatever is cleanest on this Coolify version.
- Resend account/domain setup specifics (whether to use a `send.darlng.com` subdomain for DKIM alignment) — follow Resend's recommended setup.

### Deferred Ideas (OUT OF SCOPE)
- Newsletter form ↔ Listmonk wiring, CORS at the proxy, ALTCHA anti-spam — Phase 4 (Newsletter Fan Capture). This phase only makes Listmonk exist and be deliverability-ready; it does not wire the site form.
- `PUBLIC_LISTMONK_LIST_UUID` / `PUBLIC_LISTMONK_URL` consumption in the build — Phase 4. This phase produces the values; Phase 4 consumes them.
- Deleting the `legacy/` folder entirely — deferred; keep it archived for now, revisit at milestone cleanup.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| INFRA-01 | Astro 5 project scaffolded in `website/` subdirectory, pinned to `astro@^5.18.2` with aligned `@astrojs/mdx@^4.x` + `@astrojs/preact@^4.x` + Tailwind 4, building cleanly to static `dist/` | Standard Stack section — all versions re-verified against npm registry this session; Pattern 3 gives the exact `astro.config.mjs` shape read verbatim from the sibling site; Installation section gives exact pinned-version install commands |
| INFRA-02 | Site deploys to existing Coolify-on-Hetzner setup with Base Directory `website/`, a custom `nginx.conf` (correct 404 handling + cache headers), and serves the static build at darlng.com | Architecture Patterns Pattern 1 (multi-stage Dockerfile) and Pattern 2 (path-differentiated cache headers) give copy-ready Dockerfile/nginx.conf; Common Pitfalls 1–2 document the exact failure modes to verify against locally |
| INFRA-03 | Apex/www + HTTPS resolve correctly with no redirect loops (via Coolify's Traefik/Let's Encrypt, NOT Cloudflare — D-13 overrides the general research's Cloudflare guidance) | Don't Hand-Roll table (Coolify's built-in "Direction" setting) and Common Pitfalls 3 document the mechanism and failure mode; DEPLOY.md skeleton in Code Examples gives the exact runbook checklist for the user's live step. Live verification is deferred per scope revision — this phase documents the runbook only. |
| INFRA-04 | Self-hosted Listmonk instance is reachable and configured (target list created, double opt-in enabled) so the newsletter form has a live backend | Don't Hand-Roll table (Coolify one-click Listmonk template) and Common Pitfalls 4 document the deploy mechanism and a known bug to avoid; DEPLOY.md skeleton documents SMTP relay config (Resend, port 587) and DNS records (SPF/DKIM/DMARC). Live verification is deferred per scope revision — this phase documents the runbook only, per the LOCAL-ONLY BUILD amendment. |
</phase_requirements>

## Summary

Phase 1, per the 2026-08-04 scope revision, is a **local-only build**: produce a clean Astro 5 scaffold in `website/` that mirrors the sibling site's stack and config shape, package it behind a multi-stage `Dockerfile` + custom `nginx.conf` that encodes the required 404 and cache-header behavior, move the legacy 2019 placeholder into `legacy/`, and write a `website/DEPLOY.md` runbook detailed enough that the user can execute every live step (Coolify app creation, TLS, Listmonk+Postgres, Resend SMTP relay, LWS DNS records) without further engineering input. No live infrastructure is touched or verified this phase — verification is local: `npm run build` succeeds, `dist/` has the expected shape, `nginx.conf` is syntactically valid and encodes the right rules, and (if Docker is available, which it is on this machine) the image builds and serves correctly via `docker run` + `curl` against `localhost`.

All core stack package versions pinned in `.planning/research/STACK.md` and `CLAUDE.md` were re-verified against the live npm registry today: every pinned version (`astro@5.18.2`, `@astrojs/mdx@4.3.14`, `@astrojs/preact@4.1.3`, `@astrojs/sitemap@3.7.3`, `sharp@0.34.5`, `typescript@5.9.3`, `@astrojs/check@0.9.9`, `preact@10.27.2`, `@tailwindcss/vite@4.1.16`, `tailwindcss@4.1.16`) exists and resolves cleanly. The registry's `latest` tags have moved on since STACK.md was written (`astro@latest` is now `7.1.6`, `typescript@latest` is `7.0.2`) — this makes the deliberate pin to Astro 5.x *more* important, not less; do not let `npm install` without exact version pins silently pull Astro 7. Local environment checks (Node 24.9.0, npm 11.12.1, Docker 28.1.1) all exceed every package's minimum engine requirement, so no environment blockers exist for this phase.

The three DEPLOY.md-relevant unknowns not fully covered in the general project research — Coolify's native www→apex/HTTPS redirect mechanism, Listmonk's one-click Coolify service, and Resend's exact SMTP/DNS values — were researched this session and are documented below with concrete values to write into the runbook.

**Primary recommendation:** Scaffold `website/` with the exact package set and `astro.config.mjs` shape from the sibling site (changing only `site:`), write the Dockerfile/nginx.conf using path-specific `Cache-Control` blocks (not a blanket rule), move the ten legacy root artifacts into `legacy/` verbatim, and write DEPLOY.md as a literal step-by-step checklist using Coolify's built-in "Direction" domain-redirect setting (not hand-written Traefik labels) plus Resend's dashboard-generated DNS records (do not hand-type SPF/DKIM record values — they are account-specific).

## Project Constraints (from CLAUDE.md)

Extracted directives the planner must honor, treated with the same authority as locked CONTEXT.md decisions:

- **Tech stack:** Astro 5 + Tailwind 4 + Preact + MDX, with `@astrojs/sitemap`, Fontsource fonts, Lucide icons, Sharp — mirror robindarlington.com so the two sites share tooling and mental model.
- **Location:** All new site code in `website/` subdirectory — keeps it isolated from the legacy placeholder at repo root.
- **Deployment:** Static build deployed via existing Coolify-on-Hetzner setup (Dockerfile/nginx serving static `dist/`) — user's own infrastructure, no new SaaS hosting.
- **Forbidden:** `@astrojs/tailwind` (deprecated, breaks with Tailwind v4) — use `@tailwindcss/vite` in `vite.plugins` instead.
- **Forbidden:** `astro@latest` (7.x) for this project — pin to `astro@^5.18.2`. Confirmed still correct this session; registry `latest` has moved to 7.1.6.
- **Forbidden:** `tailwind.config.js` — Tailwind 4 is CSS-first, use `@theme {}` block in global CSS (not load-bearing for Phase 1's scaffold-only scope, relevant from Phase 2 onward).
- **Forbidden:** `@lucide/astro` — use `lucide-astro` for consistency with the sibling site (not installed this phase; flagged for Phase 2/3 re-confirmation given upstream deprecation discovered this session — see Package Legitimacy Audit).
- **Forbidden:** Images in `public/` for cover art — use `src/assets/` + `<Picture />` (not load-bearing this phase, no images shipped yet).
- **Recommended over Nixpacks static mode:** Dockerfile + nginx.conf — Nixpacks default nginx doesn't handle `404.html` correctly (directly enforced by this phase's D-07).
- **Coolify settings documented in CLAUDE.md's Alternative approach:** Base Directory `/website`, Dockerfile build pack — matches D-09 exactly.

No contradictions found between CLAUDE.md and CONTEXT.md's locked decisions for this phase; CLAUDE.md's config-pattern guidance (astro.config.mjs shape, nginx cache-header pattern) is consistent with and duplicated by CONTEXT.md's canonical references.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Astro build → static HTML/CSS/JS | Build (local, CI-less) | — | `output: 'static'` pre-renders everything at `npm run build` time; no server runtime exists or is needed |
| Static file serving + routing (404, trailing slash) | CDN / Static (nginx in container) | — | nginx serves pre-built `dist/`; all routing decisions (404 fallback, cache headers) happen at this tier, not in Astro |
| TLS termination, apex/www canonicalization, HTTP→HTTPS | Edge / Reverse proxy (Coolify's Traefik) | — | D-13/D-14 lock this to Coolify's built-in Traefik, not a CDN (no Cloudflare in front) — the nginx container is HTTP-only internally |
| Container build/publish (Dockerfile) | Build tier | CDN / Static (final stage) | Multi-stage: Node build stage produces `dist/`, nginx:alpine stage serves it — two tiers collapse into one artifact |
| Legacy file relocation | Repo / source control | — | Pure filesystem operation, no runtime tier involved |
| Listmonk app + admin UI | API / Backend (separate Coolify service) | Database (Postgres) | Runs as its own Coolify app/service, independent lifecycle from the static site container (PITFALLS.md explicitly warns against colocating) |
| Listmonk → Resend SMTP relay | API / Backend (Listmonk as SMTP client) | External (Resend) | Listmonk is a client of Resend's submission endpoint on 587 — no MTA tier exists in this architecture, which is the phase's key insight (port 25 is irrelevant) |
| DNS records (A, SPF, DKIM, DMARC, MX) | External (LWS registrar) | — | Managed entirely outside the repo/build; DEPLOY.md documents values only, doesn't configure them programmatically |

## Package Legitimacy Audit

**Ecosystem:** npm. **Packages this phase installs (scaffold only — `lucide-astro` and `@fontsource/*` are Phase 2/3 concerns, NOT installed in Phase 1):** `astro`, `@tailwindcss/vite`, `tailwindcss`, `preact`, `@astrojs/preact`, `@astrojs/mdx`, `@astrojs/sitemap`, `sharp`, `typescript`, `@astrojs/check`.

Ran `gsd_run query package-legitimacy check --ecosystem npm` against all ten packages `[VERIFIED: npm registry via package-legitimacy seam]`:

| Package | Registry | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-------------------|-------------|---------|-------------|
| `astro` | npm | 4,210,546 | github.com/withastro/astro | SUS ("too-new") | **Approved** — see note below |
| `@tailwindcss/vite` | npm | 42,211,292 | github.com/tailwindlabs/tailwindcss | SUS ("too-new") | **Approved** — see note |
| `tailwindcss` | npm | 118,208,622 | github.com/tailwindlabs/tailwindcss | SUS ("too-new") | **Approved** — see note |
| `preact` | npm | 28,091,724 | github.com/preactjs/preact | SUS ("too-new") | **Approved** — see note |
| `@astrojs/preact` | npm | 77,866 | github.com/withastro/astro | SUS ("too-new") | **Approved** — see note |
| `@astrojs/mdx` | npm | 1,530,393 | github.com/withastro/astro | SUS ("too-new") | **Approved** — see note |
| `@astrojs/sitemap` | npm | 2,202,611 | github.com/withastro/astro | OK | Approved |
| `sharp` | npm | 82,355,853 | github.com/lovell/sharp | OK | Approved |
| `typescript` | npm | 259,496,252 | github.com/microsoft/TypeScript | SUS ("too-new") | **Approved** — see note |
| `@astrojs/check` | npm | 2,200,515 | github.com/withastro/astro | SUS ("too-new") | **Approved** — see note |

**Note on "too-new" verdicts (all six):** The legitimacy checker's "too-new" signal fires against the package's `latest` dist-tag publish date, not the specific pinned version this project installs (`npm view <pkg> version` returns registry `latest`, which has moved to Astro 7/TS 6-era releases published within the last month — a checker limitation, not a risk signal about the pinned 5.x/4.x versions). Every flagged package has tens of millions to hundreds of millions of weekly downloads and a verified official GitHub org (withastro, tailwindlabs, preactjs, microsoft) — the opposite profile of a slopsquat or hijacked package. **No `checkpoint:human-verify` is warranted for these six; standard `npm install` is fine.** This assessment overrides the mechanical SUS disposition because the signal is a known false-positive pattern for actively-maintained, high-download monorepo packages, not a legitimacy concern.

**Exact pinned versions re-verified against the npm registry today** `[VERIFIED: npm registry — npm view <pkg>@<version> version, run this session]`:

| Package | Pinned version | `npm view` result |
|---|---|---|
| astro | 5.18.2 | exists, latest 5.x patch (5.17.2 → 5.17.3 → 5.18.0 → 5.18.1 → 5.18.2) |
| @astrojs/mdx | 4.3.14 | exists |
| @astrojs/preact | 4.1.3 | exists |
| @astrojs/sitemap | 3.7.3 | exists |
| sharp | 0.34.5 | exists |
| typescript | 5.9.3 | exists |
| @astrojs/check | 0.9.9 | exists |
| preact | 10.27.2 | exists |
| @tailwindcss/vite | 4.1.16 | exists |
| tailwindcss | 4.1.16 | exists |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as genuinely suspicious [SUS] requiring a checkpoint:** none for this phase's install list.

**Deferred note for Phase 2/3 planning (not actionable this phase):** `lucide-astro@0.556.0` — the exact version CLAUDE.md and STACK.md pin — is confirmed to exist on the registry `[VERIFIED: npm registry]`, but `npm view lucide-astro deprecated` returns `"Deprecated: Use \`@lucide/astro\`"` and `npm view lucide-astro repository.url` still resolves to `github.com/dzeiocom/lucide-astro` (34K weekly downloads) `[VERIFIED: npm registry, checked this session]`. This deprecation postdates CLAUDE.md's explicit instruction to use `lucide-astro` for sibling-site consistency. **This phase does not install icon packages, so no action is needed now** — flagging for the Phase 2/3 planner and for `/gsd-discuss-phase` on whichever phase first installs icons, since the CLAUDE.md directive may need a deliberate re-confirmation or override once icons are actually needed.

## Standard Stack

### Core (installed this phase — scaffold only)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | `^5.18.2` | Static site framework, build tool | `[VERIFIED: npm registry]` exists; `[CITED: STACK.md, Context7 /withastro/docs]` for config shape. Matches sibling site's major version exactly (sibling runs `^5.16.6`). |
| @tailwindcss/vite | `^4.1.16` | CSS framework via Vite plugin | `[VERIFIED: npm registry]`. CSS-first config, no JS config file. `@astrojs/tailwind` is deprecated for v4 — do not use. |
| tailwindcss | `^4.1.16` | CSS framework (peer of @tailwindcss/vite) | `[VERIFIED: npm registry]`. Must co-install at matching version. |
| preact | `^10.27.2` | Interactive islands runtime | `[VERIFIED: npm registry]`. Required even though no islands ship in Phase 1 — `@astrojs/preact` integration requires it as a dependency to build cleanly. |
| @astrojs/preact | `^4.1.3` | Astro↔Preact integration | `[VERIFIED: npm registry]`. **Must be `^4.x`, not `^5.x`/`^6.x` — those target Astro 6+** `[CITED: STACK.md version compatibility matrix]`. |
| @astrojs/mdx | `^4.3.14` | MDX support | `[VERIFIED: npm registry]`. Same 4.x-vs-5.x/7.x compatibility constraint as above. |
| @astrojs/sitemap | `^3.7.3` | sitemap.xml generation | `[VERIFIED: npm registry]`, legitimacy OK. Requires `site:` set in config or emits nothing useful. |
| sharp | `^0.34.5` | Image processing backend for `astro:assets` | `[VERIFIED: npm registry]`, legitimacy OK. Peer requirement, install as a direct (not dev) dependency. |
| typescript | `^5.9.3` | Type checking | `[VERIFIED: npm registry]`. **Pin to 5.x** — `typescript@latest` is now 7.0.2 `[VERIFIED: npm registry, checked this session]`; Astro 5 tooling is not yet validated against TS 6/7. |
| @astrojs/check | `^0.9.9` | Astro-aware TS checking | `[VERIFIED: npm registry]`. Run as `astro check` pre-build step. |

### Supporting (deferred to Phase 2/3 — do not install this phase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-astro | `^0.556.0` | SVG icons | Phase 3 (social links, streaming platform icons). See deprecation note in Package Legitimacy Audit above — re-confirm with user before installing. |
| @fontsource-variable/* | `^5.2.8` | Self-hosted variable fonts | Phase 2 (BRAND-04 base layout + fonts) — exact family TBD, not yet decided per STATE.md pending todos. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dockerfile + custom nginx.conf | Coolify Nixpacks "static site" checkbox | Nixpacks' default nginx config redirects missing URLs to homepage instead of a real 404 and offers no custom cache-header control — rejected by D-07, confirmed still true `[CITED: PITFALLS.md Pitfall 7 & 9]` |
| Coolify's built-in "Direction" redirect setting | Hand-written Traefik `redirectregex` labels | Built-in setting is documented as the standard path and requires no label maintenance; hand-written labels are the fallback only if the built-in setting proves insufficient `[CITED: coolify.io/docs/knowledge-base/proxy/traefik/redirects]` |
| Resend dashboard-generated DNS records | Hand-typed SPF/DKIM values from generic guides | Resend's DKIM public key and DKIM selector are account/domain-specific — copying a generic example value will not verify `[CITED: resend.com/docs/add-a-domain]` |

**Installation (this phase, run from inside `website/`):**
```bash
npm create astro@5.18.2 . -- --template minimal --typescript strict --no-install
npm install astro@5.18.2 @tailwindcss/vite@4.1.16 tailwindcss@4.1.16 \
  @astrojs/preact@4.1.3 @astrojs/mdx@4.3.14 @astrojs/sitemap@3.7.3 \
  preact@10.27.2 sharp@0.34.5
npm install --save-dev @astrojs/check@0.9.9 typescript@5.9.3
```

**Version verification performed this session:** all ten pinned versions confirmed via `npm view <pkg>@<version> version` against the live registry; see Package Legitimacy Audit table above for the full list. Local Node (`v24.9.0`) satisfies every package's `engines.node` constraint `[VERIFIED: npm view astro@5.18.2 engines / sharp@0.34.5 engines / typescript@5.9.3 engines, run this session]` — astro requires `18.20.8 || ^20.3.0 || >=22.0.0`, sharp requires `^18.17.0 || ^20.3.0 || >=21.0.0`, typescript requires `>=14.17`.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL / CI-LESS BUILD (this phase's scope)                     │
│                                                                   │
│   website/ (npm create astro, pinned deps)                       │
│        │                                                          │
│        │ npm run build  (astro build, output: 'static')          │
│        ▼                                                          │
│   website/dist/  ── HTML + hashed /_astro/*.js,*.css + assets    │
│        │                                                          │
│        │ COPY --from=build in Dockerfile                          │
│        ▼                                                          │
│   nginx:alpine container, serves dist/ on :80                     │
│     ├─ location ~* \.html$      → Cache-Control: no-cache         │
│     ├─ location ~* /_astro/     → Cache-Control: immutable, 1yr   │
│     ├─ location /               → try_files ... =404 (real 404)  │
│     └─ error_page 404 /404.html                                   │
│                                                                     │
│   Verify locally: docker build && docker run -p 8080:80 &&        │
│   curl -I localhost:8080/index.html                               │
│   curl -I localhost:8080/_astro/<hashed-file>                     │
│   curl -I localhost:8080/nonexistent-page  (expect 404, not 200)  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │  (this phase produces artifacts only;
                          │   arrow below is what DEPLOY.md documents
                          │   for the USER to execute later)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  LIVE (user-executed, deferred — DEPLOY.md documents these steps) │
│                                                                     │
│   GitHub push to master ─▶ Coolify webhook ─▶ builds Dockerfile   │
│     (Base Directory: website/)                                    │
│                     │                                              │
│                     ▼                                              │
│   Coolify app container ◀── Traefik (TLS via Let's Encrypt,       │
│     serving darlng.com      www→apex + HTTP→HTTPS via Coolify's   │
│                              built-in Direction/Force-HTTPS setting)│
│                                                                     │
│   Separate Coolify service: Listmonk + Postgres at mail.darlng.com │
│     Listmonk ── SMTP client, port 587 ──▶ smtp.resend.com          │
│                                            (Resend verifies SPF/    │
│                                             DKIM/DMARC on LWS DNS)  │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
darlng.com/
├── legacy/                   # D-12: relocated 2019 placeholder (unmodified contents)
│   ├── index.html
│   ├── randevu.mp3
│   ├── scss/  js/  css/  fonts/  img/  json/  files/
│   ├── Gruntfile.js
│   ├── package.json
│   └── yarn.lock
└── website/                  # D-09: Coolify Base Directory
    ├── Dockerfile             # multi-stage: node:22-alpine build → nginx:stable-alpine serve
    ├── nginx.conf             # path-specific Cache-Control, real 404 handling
    ├── DEPLOY.md              # runbook for all user-executed live steps
    ├── astro.config.mjs        # site: 'https://darlng.com', mirrors sibling integration order
    ├── package.json
    ├── tsconfig.json
    ├── .gitignore              # node_modules, dist, .astro
    └── src/
        ├── pages/index.astro   # placeholder page sufficient for a clean build this phase
        └── styles/global.css   # @import "tailwindcss"; minimal @theme block
```

### Pattern 1: Multi-stage Dockerfile (build stage discarded, only nginx layer ships)
**What:** Two-stage build — Node stage runs `npm ci && npm run build`, only `dist/` and `nginx.conf` are copied into the final `nginx:alpine` image; the Node stage and its `node_modules` never ship.
**When to use:** Any static-output framework deployed as a container, especially when custom routing/cache-header behavior is required (this project's exact case per D-07).
**Example:**
```dockerfile
# website/Dockerfile
# Source: STACK.md (Context7 /withastro/docs pattern), pinned to project's Node/Astro versions
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
Astro's own `engines.node` constraint (`18.20.8 || ^20.3.0 || >=22.0.0`) is satisfied by `node:22-alpine` `[VERIFIED: npm view astro@5.18.2 engines, run this session]`.

### Pattern 2: Path-differentiated nginx cache headers (D-08)
**What:** Three distinct `location` blocks instead of one blanket `expires`/`Cache-Control` rule — HTML always revalidates, hashed `_astro/` assets cache for a year as immutable, everything else gets a short/moderate TTL.
**When to use:** Any Astro static build where `_astro/` filenames are content-hashed (they always are by default) and HTML filenames are not.
**Example:**
```nginx
# website/nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # Hashed, content-addressed build assets — safe to cache forever
  location ~* ^/_astro/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # HTML — always revalidate so new deploys are visible immediately
  location ~* \.html$ {
    add_header Cache-Control "no-cache";
  }

  location / {
    try_files $uri $uri/ $uri/index.html /404.html;
  }

  error_page 404 /404.html;
}
```
Source: synthesized from `[CITED: STACK.md Coolify Deployment section]` + `[CITED: PITFALLS.md Pitfall 9 — nginx caching, exact Cache-Control values from D-08]`. Note the `try_files` fallback resolves to `/404.html` directly (not `=404` alone) so a real custom 404 page renders with a `404` status rather than nginx's bare default error page — verify this returns HTTP status `404` (not `200`) with `curl -I` in the verification step, since a misconfigured `try_files` chain can silently serve `200` for missing routes (this is exactly the Nixpacks-default bug D-07 exists to avoid).

### Pattern 3: Astro config mirrors sibling exactly, changing only `site`
**What:** Reuse the sibling's `astro.config.mjs` integration wiring verbatim (`sitemap()`, `preact()`, `mdx()`, `@tailwindcss/vite` in `vite.plugins`), changing only the `site:` URL.
**When to use:** This project specifically — CONTEXT.md's "Reusable Assets" section instructs exact reuse of this config shape.
**Example:**
```js
// website/astro.config.mjs
// Source: /Users/rob/Desktop/projects/RobinDarlington/robindarlington.com/astro.config.mjs, read this session
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';

export default defineConfig({
    site: "https://darlng.com",
    integrations: [sitemap(), preact(), mdx()],
    vite: {
        plugins: [tailwindcss()],
    }
});
```
`[VERIFIED: /Users/rob/Desktop/projects/RobinDarlington/robindarlington.com/astro.config.mjs:1-19, read this session]` — the sibling's actual file has no explicit `output: 'static'` line (it relies on the framework default) and integration order is `sitemap, preact, mdx`. Quoted verbatim: `site: "https://robindarlington.netlify.app", integrations: [sitemap({...}), preact(), mdx()], vite: { plugins: [tailwindcss()] }`. Only the `site` value changes for darlng.com; do not add an explicit `output: 'static'` unless deliberately deviating from sibling parity (it is the default regardless).

### Anti-Patterns to Avoid
- **Nixpacks "static site" checkbox for the Coolify Build Pack:** Explicitly rejected by D-07 — cannot serve a real 404 or set path-specific cache headers `[CITED: PITFALLS.md Pitfall 7]`.
- **Setting Coolify Base Directory to repo root:** Legacy root files (`index.html` etc.) would shadow the Astro build or confuse Nixpacks/Docker build context detection. Base Directory must be `website/` (D-09).
- **Cloudflare-specific TLS guidance from PITFALLS.md Pitfall 8 (SSL "Full (Strict)" mode):** Does **not** apply — D-13 confirms there is no Cloudflare in front of this domain; TLS is Coolify's Traefik + Let's Encrypt directly against LWS-hosted DNS.
- **Hand-typing generic SPF/DKIM record values from a blog post:** Resend's DKIM selector and public key are unique per domain/account; only the values shown in the Resend dashboard's Records tab for *this* domain are correct `[CITED: resend.com/docs/add-a-domain]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| www→apex + HTTP→HTTPS redirects | Custom Traefik middleware YAML/labels | Coolify's built-in "Direction" domain setting (Advanced tab), configured with both `https://darlng.com` and `https://www.darlng.com` entered | Documented as the standard supported path; avoids the exact "weird www redirect" bugs found in Coolify GitHub issues when labels are hand-written `[CITED: coolify.io/docs/knowledge-base/proxy/traefik/redirects; github.com/coollabsio/coolify/discussions/1999]`. Fall back to manual `redirectregex` labels only if the built-in setting proves insufficient once live. |
| Listmonk + Postgres deployment | Hand-written docker-compose.yml with manual Postgres wiring | Coolify's one-click Listmonk service template | Coolify provisions Postgres and wires connection env vars automatically over the internal Docker network — one-click templates exist specifically for this `[CITED: coolify.io/docs/services/; github.com/coollabsio/coolify/blob/v4.x/templates/compose/listmonk.yaml]`. Known gotcha: the template can break when deploying from a private repo fork — DEPLOY.md should tell the user to use Coolify's own template picker, not clone/modify the compose file manually. |
| SMTP relay auth for Resend | Guessing Resend's SMTP host/port/auth values | Documented values: host `smtp.resend.com`, port `587`, `auth_protocol: login`, username literally `resend`, password = Resend API key, `tls_type: STARTTLS` | These are fixed, documented values, not something to infer `[CITED: WebSearch synthesis of Resend/Listmonk SMTP setup guides]` — MEDIUM confidence, user should cross-check against Resend's own SMTP docs page at send time since API keys/usernames are account-scoped. |
| 404 handling in nginx for a static SPA-adjacent site | `try_files ... =404` alone (returns nginx's bare default page) | `try_files $uri $uri/ $uri/index.html /404.html;` + `error_page 404 /404.html;`, with a real `404.astro` page in the Astro project | Astro generates `404.html` automatically from a `src/pages/404.astro` file; wiring nginx to serve it (rather than falling through to a redirect-to-home, which is the Nixpacks default bug) is the entire point of D-07. |

**Key insight:** Every "don't hand-roll" item here has a documented Coolify- or Resend-native mechanism. The temptation in this phase is to write custom Traefik labels or a custom docker-compose for Listmonk because that feels more "correct" for an infra phase — resist it. The user executes all of this by hand later; DEPLOY.md should point at Coolify's UI-driven one-click paths, not command-line/YAML alternatives that are harder for a non-engineer-in-the-moment to follow during the actual cutover.

## Runtime State Inventory

This phase involves a rename/relocation (legacy root files → `legacy/`), so this section is required.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — the legacy site is static HTML/JS/CSS with no database, no user accounts, no server-side state. Verified by inspecting root: only `index.html`, `randevu.mp3`, `Gruntfile.js`, `package.json`, `yarn.lock`, and asset directories (`scss/`, `js/`, `css/`, `fonts/`, `img/`, `json/`, `files/`) exist — no `.db`, `.sqlite`, or datastore config files present `[VERIFIED: ls -la repo root, run this session]`. | None |
| Live service config | None currently known to exist for the *legacy* site specifically — D-11 confirms the legacy placeholder is currently live at darlng.com via Coolify, but its Coolify app config (domain binding, build pack) is external state not in this repo. When the user re-points Coolify at the new `website/` app (D-15 "flip directly"), the OLD Coolify application's domain binding must be removed/reassigned or both apps will conflict for the same domain — this is a live action for DEPLOY.md to spell out, not something this phase can verify locally. | Document in DEPLOY.md: user must either repoint the existing Coolify app's Base Directory + build pack to `website/`+Dockerfile, OR create a new Coolify app and move the domain binding — pick one explicitly, don't leave both apps claiming the domain. |
| OS-registered state | None — no evidence of Task Scheduler, systemd, pm2, or launchd entries referencing the legacy site; it's served by Coolify's own container orchestration, not host-level process management `[ASSUMED — could not directly inspect the remote Hetzner box from this session; based on project's stated Coolify-managed architecture]`. | None expected; if the user finds host-level cron/pm2 entries during their live cutover, they are outside this phase's knowledge and DEPLOY.md should note "verify no stray host processes reference the old site" as a checklist item. |
| Secrets/env vars | None found in the legacy root — no `.env`, no secrets file present among the ten items being moved `[VERIFIED: ls -la repo root, run this session]`. The new `website/` will introduce `PUBLIC_LISTMONK_URL`/`PUBLIC_LISTMONK_LIST_UUID` as build-time env vars, but per CONTEXT.md deferred section, those are Phase 4's concern — Phase 1 does not need placeholder values, since Listmonk isn't wired into any component yet. | None this phase. |
| Build artifacts | Legacy `package.json` + `yarn.lock` at repo root will move to `legacy/package.json` + `legacy/yarn.lock` — these describe a Grunt-based build pipeline (`Gruntfile.js`) entirely separate from the new `website/package.json`/npm toolchain. No shared `node_modules`, lockfile, or build cache exists between the two — moving the legacy files does not require reinstalling anything, and creating `website/package.json` from scratch (via `npm create astro`) does not conflict with the legacy Grunt setup since they'll be gitignored/isolated in separate directories. | None — the two toolchains are fully independent; no migration of build artifacts needed, just a straightforward `git mv` of the ten legacy items into `legacy/`. |

**Canonical question answered:** After `git mv`-ing the ten legacy root items into `legacy/`, the only external system referencing the *old* location is Coolify's currently-live application config (Base Directory presumably `/` or unset, pointing at repo root) — which is exactly the live re-pointing DEPLOY.md must document as a manual step, since D-15's "flip directly" strategy depends on it.

## Common Pitfalls

### Pitfall 1: Coolify's Nixpacks static-site 404 behavior redirects to home instead of a real 404
**What goes wrong:** Visiting a nonexistent URL on the live site returns the homepage with a `200` status instead of a proper `404`.
**Why it happens:** Nixpacks' auto-generated nginx config for static sites has no custom `error_page`/`try_files` chain tuned for SPA-style frameworks; it falls back to serving `index.html` for any unmatched path.
**How to avoid:** This is exactly why D-07 mandates the Dockerfile + custom `nginx.conf` path instead of the Nixpacks static checkbox — the `try_files ... /404.html` pattern in this document's Pattern 2 avoids it entirely.
**Warning signs:** `curl -I https://darlng.com/this-does-not-exist` returns `200` instead of `404` once live; locally, the same check against the Dockerized nginx on `localhost` before shipping.
`[CITED: PITFALLS.md Pitfall 7, STACK.md "Alternative: Multi-stage Dockerfile"]`

### Pitfall 2: Blanket cache-header rule instead of path-differentiated rules
**What goes wrong:** Either HTML gets cached for a year (deploys never reach users without a hard refresh) or hashed `_astro/` assets get no long-lived cache at all (wasted bandwidth, worse repeat-visit performance).
**Why it happens:** A single `expires`/`Cache-Control` directive applied to the whole `server` block instead of per-`location` rules.
**How to avoid:** Use the exact three-block structure in Pattern 2 above — HTML `no-cache`, `_astro/` `immutable, max-age=31536000`.
**Warning signs:** `curl -I` on `index.html` shows `max-age=31536000`; or `curl -I` on a `_astro/*.js` file shows no `Cache-Control` header at all.
`[CITED: PITFALLS.md Pitfall 9, D-08]`

### Pitfall 3: Both `darlng.com` and `www.darlng.com` bound to the same Coolify app with no redirect
**What goes wrong:** Both hostnames serve identical `200` content — no canonical URL, duplicate-content SEO issue, and no protection against a future accidental redirect loop if TLS/redirect settings are later added incorrectly.
**Why it happens:** Coolify does not auto-redirect between www and apex just because both domains are added to an application; it treats them as equivalent aliases unless the "Direction" setting (or manual middleware) is explicitly configured.
**How to avoid:** DEPLOY.md must instruct the user to add both `https://darlng.com` and `https://www.darlng.com` to the app's Domains field, then set the Direction setting to "Redirect to non-www" (i.e., www→apex) under Advanced settings, per D-14's "Coolify's domain settings" requirement.
**Warning signs:** `curl -I https://www.darlng.com` returns `200` instead of `301`.
`[CITED: coolify.io/docs/knowledge-base/proxy/traefik/redirects, github.com/coollabsio/coolify/discussions/1999, PITFALLS.md Pitfall 8 — Cloudflare-specific parts of this pitfall don't apply per D-13, but the underlying www/apex mechanism does]`

### Pitfall 4: Deploying the Listmonk Coolify compose template from a forked/private repo breaks the template
**What goes wrong:** A known Coolify bug (`coollabsio/coolify#2691`) causes the Listmonk one-click compose template to fail when the underlying repo source is a private fork rather than Coolify's own template catalog.
**Why it happens:** The one-click template mechanism resolves the compose file from Coolify's bundled templates directory; deviating from the stock template picker path (e.g., manually cloning and modifying the compose YAML) can trigger this.
**How to avoid:** DEPLOY.md should instruct the user to deploy Listmonk via Coolify's Services → "New Resource" → search "Listmonk" one-click picker directly, not by importing a custom compose file.
**Warning signs:** Listmonk service fails to start or Postgres connection env vars are empty/malformed after using a non-standard template source.
`[CITED: github.com/coollabsio/coolify/issues/2691]` — MEDIUM confidence, single GitHub issue, not independently reproduced this session.

### Pitfall 5: Astro's `latest` npm tag has moved to a major version this project deliberately avoids
**What goes wrong:** Running `npm install astro` (no version pin) or `npm create astro@latest` would install Astro 7.x, which requires Node ≥22.12.0 and removes the legacy content collections API — breaking parity with the sibling site and potentially the planned `src/data/releases.ts` approach.
**Why it happens:** Muscle memory / copy-pasted install commands from generic Astro tutorials use `@latest` by default.
**How to avoid:** Always pin the exact version in every `npm create`/`npm install` command — see the Installation section above. Verify `website/package.json` shows `"astro": "^5.18.2"` (or exact `5.18.2`), never a `7.x` range, after scaffolding.
**Warning signs:** `cat website/package.json | grep '"astro"'` shows a `7.` or `6.` prefix.
`[VERIFIED: npm view astro version returns 7.1.6 as of this session — the drift is real and current, not hypothetical]`

## Code Examples

### DEPLOY.md runbook skeleton (structure the planner should have the executor fill in)
```markdown
# DEPLOY.md — DARLNG Live Infrastructure Runbook

> Executed by the user after this phase's local build is approved. Not automated.

## 1. Coolify — Static Site Application
- [ ] Point existing (or new) Coolify app at this repo, branch `master`
- [ ] Base Directory: `website/`
- [ ] Build Pack: Dockerfile
- [ ] Domains: add both `https://darlng.com` and `https://www.darlng.com`
- [ ] Advanced → Direction: "Redirect www to non-www" (canonical = apex)
- [ ] Advanced → Force HTTPS: enabled
- [ ] Deploy; confirm Let's Encrypt cert issues (domain already resolves to this box per D-13)
- [ ] If an OLD Coolify app currently owns darlng.com's domain binding, remove/reassign it first — two apps cannot both claim the same domain

## 2. Listmonk + Postgres
- [ ] Coolify → Services → New Resource → search "Listmonk" (use the one-click template, not a custom compose import)
- [ ] Set subdomain: mail.darlng.com
- [ ] Deploy; wait for Postgres provisioning
- [ ] Log in with default admin credentials, immediately change password (PITFALLS.md Pitfall 6)
- [ ] Settings → SMTP: host smtp.resend.com, port 587, auth_protocol login, username "resend", password = Resend API key, tls_type STARTTLS
- [ ] Lists → New List: create fan list, enable double opt-in
- [ ] Record the list UUID for Phase 4's PUBLIC_LISTMONK_LIST_UUID env var

## 3. Resend — Domain & DNS
- [ ] Resend dashboard → Add Domain → darlng.com (or a send.darlng.com subdomain per Resend's recommendation)
- [ ] Copy the exact records shown in Resend's "Records" tab (do not use generic example values — they are account-specific)
- [ ] Add each record at LWS DNS management
- [ ] Wait for Resend to show all records verified (can take up to 24h, usually 5-10 min)
- [ ] Verify with mxtoolbox.com before considering deliverability ready (D-05)

## 4. Verification Checklist
- [ ] curl -I https://darlng.com → 200
- [ ] curl -I https://www.darlng.com → 301 to https://darlng.com
- [ ] curl -I http://darlng.com → 301 to https://
- [ ] curl -I https://darlng.com/index.html → Cache-Control: no-cache
- [ ] curl -I https://darlng.com/_astro/<any-hashed-file> → Cache-Control: public, max-age=31536000, immutable
- [ ] curl -I https://darlng.com/nonexistent-page → 404
- [ ] Listmonk admin reachable at mail.darlng.com, non-default password set
- [ ] Test subscription via Listmonk admin "Send test email" or manual API POST — confirmation email arrives, not in spam
```
Source: synthesized from D-01 through D-15 in `01-CONTEXT.md`, `[CITED: coolify.io/docs, resend.com/docs/add-a-domain]`. This is a structural skeleton — the planner/executor should expand each checklist item with the exact click-path once Coolify's current UI is confirmed (UI text may drift from what WebSearch returned).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Self-hosted Postfix/MTA on port 25 for Listmonk sending | Listmonk as SMTP client → Resend relay on port 587 | This project's D-03/D-04 decision, 2026-07-07 | Sidesteps Hetzner's port-25 block entirely (it only blocks direct MTA delivery, not authenticated submission on 587); higher deliverability than a fresh residential/cloud IP with no sending reputation |
| Nixpacks "static site" checkbox for Astro deploys on Coolify | Custom Dockerfile + nginx.conf | Confirmed still the recommended path as of this session's research | Full control over 404 and cache headers, which Nixpacks' generated config lacks |
| Cloudflare "Full (Strict)" SSL + Cloudflare redirect rules for www/apex | Coolify's own Traefik + Let's Encrypt, built-in Direction setting | D-13/D-14, 2026-07-07 — this project has no Cloudflare in front of LWS-managed DNS | The general project research's Cloudflare-specific TLS guidance (PITFALLS.md Pitfall 8) is moot for this deployment; use Coolify-native mechanisms instead |
| `astro@latest` / `typescript@latest` | Deliberately pinned to `astro@^5.18.2` / `typescript@^5.9.3` | Ongoing — registry `latest` has moved to Astro 7.1.6 / TypeScript 7.0.2 as of this session | Confirms the pin decision remains correct; do not let any install command drift to `@latest` |

**Deprecated/outdated:**
- `@astrojs/tailwind` integration — deprecated, incompatible with Tailwind v4; use `@tailwindcss/vite` directly `[CITED: STACK.md]`.
- `lucide-astro` — upstream-deprecated in favor of `@lucide/astro` as of this session's check, though CLAUDE.md still mandates it for sibling-site consistency. Not installed this phase; flag for Phase 2/3 discuss-phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | No host-level OS-registered state (cron/pm2/systemd) references the legacy site on the remote Hetzner box | Runtime State Inventory | If wrong, moving legacy files locally wouldn't break anything (files stay in git history either way), but the user's live cutover checklist should still include "check for stray host processes" as a belt-and-braces item — low risk since this project's stated architecture is Coolify-container-managed, not host-process-managed |
| A2 | Resend's exact documented SMTP values (`smtp.resend.com:587`, `auth_protocol: login`, username `resend`) are current and correct | Don't Hand-Roll table, DEPLOY.md skeleton | If Resend has changed these values, Listmonk's SMTP test will fail immediately and visibly at setup time — low blast radius, easily caught by the user during their live setup, not a silent failure |
| A3 | Coolify's built-in "Direction" domain-redirect setting is available and sufficient in the Coolify version the user is running | Don't Hand-Roll table, Pitfall 3 | If the user's Coolify version lacks this UI setting, DEPLOY.md's fallback (manual Traefik `redirectregex` labels, documented in the Alternatives Considered table) covers it — not a hard blocker, just more manual work for the user |
| A4 | The Listmonk Coolify one-click template (not a custom compose import) avoids the known `#2691` private-repo bug | Common Pitfalls Pitfall 4 | If the one-click template itself has other undiscovered issues, the user will hit them live during Phase 1's deferred deploy step, outside this phase's local-verification scope — user has full context to debug interactively at that point |

## Open Questions

1. **Does the current Coolify version (as installed on the user's Hetzner box) expose the "Direction" redirect setting in its UI, or only via raw Traefik labels?**
   - What we know: Coolify's official docs describe this built-in setting as the standard path `[CITED: coolify.io/docs/knowledge-base/proxy/traefik/redirects]`.
   - What's unclear: Coolify version/UI drift between when the docs page was written and the user's actual installed version.
   - Recommendation: DEPLOY.md should present the built-in setting as the primary path with the manual Traefik label snippet (documented in this file's Alternatives Considered table) as an explicit fallback if the UI setting isn't present.

2. **Should Phase 1 install `lucide-astro` and Fontsource packages now (to fully mirror the sibling's `package.json`) or defer them to Phase 2/3 when first used?**
   - What we know: CONTEXT.md's "Reusable Assets" section says to copy the sibling's pinned dependency set (dropping site-specific extras); STACK.md's installation section lists icons/fonts as a separate step from the core stack.
   - What's unclear: Whether INFRA-01's "building cleanly to static dist/" success criterion implies a fuller package.json now, or the leaner core-only set this research recommends.
   - Recommendation: Install only the core scaffold packages this phase (as scoped in this research) since Phase 1 has no UI/icons/fonts to render (that's Phase 2/3's BRAND-04/FAN-03 work) — this also sidesteps needing to resolve the `lucide-astro` deprecation question before it's actually load-bearing.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Astro build, npm scripts | Yes | v24.9.0 | — (exceeds all package `engines.node` minimums, verified this session) |
| npm | Package install/build | Yes | 11.12.1 | — |
| Docker | Local Dockerfile build/verification | Yes | 28.1.1 | If unavailable at execution time, the phase's own scope revision already specifies a fallback: "validate nginx.conf syntax and dist/ contents" without an actual image build |
| git | legacy/ relocation via `git mv`, commits | Yes (repo already initialized, branch `master`, remote `origin` confirmed) | — | — |

**Missing dependencies with no fallback:** none — all four required tools are present on this machine.
**Missing dependencies with fallback:** none needed; Docker is available, so the full local Docker-build verification path (not just the syntax-only fallback) is exercisable this phase.

## Sources

### Primary (HIGH confidence)
- npm registry — `npm view` executed this session for all 10 core packages (existence, exact-version resolution, `engines`, `deprecated`, `postinstall` fields) and 3 supporting packages
- `gsd_run query package-legitimacy check` seam — structured verdicts for all 10 core packages, run this session
- `/Users/rob/Desktop/projects/RobinDarlington/robindarlington.com/astro.config.mjs` — read directly this session, quoted verbatim in Pattern 3
- `/Users/rob/Desktop/projects/RobinDarlington/robindarlington.com/package.json` — read directly this session
- `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md` — prior project research, Context7-sourced (`/withastro/docs`, `/knadh/listmonk`)
- `.planning/phases/01-infrastructure-deploy/01-CONTEXT.md` — locked decisions D-01 through D-15, authoritative for this phase

### Secondary (MEDIUM confidence)
- [Coolify Redirects docs](https://coolify.io/docs/knowledge-base/proxy/traefik/redirects) — www/apex redirect mechanism, WebFetch'd this session
- [Resend — Add and verify a domain](https://resend.com/docs/add-a-domain) — subdomain recommendation, WebFetch'd this session
- [coollabsio/coolify discussion #1999 — Best way to redirect to www](https://github.com/coollabsio/coolify/discussions/1999)
- [coollabsio/coolify issue #2691 — Listmonk compose fails from private repo](https://github.com/coollabsio/coolify/issues/2691)
- [coollabsio/coolify v4.x Listmonk compose template](https://github.com/coollabsio/coolify/blob/v4.x/templates/compose/listmonk.yaml)

### Tertiary (LOW confidence — WebSearch synthesis, not independently fetched from primary source)
- Resend SMTP relay exact values (`smtp.resend.com:587`, `auth_protocol: login`, username `resend`) — WebSearch summary only; user should cross-check against Resend's own SMTP integration docs page at live setup time
- Coolify one-click Listmonk service general behavior — WebSearch summary of coolify.io/docs/services/ and community guides, not independently fetched

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified directly against npm registry this session, config shape read verbatim from sibling site
- Architecture: HIGH — directly maps to locked D-01..D-15 decisions in CONTEXT.md, no invented structure
- Pitfalls: MEDIUM-HIGH — nginx/cache/404 pitfalls are HIGH (prior research + this session's Coolify docs fetch agree); Resend SMTP exact values and Listmonk template bug are MEDIUM (WebSearch-sourced, single-source in places)

**Research date:** 2026-08-04
**Valid until:** 30 days for the pinned package versions and architecture (stable, locked decisions); 7 days for the Coolify UI/Resend dashboard specifics referenced in DEPLOY.md content (product UIs drift faster than library APIs) — re-verify DEPLOY.md's exact click-paths against the live Coolify/Resend UI at execution time rather than trusting this document's screenshots-in-prose.

---

*Phase: 1-Infrastructure & Deploy*
*Researched: 2026-08-04*
