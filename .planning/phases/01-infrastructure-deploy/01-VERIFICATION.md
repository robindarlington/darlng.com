---
phase: 01-infrastructure-deploy
verified: 2026-08-06T22:40:00Z
status: passed
score: 19/19 must-haves verified (local scope); roadmap SC 1/5 verified locally, 4/5 explicitly deferred to user per authorized scope revision
behavior_unverified: 0
overrides_applied: 0
re_verification: null
deferred:
  - truth: "Visiting https://darlng.com serves the new Astro build (roadmap SC 2)"
    addressed_in: "User-executed live cutover — website/DEPLOY.md Section 1 + Section 4 checklist"
    evidence: ".planning/phases/01-infrastructure-deploy/01-CONTEXT.md Scope Revision (2026-08-04, authoritative): 'LOCAL-ONLY BUILD... Success criteria requiring the live domain... are DEFERRED to the user's deploy step.'"
  - truth: "www->apex and HTTP->HTTPS 301 redirects with no loop (roadmap SC 3)"
    addressed_in: "User-executed live cutover — website/DEPLOY.md Section 1 (Direction/Force HTTPS settings) + Section 4 checklist"
    evidence: "Same scope revision; DEPLOY.md Section 1 documents Coolify's built-in Direction setting and Force HTTPS with a named Traefik-label fallback"
  - truth: "Cache-Control headers correct on the live domain (roadmap SC 4)"
    addressed_in: "Verified locally against the container in this phase (see truths table); live re-confirmation deferred to website/DEPLOY.md Section 4"
    evidence: "01-01-SUMMARY.md + this verification's own container run confirm the header contract locally; DEPLOY.md Section 4 carries the live curl checks"
  - truth: "Listmonk admin reachable, non-default password, fan list with double opt-in (roadmap SC 5)"
    addressed_in: "User-executed live cutover — website/DEPLOY.md Section 2 + Section 4 checklist"
    evidence: "Same scope revision; DEPLOY.md Section 2 sequences admin-password-change first, then SMTP, then list creation with double opt-in"
---

# Phase 1: Infrastructure & Deploy Verification Report

**Phase Goal (verbatim, ROADMAP.md):** The Astro project builds and deploys cleanly to darlng.com via Coolify, with correct TLS/redirects, nginx cache headers, and a live Listmonk instance ready for newsletter wiring.

**Scope Revision (authoritative, 2026-08-04):** LOCAL-ONLY BUILD. Live infrastructure (Coolify app wiring, DNS, TLS, Listmonk deploy, Resend/DKIM) is executed by the user after this phase delivers code artifacts + a runbook. Roadmap success criteria 2-5 (live-domain checks) are explicitly deferred per `.planning/phases/01-infrastructure-deploy/01-CONTEXT.md` and `.planning/CONTENT.md`. This verification narrows to what the scope revision actually promises: a clean local build, a Docker/nginx pipeline that provably serves correct 200/404/cache-header responses, an archived legacy tree, and a runbook complete enough for the user to execute the live cutover unassisted.

**Verified:** 2026-08-06T22:40:00Z
**Status:** passed
**Re-verification:** No — initial verification

**Verification method:** Not a SUMMARY.md read-through. I independently ran `npm run build` (with `PUBLIC_LISTMONK_*` unset), ran `astro check`, built the Docker image fresh (`docker build`), ran the container, and curled `/`, a missing path, `/index.html`, and a live hashed `/_astro/` asset — all against a running container I started myself, not by trusting the SUMMARY's prior curl output. I also read the full `website/DEPLOY.md`, `Dockerfile`, `nginx.conf`, `astro.config.mjs`, `index.astro`, `404.astro` end-to-end and independently checked git rename history for the `legacy/` move.

## Goal Achievement

