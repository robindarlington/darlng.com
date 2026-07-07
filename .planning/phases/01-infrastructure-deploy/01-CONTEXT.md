# Phase 1: Infrastructure & Deploy - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up the delivery pipeline for darlng.com: an Astro 5 project scaffolded in `website/` that builds to static `dist/`, deployed via Coolify-on-Hetzner behind a custom Dockerfile+nginx, resolving at `https://darlng.com` with correct TLS/redirects/cache headers — plus a freshly deployed, deliverability-ready Listmonk instance at `mail.darlng.com` ready for Phase 4 newsletter wiring.

This phase is plumbing only. No site UI, brand tokens, or content — those are Phase 2+.
</domain>

<decisions>
## Implementation Decisions

### Listmonk & Email Deliverability
- **D-01:** Deploy Listmonk **fresh** on Coolify this phase (it is not currently running), including its required Postgres database.
- **D-02:** Listmonk lives at **`mail.darlng.com`**.
- **D-03:** Listmonk sends via **Resend as a transactional SMTP relay** — Listmonk configured as an SMTP *client* pointing at Resend's submission endpoint on **port 587**. This deliberately sidesteps Hetzner's port-25 block (which only affects direct MTA delivery). No self-hosted Postfix/MTA.
- **D-04:** **Rejected: ngrok/local-box/self-hosted mail server.** A residential/tunneled IP has no sending reputation or PTR record and would land double-opt-in confirmations in spam. Resend over 587 is both simpler and higher-deliverability.
- **D-05:** Domain authentication (**SPF, DKIM, DMARC**) for `darlng.com` must be configured via Resend's DNS records so confirmation emails authenticate and don't land in spam. Verify with a tool (e.g. mxtoolbox) before considering the phase done.
- **D-06:** Create a fan list in Listmonk with **double opt-in enabled**; log in with a non-default admin password. (List UUID is an output of this phase, consumed by Phase 4 env var `PUBLIC_LISTMONK_LIST_UUID`.)

### Static Site Deploy
- **D-07:** Serve the static build via a **multi-stage Dockerfile + custom `nginx.conf`, both in `website/`** — NOT the Nixpacks "static site" checkbox. Rationale: full control over 404 handling (Nixpacks default nginx redirects missing URLs to home) and explicit cache headers.
- **D-08:** Cache headers: HTML (`index.html` etc.) → `Cache-Control: no-cache`; hashed `_astro/` assets → `Cache-Control: public, max-age=31536000, immutable`.
- **D-09:** Coolify **Base Directory = `website/`** so the legacy root files are never served and the Dockerfile/build run from the site subdirectory.
- **D-10:** Coolify builds from the existing GitHub remote (`git@github.com:robindarlington/darlng.com.git`), **auto-deploying on push to `master`** (webhook-driven CD).

### Legacy Cutover
- **D-11:** The old 2019 placeholder is **currently live** at darlng.com — this phase is a real production cutover, not a first deploy.
- **D-12:** Move the legacy root files (`index.html`, `randevu.mp3`, `scss/`, `js/`, `css/`, `fonts/`, `img/`, `json/`, `files/`, `Gruntfile.js`, `package.json`, `yarn.lock`) into a **`legacy/` folder** to tidy the repo root and make `website/` unambiguously the site. Git history preserves them regardless.

### DNS & TLS
- **D-13:** DNS is managed at the registrar **LWS (not Cloudflare)**, and the A record **already points at the Coolify box**. There is **no Cloudflare in front** — so the research's Cloudflare "Full (Strict)" SSL and Cloudflare redirect-rule guidance is **moot / does not apply**.
- **D-14:** **TLS via Coolify's built-in Traefik + Let's Encrypt** for both `darlng.com` and `mail.darlng.com`. www→apex and HTTP→HTTPS redirects are configured in **Coolify's domain settings**, not at a CDN.
- **D-15:** **Cutover strategy: flip directly.** Because DNS already resolves to Coolify, the cutover is just pointing the Coolify application at the new `website/` build (new app or reconfigured domain) and letting Let's Encrypt (HTTP-01) issue. Domain already resolves to the box, so cert validation will succeed; only brief window is when the new app takes the domain over from the old site.

