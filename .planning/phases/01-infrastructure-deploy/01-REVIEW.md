---
phase: 01-infrastructure-deploy
reviewed: 2026-08-06T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - website/.dockerignore
  - website/.gitignore
  - website/DEPLOY.md
  - website/Dockerfile
  - website/astro.config.mjs
  - website/nginx.conf
  - website/package.json
  - website/src/pages/404.astro
  - website/src/pages/index.astro
  - website/src/styles/global.css
  - website/tsconfig.json
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-06T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the Astro 5 static site scaffold, the Docker/nginx deployment pipeline, and the
`DEPLOY.md` operator runbook for Phase 1 (infrastructure & deploy). The core deployment
logic is sound: the multi-stage Dockerfile builds correctly, `nginx.conf`'s `try_files` +
`error_page 404` combination correctly returns real HTTP 404s (the exact Nixpacks
limitation the project explicitly chose Dockerfile to avoid), and the two `Cache-Control`
tiers (`no-cache` default, `immutable` for `/_astro/`) are configured correctly given how
nginx's `add_header` inheritance works (a location block's own `add_header` replaces,
rather than merges with, the parent's). `DEPLOY.md` contains no hardcoded/invented
credentials and consistently instructs the operator to paste secrets into Coolify's UI
rather than into repo files.

Two gaps are worth fixing before this ships as the long-term deployment baseline: the
Docker build context isn't as tightly scoped as the git context (`.dockerignore` doesn't
exclude `.env*` the way `.gitignore` does), and the custom `nginx.conf` — which
`CLAUDE.md` explicitly justifies keeping over Nixpacks partly for its ability to add
"security headers explicitly" — doesn't actually add any. Neither is exploitable today
(no secrets exist yet, no dynamic content to attack), but both should be closed while
this file is still small and easy to change. Remaining findings are minor hygiene items.

## Warnings

### WR-01: `.dockerignore` doesn't exclude `.env*`, unlike `.gitignore`

**File:** `website/.dockerignore:1-5`
**Issue:** `.gitignore` explicitly keeps `.env` and `.env.production` out of git (lines
4-5), but `.dockerignore` has no equivalent entries:
```
node_modules
dist
.astro
.git
DEPLOY.md
```
`Dockerfile`'s build stage runs `COPY . .` (Dockerfile:5) before `npm run build`. If a
developer ever runs `docker build .` locally with a `.env`/`.env.production` file present
(the very file `.gitignore` anticipates existing for local dev), it will be included in
the build context and loaded by Astro/Vite's built-in env loading during `astro build`.
Any variable in that file prefixed `PUBLIC_` gets inlined into the client bundle that
ships in the final image's `/usr/share/nginx/html`. Coolify's own deploys pull fresh from
the git remote (which never has `.env`), so production is not exposed today — but the gap
means a local test build silently behaves differently from `git` hygiene rules, and there
is no guard if that changes.
**Fix:**
```
node_modules
dist
.astro
.git
DEPLOY.md
.env
.env.production
.DS_Store
```

### WR-02: `nginx.conf` sets cache headers but no security headers, despite that being the stated reason for choosing a custom config

**File:** `website/nginx.conf:7`
**Issue:** `CLAUDE.md`'s own comparison table justifies the Dockerfile+nginx.conf
approach over Nixpacks' static-site mode by noting "Dockerfile gives explicit control
over routing and headers" and that "you can add gzip, cache headers, **and security
headers** explicitly." Only cache headers are actually implemented
(`add_header Cache-Control ...` at nginx.conf:7 and :16). There is no
`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, or
`Permissions-Policy`. For a fan-facing public site embedding third-party iframes
(Spotify/Apple Music/YouTube per the project's own platform-embed plans), the absence of
a frame-ancestors/CSP policy and `X-Content-Type-Options: nosniff` is a real baseline gap,
not just style — it's the kind of header every modern static-site reference config ships
with by default.
**Fix:**
```nginx
add_header Cache-Control "no-cache" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## Info

### IN-01: Dockerfile runs the final nginx image without an explicit non-root user

**File:** `website/Dockerfile:8-11`
**Issue:** The final stage uses the stock `nginx:stable-alpine` image with no `USER`
directive, so the nginx master process runs as root inside the container (workers drop
privileges automatically, which is the image's normal behavior). This is standard for
the official nginx image and not an active vulnerability, but since the project already
went to the trouble of a hardened multi-stage build, consider `nginxinc/nginx-unprivileged`
or an explicit `user`/`USER` setup for defense-in-depth if the container ever needs to
satisfy a stricter pod/host security policy later.
**Fix:** Optional — no change required for current scope; note as a future hardening item
if Coolify's runtime policy tightens.

### IN-02: `package.json` pins `vite` via `overrides` with no inline rationale

**File:** `website/package.json:27-29`
**Issue:**
```json
"overrides": {
  "vite": "^6.4.1"
}
```
`package.json` can't carry comments, so a future maintainer (or the next phase's agent)
has no way to tell from this file alone whether the override exists to resolve a
transitive Astro/Vite version conflict, patch a CVE, or was a one-off local fix that's
safe to remove after an `astro` upgrade.
**Fix:** Document the reason in `DEPLOY.md` or a short note near the "Version Alignment"
section of `CLAUDE.md`, e.g. "vite pinned via override to `^6.4.1` because Astro
5.18.2's own vite dependency resolves to a version with [specific issue]."

### IN-03: Redundant `try_files` fallback in `nginx.conf`

**File:** `website/nginx.conf:12`
**Issue:** `try_files $uri $uri/ $uri/index.html =404;` — the third alternative
(`$uri/index.html`) is redundant with the second (`$uri/`), since nginx's `index
index.html;` directive (nginx.conf:5) already resolves `$uri/` to `index.html` when that
directory-form lookup succeeds. Not a bug (both paths produce the same result), just
unnecessary.
**Fix:**
```nginx
try_files $uri $uri/ =404;
```

### IN-04: No `HEALTHCHECK` in the final image

**File:** `website/Dockerfile:8-11`
**Issue:** The final stage has no `HEALTHCHECK` instruction. Coolify/Traefik likely
performs its own external health probing against the exposed port, making this
non-blocking, but an explicit `HEALTHCHECK` makes the image self-describing and useful
outside the Coolify context (e.g. local `docker run` smoke tests referenced in
`DEPLOY.md`'s Plan 01 verification).
**Fix:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1
```

---

_Reviewed: 2026-08-06T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