### Observable Truths — Plan 01-01 (Walking Skeleton)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npm run build` inside `website/` exits 0, emits `dist/index.html`, `dist/404.html`, non-empty `dist/_astro/` | VERIFIED | Ran it myself: build completed, `dist/_astro/` has 4 files (2 JS chunks, 1 CSS, `client.*`) |
| 2 | `website/package.json` resolves astro to the 5.x line | VERIFIED | `node -e` check + file read: `"astro": "^5.18.2"` |
| 3 | `GET /` on the running container returns HTTP 200 with DARLNG markup | VERIFIED | Fresh `docker build` + `docker run` + `curl` by me: `200`, body contains `DARLNG` |
| 4 | `GET` on a nonexistent path returns HTTP 404 (not 200/homepage), serves the Astro 404 page | VERIFIED | `curl` to `/this-page-does-not-exist` returned `404`; body does not contain `<h1>DARLNG</h1>` |
| 5 | `curl -I /index.html` shows `Cache-Control: no-cache`; `curl -I` on a hashed `/_astro/` asset shows `public, max-age=31536000, immutable` (D-08) | VERIFIED | Both headers confirmed by my own curl run, asset name discovered dynamically from `dist/_astro/`, not hardcoded |
| 6 | Shipped image contains no `node_modules`, no `.astro`, no `src/` under the served root (D-07) | VERIFIED | `docker run --rm ... find /usr/share/nginx/html` lists only `dist/` output + nginx's stock `50x.html` — no build artifacts, no legacy content |
| 7 | `npm run build` succeeds with `PUBLIC_LISTMONK_URL`/`PUBLIC_LISTMONK_LIST_UUID` unset | VERIFIED | Ran `env -u PUBLIC_LISTMONK_URL -u PUBLIC_LISTMONK_LIST_UUID npm run build --prefix website`, exit 0 |
| 8 | Site builds/serves with no data layer, no server runtime, no adapter — `output` stays Astro `static` default | VERIFIED | `astro.config.mjs` has no `output` key, no adapter import; build log explicitly prints `[build] output: "static"` |

### Observable Truths — Plan 01-02 (Legacy Archive + DEPLOY.md Runbook)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 9 | All twelve D-12 legacy artifacts live under `legacy/`, none remain at repo root | VERIFIED | `ls legacy/` shows all twelve; `ls` at repo root shows only `CLAUDE.md`, `legacy/`, `website/`, `.planning/`, `.git/` |
| 10 | Relocation used `git mv`; `git log --follow` reaches 2019 history | VERIFIED | `git log --follow --oneline -- legacy/index.html` reaches `faddcaf Static placeholder site` (2019) |
| 11 | Repo root contains only `CLAUDE.md`, `legacy/`, `website/`, `.planning/`, `.git/` plus untracked scratch files | VERIFIED | `ls -la` at repo root confirms; untracked `loopcaption.md` and `.planning/research/.cache/` are pre-existing scratch/cache files, explicitly acceptable per verification notes |
| 12 | `website/DEPLOY.md` documents every live action (Coolify, TLS/redirects, Listmonk+Postgres, Resend SMTP, SPF/DKIM/DMARC at LWS) | VERIFIED | Read full 196-line file; all four required sections present with concrete screens/fields/values |
| 13 | DEPLOY.md states the domain-binding collision must be resolved BEFORE the new app claims the domain | VERIFIED | Section 1, first checkbox: "Domain binding collision check — do this FIRST", with explicit Option A/B choice |
| 14 | DEPLOY.md carries a prominent warning that the legacy move breaks the live 2019 site on next auto-deploy | VERIFIED | Blockquote WARNING at top of file, restated in "Legacy Cutover" section |
| 15 | DEPLOY.md instructs entering every credential in Coolify's/Listmonk's UI, never into a repo file | VERIFIED | Explicit statements in Sections 1-3 ("paste it directly into this Listmonk settings field, never into a file in this repository", etc.) — also confirmed by negative-grep: no secret-shaped literal in the file |
| 16 | DEPLOY.md prescribes Coolify's built-in Direction/Force-HTTPS setting as primary, Traefik labels as named fallback only | VERIFIED | Section 1: "This is Coolify's built-in redirect mechanism — use it instead of hand-writing Traefik labels", fallback clearly marked "only if..." |
| 17 | DEPLOY.md instructs Listmonk via Coolify's one-click picker (not hand-modified compose) and documents Resend SMTP values with cross-check instruction | VERIFIED | Section 2 explicit on one-click picker + known-bug rationale; SMTP values listed with "cross-check... before saving" |
| 18 | DEPLOY.md ends with a copy-pasteable verification checklist covering roadmap SC 2-5 | VERIFIED | Section 4, 6x `curl -I` commands plus Listmonk admin/list/test-send checks, explicitly mapped to roadmap criteria |
| 19 | DEPLOY.md's step order is executable as written — Resend verification precedes Listmonk SMTP test-send, list creation precedes UUID recording (verification: backstop) | VERIFIED | Explicit evidence found: Section 2's SMTP step says "do this after Resend is set up, or fill in now and revisit"; a dedicated "Ordering note" at the end of Section 3 states both dependencies explicitly. Backstop truth confirmed by direct textual evidence, not inferred. |