### Claude's Discretion
- Exact Dockerfile base images (e.g. `node:lts-alpine` build stage → `nginx:alpine` serve stage) and nginx.conf specifics — standard patterns, planner/executor choose.
- Whether Listmonk + Postgres are deployed as a Coolify one-click/service template vs. a compose stack — pick whatever is cleanest on this Coolify version.
- Resend account/domain setup specifics (whether to use a `send.darlng.com` subdomain for DKIM alignment) — follow Resend's recommended setup.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Roadmap
- `.planning/PROJECT.md` — project vision, constraints (self-hosting bias, Coolify/Hetzner, Listmonk), locked stack.
- `.planning/REQUIREMENTS.md` — INFRA-01…04 requirement text and acceptance framing.
- `.planning/ROADMAP.md` §"Phase 1: Infrastructure & Deploy" — goal + 5 success criteria (build clean, new site served, www/HTTP 301s, cache headers, Listmonk live).

### Research (stack/deploy specifics + gotchas)
- `.planning/research/STACK.md` — pinned versions (`astro@^5.18.2`, `@astrojs/mdx@^4.x`, `@astrojs/preact@^4.x`, Tailwind 4), Coolify deploy patterns, Dockerfile/nginx approach, Listmonk endpoint.
- `.planning/research/PITFALLS.md` — 404-redirect gotcha, cache-header strategy, Listmonk CORS (Phase 4 concern), TLS/redirect-loop traps. NOTE: Cloudflare-specific TLS pitfalls do NOT apply here (see D-13).
- `.planning/research/ARCHITECTURE.md` — `website/` directory layout, env-var-at-build-time model (`PUBLIC_LISTMONK_URL`, `PUBLIC_LISTMONK_LIST_UUID`).

### External reference (sibling site — stack only, NOT deploy)
- `/Users/rob/Desktop/projects/RobinDarlington/robindarlington.com/package.json` — canonical dependency versions to mirror.
- `/Users/rob/Desktop/projects/RobinDarlington/robindarlington.com/astro.config.mjs` — canonical Astro config shape (integrations order, `@tailwindcss/vite` in `vite.plugins`). NOTE: sibling deploys to **Netlify**, so its deploy setup is NOT a reference for the Coolify pipeline.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Sibling `astro.config.mjs`: reuse the exact integration wiring (`sitemap()`, `preact()`, `mdx()`, `@tailwindcss/vite` under `vite.plugins`). Change `site:` to `https://darlng.com`.
- Sibling `package.json`: copy the pinned dependency set (drop site-specific extras like `replicate`, `react-vertical-timeline-component` unless needed later).

### Established Patterns
- Repo already has a GitHub remote (`origin` → `robindarlington/darlng.com`) on branch `master` — Coolify CD can hook directly; no new remote needed.
- No `.gitignore` at repo root yet — Astro scaffold in `website/` needs one (node_modules, dist, .astro).

### Integration Points
- Coolify app → GitHub remote (auto-deploy on push to `master`).
- Static build (`PUBLIC_*` env vars) baked at build time in Coolify → will consume Listmonk URL + list UUID produced this phase (used in Phase 4).
- Listmonk → Resend SMTP (587) → recipient inboxes; Listmonk → Postgres.
</code_context>

<specifics>
## Specific Ideas

- Port-25 is a red herring for this setup: Listmonk is an SMTP client, not an MTA, so it uses submission port 587 to Resend — Hetzner's port-25 block is irrelevant. This reframing is the key insight of the phase and must be reflected in planning (don't plan any port-25 / self-hosted-MTA work).
- Subdomain naming settled: `mail.darlng.com` for Listmonk.
</specifics>

<deferred>
## Deferred Ideas

- **Newsletter form ↔ Listmonk wiring, CORS at the proxy, ALTCHA anti-spam** — Phase 4 (Newsletter Fan Capture). This phase only makes Listmonk *exist and be deliverability-ready*; it does not wire the site form.
- **`PUBLIC_LISTMONK_LIST_UUID` / `PUBLIC_LISTMONK_URL` consumption in the build** — Phase 4. This phase produces the values; Phase 4 consumes them.
- Deleting the `legacy/` folder entirely — deferred; keep it archived for now, revisit at milestone cleanup.

</deferred>

---

*Phase: 1-Infrastructure & Deploy*
*Context gathered: 2026-07-07*