**Score:** 19/19 truths verified (0 present-but-behavior-unverified)

### Prohibitions

| # | Prohibition | Plan | Status | Evidence |
|---|-------------|------|--------|----------|
| 1 | Served container image MUST NOT contain any legacy 2019 placeholder asset | 01-01 | RESOLVED | `docker run --rm ... find /usr/share/nginx/html` — only `dist/` output present, no legacy files. Build context is `website/` only (Dockerfile `COPY . .` runs inside `WORKDIR /app` after copying from `website/` root as Docker build context). |
| 2 | DEPLOY.md and repo MUST NOT contain any live secret value | 01-02 | RESOLVED | Negative-grep confirmed clean: no `re_[A-Za-z0-9]{16,}` pattern, no password/api-key assignment pattern |
| 3 | DEPLOY.md MUST NOT present invented/generic values as real account-specific records | 01-02 | RESOLVED | Section 3 explicitly instructs against typing DKIM key/selector/SPF from memory or a generic guide; no example UUID or DKIM value appears anywhere in the file |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `website/package.json` | Pinned Astro 5 deps, `"astro": "^5.18.2"` | VERIFIED | Present, exact contract match |
| `website/astro.config.mjs` | `site: 'https://darlng.com'`, `inlineStylesheets: 'never'` | VERIFIED | Present, both keys confirmed |
| `website/src/pages/index.astro` | Root route importing global stylesheet | VERIFIED | Imports `../styles/global.css`, minimal but complete document |
| `website/src/pages/404.astro` | Builds to `dist/404.html` | VERIFIED | Confirmed in `dist/404.html` after build |
| `website/src/styles/global.css` | `@import "tailwindcss";` | VERIFIED | Present |
| `website/Dockerfile` | Multi-stage `node:22-alpine` -> `nginx:stable-alpine` | VERIFIED | Present, both base images pinned by explicit tag |
| `website/nginx.conf` | Real 404 chain + D-07/D-08 cache headers | VERIFIED | `=404` + `error_page 404`, `no-cache`/`immutable` split confirmed by curl |
| `website/.dockerignore` | Excludes `node_modules`, `dist`, `.astro`, `.git`, `.env*` | VERIFIED | All present (post-code-review fix WR-01) |
| `website/DEPLOY.md` | Complete live-infra runbook, >=90 lines | VERIFIED | 196 lines, all 4 required sections present |
| `legacy/index.html` | Archived 2019 entrypoint, history intact | VERIFIED | Present; `git log --follow` reaches 2019 |
| `legacy/Gruntfile.js` | Archived legacy build pipeline | VERIFIED | Present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `index.astro` | `global.css` | frontmatter import | WIRED | Confirmed non-empty `dist/_astro/` bundle is emitted |
| `Dockerfile` | `nginx.conf` | `COPY nginx.conf /etc/nginx/conf.d/default.conf` | WIRED | Confirmed in Dockerfile line 10 |
| `Dockerfile` | `dist/` | `COPY --from=build /app/dist ...` | WIRED | Confirmed in Dockerfile line 9; container serves the built files |
| `nginx.conf` | `dist/404.html` | `error_page 404 /404.html` | WIRED | Confirmed by live curl returning genuine 404 with 404-page body |
| `DEPLOY.md` | `Dockerfile`/nginx.conf | "Build Pack = Dockerfile, Base Directory website/" | WIRED | Section 1 instructs exactly this |
| `DEPLOY.md` | Phase 4 env vars | `PUBLIC_LISTMONK_LIST_UUID`/`PUBLIC_LISTMONK_URL` | WIRED | Section 2 records origin (Listmonk list creation) and destination (Coolify env-var UI for the static site app) |

### Behavioral Spot-Checks (Container, run live by this verifier)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `/` returns 200 with DARLNG markup | `docker build` + `docker run` + `curl -s -o /dev/null -w '%{http_code}' localhost:8081/` | `200`, body has `DARLNG` | PASS |
| Missing path returns real 404 | `curl .../this-page-does-not-exist` | `404`, body has no `<h1>DARLNG</h1>` | PASS |
| `/index.html` cache header | `curl -sI .../index.html` | `Cache-Control: no-cache` | PASS |
| `/` (root, not just index.html) cache header | `curl -sI localhost:8081/` | `Cache-Control: no-cache` | PASS |
| Hashed `/_astro/<asset>` cache header | `curl -sI .../_astro/client.CmF4nXn-.js` (name read dynamically) | `Cache-Control: public, max-age=31536000, immutable` | PASS |
| No nginx version banner | `curl -sI ... | grep '^Server:'` | `Server: nginx` (no version number) | PASS |
| Security headers present (post-review-fix) | `curl -sI ...` | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` all present | PASS |
| No `node_modules`/`src` in served image | `docker run --rm ... find /usr/share/nginx/html` | only `dist/` output + nginx stock `50x.html` | PASS |
| `astro check` reports 0 errors | `npm run check --prefix website` | `0 errors, 0 warnings, 0 hints` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 01-01 | Astro 5 scaffold pinned, builds cleanly | SATISFIED | Truths 1-2, 7-8 |
| INFRA-02 | 01-01, 01-02 | Coolify deploy config (Dockerfile/nginx artifact half); DEPLOY.md runbook half | SATISFIED | Truths 3-6 (artifact half, local); Truth 12 + key link (runbook half, per scope revision) |
| INFRA-03 | 01-02 | Apex/www + HTTPS documented (live execution deferred) | SATISFIED (documented); live check DEFERRED | Truth 12, 16; roadmap SC 3 deferred |
| INFRA-04 | 01-02 | Listmonk reachable/configured documented (live execution deferred) | SATISFIED (documented); live check DEFERRED | Truth 12, 17, 18; roadmap SC 5 deferred |

**Note on REQUIREMENTS.md text staleness (info, not a gap):** REQUIREMENTS.md's INFRA-03 description still says "Cloudflare SSL 'Full (Strict)'", which predates D-13 (no Cloudflare; LWS DNS + Coolify's own Traefik/Let's Encrypt). `website/DEPLOY.md` correctly reflects the current D-13/D-14 decision (Traefik + Let's Encrypt, no Cloudflare). This is a documentation staleness issue in a project-level file, not a phase implementation defect — flagged for awareness, not a gap.

### Anti-Patterns Found

None blocking. Scanned all phase-modified files (`package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.dockerignore`, `index.astro`, `404.astro`, `global.css`, `Dockerfile`, `nginx.conf`, `DEPLOY.md`, `legacy/README.md`) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/empty-implementation patterns. Zero debt markers found. The only "placeholder" text hits are legitimate references to the archived 2019 site, not stub code.

Code review (`01-REVIEW.md`) found 2 warnings (WR-01 missing `.env*` in `.dockerignore`, WR-02 missing security headers in `nginx.conf`) — both independently confirmed FIXED by this verifier (`.dockerignore` line 6-7 excludes `.env`/`.env.*`; `nginx.conf` sets `X-Content-Type-Options`/`Referrer-Policy`/`X-Frame-Options`/`Permissions-Policy` at both server and `/_astro/` location level, confirmed live via curl). Remaining 4 info-level findings (non-root nginx user, undocumented-then-documented vite override, redundant `try_files` fallback, no `HEALTHCHECK`) are explicitly non-blocking per the review itself and do not affect the phase goal.

### Human Verification Required

None. Every must-have in this phase's local scope was verifiable programmatically, and I independently re-ran the container-level checks rather than relying on SUMMARY-reported output. The DEPLOY.md text-quality read-through (flagged as `human_judgment: true` in 01-02-SUMMARY.md, per the plan's own verification step 7) was performed by this verifier: the document names concrete screens, fields, and values throughout (not generic intentions), and its ordering/cross-reference logic (Section 2 SMTP step deferring to Section 3, the explicit "Ordering note") holds up on a full read.

### Gaps Summary

No gaps. All 19 must-have truths across both plans verified with first-hand evidence (fresh `npm run build`, fresh `docker build`/`docker run`/`curl`, direct file reads, git history checks) — not by trusting SUMMARY.md claims. The roadmap's remaining success criteria (2-5, all live-domain checks) are explicitly out of scope for this phase per the authoritative 2026-08-04 scope revision and are correctly deferred to the user's execution of `website/DEPLOY.md`, which this phase produced to the required standard (concrete, credential-safe, correctly ordered, and covering all four required sections).

---

_Verified: 2026-08-06T22:40:00Z_
_Verifier: Claude (gsd-verifier)_
