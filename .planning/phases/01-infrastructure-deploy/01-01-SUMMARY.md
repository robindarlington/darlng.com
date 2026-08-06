---
phase: 01-infrastructure-deploy
plan: 01
subsystem: infra
tags: [astro, tailwind4, preact, mdx, docker, nginx, vite]

requires: []
provides:
  - "Astro 5.18.2 scaffold in website/ (pinned deps, mirrors sibling site's integration wiring)"
  - "Multi-stage Dockerfile (node:22-alpine build -> nginx:stable-alpine serve) shipping only dist/"
  - "nginx.conf with real 404 handling (=404 + error_page) and D-08 path-differentiated Cache-Control"
affects: ["01-02 (legacy move, DEPLOY.md runbook)", "02 (brand/data/layout builds inside this pipeline)"]

actuals:
  tokens: 24500
  tasks: 3
  commits: 4

tech-stack:
  added: [astro@5.18.2, "@tailwindcss/vite@4.1.16", tailwindcss@4.1.16, "@astrojs/preact@4.1.3", "@astrojs/mdx@4.3.14", "@astrojs/sitemap@3.7.3", preact@10.27.2, sharp@0.34.5, typescript@5.9.3, "@astrojs/check@0.9.9"]
  patterns:
    - "build.inlineStylesheets: 'never' — guarantees a hashed dist/_astro/ bundle even on a near-empty page"
    - "nginx: server-level default Cache-Control no-cache + location ^~ /_astro/ override for immutable 1yr caching"
    - "nginx real-404 pattern: try_files ... =404 + server-level error_page 404 /404.html (NOT /404.html as the last try_files arg, which would serve 200)"
    - "npm overrides.vite pinned to force a single deduped vite version across astro + @tailwindcss/vite + @astrojs/preact's toolchain"

key-files:
  created:
    - website/package.json
    - website/package-lock.json
    - website/astro.config.mjs
    - website/tsconfig.json
    - website/.gitignore
    - website/.dockerignore
    - website/src/pages/index.astro
    - website/src/pages/404.astro
    - website/src/styles/global.css
    - website/Dockerfile
    - website/nginx.conf
  modified: []

key-decisions:
  - "Authored scaffold files directly with Write instead of npm create astro@5.18.2 — that scaffolder version returns a registry 404 (create-astro's latest is 5.2.3); direct authoring is deterministic and avoids interactive prompts."
  - "Pinned @tailwindcss/vite and tailwindcss to exact 4.1.16 (no caret) plus added npm overrides.vite: ^6.4.1 — the caret range resolved to @tailwindcss/vite@4.3.3 which peer-requires vite ^7/^8, conflicting with astro's internally bundled vite@6.4.1 and breaking astro check with a Plugin<any> type mismatch. Exact pin + override forces a single deduped vite tree; check now reports 0 errors."
  - "nginx cache headers implemented as a server-level default (no-cache) plus a single location ^~ /_astro/ override (immutable/1yr), not competing regex locations — add_header does not inherit into a location that declares its own, giving clean override semantics per D-08."

requirements-completed: [INFRA-01, INFRA-02]

coverage:
  - id: D1
    description: "Astro 5 project scaffolded in website/, pinned to the 5.x line, builds cleanly to dist/ with PUBLIC_LISTMONK_* unset"
    requirement: "INFRA-01"
    verification:
      - kind: other
        ref: "env -u PUBLIC_LISTMONK_URL -u PUBLIC_LISTMONK_LIST_UUID npm run build --prefix website"
        status: pass
      - kind: other
        ref: "npm run check --prefix website (0 errors/warnings/hints)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Multi-stage Dockerfile + nginx.conf serve the build: real HTTP 200 on /, real HTTP 404 (not 200) on a missing path, and D-08 path-differentiated Cache-Control headers"
    requirement: "INFRA-02"
    verification:
      - kind: other
        ref: "docker build + docker run + curl against localhost:8080 (/, /nope, /index.html, /_astro/<hash>)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Shipped container image contains no node_modules, no src/, no legacy 2019 placeholder assets — build context isolation and multi-stage discard both hold"
    verification:
      - kind: other
        ref: "docker run --rm darlng-site:local sh -c '! test -e .../node_modules && ! test -e .../src'"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-08-06
status: complete
---

# Phase 1 Plan 1: Infrastructure & Deploy — Walking Skeleton Summary

**Astro 5.18.2 scaffold packaged behind a multi-stage node:22-alpine/nginx:stable-alpine Dockerfile, proving a real HTTP 200 on `/`, a genuine 404 (not a 200 homepage fallback) on a missing path, and D-08 cache headers, all verified locally against `localhost:8080`.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-08-06T20:04:00Z (approx.)
- **Completed:** 2026-08-06T20:20:36Z
- **Tasks:** 3
- **Files modified:** 11 created, 2 further touched by the deviation fix (package.json, package-lock.json)

## Accomplishments
- Astro 5 scaffold in `website/` mirroring the sibling site's `astro.config.mjs` integration order (`sitemap()`, `preact()`, `mdx()`, Tailwind 4 via `@tailwindcss/vite` in `vite.plugins`), `site: "https://darlng.com"`, `build.inlineStylesheets: 'never'`
- `npm run build` with `PUBLIC_LISTMONK_URL`/`PUBLIC_LISTMONK_LIST_UUID` deliberately unset exits 0 and emits `dist/index.html`, `dist/404.html`, and a non-empty hashed `dist/_astro/` bundle (`client.*.js`, `signals.module.*.js`, `index.*.css`)
- Multi-stage `Dockerfile` (`node:22-alpine` build -> `nginx:stable-alpine` final) ships only `dist/` + `nginx.conf`; verified no `node_modules` or `src/` reach the running container
- `nginx.conf` serves a genuine HTTP 404 (`try_files ... =404` + `error_page 404 /404.html`) instead of the Nixpacks-style 200-homepage fallback D-07 exists to avoid, and applies D-08's path-differentiated `Cache-Control` (`no-cache` on HTML, `public, max-age=31536000, immutable` on `/_astro/`)
- `server_tokens off` confirmed in effect — no nginx version number in the `Server` response header

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end tracer — browser request returns the built DARLNG page from the container** - `5ba5412` (feat)
2. **Task 2: Expansion — a missing URL returns a real 404, not the homepage** - `07c8ff2` (feat)
3. **Task 3: Expansion — per-path cache headers** - `39ddd07` (feat)
4. **Deviation fix — pin Tailwind Vite plugin + vite override** - `2cff0bd` (fix)

**Plan metadata commit:** pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS)

## Files Created/Modified
- `website/package.json` - pinned dependency set; `@tailwindcss/vite`/`tailwindcss` exact-pinned to 4.1.16, `overrides.vite` added
- `website/package-lock.json` - generated; committed so the Docker build stage's `npm ci` is reproducible
- `website/astro.config.mjs` - `defineConfig` with `site`, integration order, Tailwind Vite plugin, `inlineStylesheets: 'never'`
- `website/tsconfig.json` - extends `astro/tsconfigs/strict`
- `website/.gitignore` - excludes `dist/`, `.astro/`, `node_modules/`, `.env*`; does NOT exclude `package-lock.json`
- `website/.dockerignore` - keeps `node_modules`, `dist`, `.astro`, `.git`, `DEPLOY.md` out of the build context
- `website/src/pages/index.astro` - `/` route, imports `../styles/global.css`
- `website/src/pages/404.astro` - `/404` route, compiles to `dist/404.html`
- `website/src/styles/global.css` - `@import "tailwindcss";`
- `website/Dockerfile` - two stages, pinned base image tags, `COPY --from=build`
- `website/nginx.conf` - `server_tokens off`, real 404 chain, path-differentiated `Cache-Control`

## Decisions Made
- Scaffolded files directly with the Write tool rather than invoking `npm create astro@5.18.2` — RESEARCH.md's scaffolder version command 404s against the registry; direct authoring is deterministic and avoids interactive prompts in an unattended run.
- Exact-pinned `@tailwindcss/vite`/`tailwindcss` to `4.1.16` and added an npm `overrides.vite: ^6.4.1` — see Deviations below for the full rationale.
- Cache-Control implemented as a server-level default plus one `location ^~ /_astro/` override rather than a pair of competing regex locations, per the plan's explicit reasoning about `add_header` non-inheritance and `try_files`/`index` route-matching subtlety.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pinned Tailwind Vite plugin exact + added npm vite override to fix a real `astro check` type error**
- **Found during:** Post-Task-3 full plan-level verification (`npm run check --prefix website`)
- **Issue:** `package.json`'s planned `^4.1.16` caret range for `@tailwindcss/vite` resolved to `4.3.3` at install time (registry drift within the allowed caret range — the exact failure mode RESEARCH.md's Pitfall 5 warned about, just one dependency level removed from the directly-pinned packages). `@tailwindcss/vite@4.3.3` peer-requires `vite ^5||^6||^7`, and npm's resolver hoisted `vite@7.3.6`/`8.2.1` to the root of the tree, while `astro@5.18.2` depends on its own nested `vite@^6.4.1`. The two different Vite `Plugin<any>` type definitions are structurally incompatible, so `astro.config.mjs`'s `vite: { plugins: [tailwindcss()] }` failed TypeScript's assignability check with a `ts(2322)` error under `astro check`.
- **Fix:** Changed `@tailwindcss/vite` and `tailwindcss` from `^4.1.16` to an exact `4.1.16` pin (the RESEARCH.md-verified version), and added `"overrides": { "vite": "^6.4.1" }` to `package.json` to force a single deduped `vite` version across the entire dependency tree (`npm ls vite` now shows one `vite@6.4.3` resolution, no duplicates). Ran `rm -rf node_modules package-lock.json && npm install` to regenerate a clean lockfile.
- **Files modified:** `website/package.json`, `website/package-lock.json`
- **Verification:** `npm run check --prefix website` now reports `0 errors, 0 warnings, 0 hints` (previously 1 error). Re-ran the full build + Docker + curl verification suite after the fix — `npm run build`, `docker build`, `GET /` -> 200, `GET /nope` -> 404, `/index.html` cache header, `/_astro/<hash>` cache header all still pass unchanged.
- **Committed in:** `2cff0bd`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correctness — `npm run check` reporting a real type error would otherwise silently regress with any future `npm install` inside `website/` as the ecosystem's `@tailwindcss/vite` and `vite` versions continue to move. `astro build` itself was never broken (type-checking is deliberately kept out of the build script per the plan), so this did not block Tasks 1-3's own acceptance criteria — it was caught by the plan-level `<verification>` step 3 (`npm run check`) and fixed before finalizing. No scope creep.

## Issues Encountered

- `npm audit` reports 4 vulnerabilities (2 low, 2 high) against `astro`, `@astrojs/mdx`, `esbuild`, and `sharp` — all fixed only by upgrading to `astro@7.2.0`/`sharp@0.35.3`, which is explicitly forbidden by `CLAUDE.md` and this plan's locked stack (Astro 5.x line only). This is a known, accepted tradeoff of the pinned-version decision, not a deviation to fix here — flagging for awareness; no action taken, no `npm audit fix --force` run.

## User Setup Required

None - no external service configuration required. This plan is entirely local; Listmonk/Coolify/DNS/Resend work is deferred to Plan 02's `DEPLOY.md` runbook per the scope revision.

## Next Phase Readiness

- The walking skeleton is fully proven locally: `npm run build` (with Listmonk env vars unset) succeeds, `npm run check` is clean, and the Docker image serves a real 200/404 with correct D-08 cache headers on `localhost:8080`.
- `website/` is ready for Plan 02 (legacy file relocation to `legacy/`, `website/DEPLOY.md` runbook) and for Phase 2 (brand tokens, real layout, `src/data/releases.ts`) to build content inside this pipeline without touching the Dockerfile/nginx.conf/astro.config.mjs contract established here.
- No blockers. The one open concern (npm audit vulnerabilities tied to the deliberate Astro 5.x pin) is documented above for visibility, not a blocker for Plan 02 or Phase 2.

---
*Phase: 01-infrastructure-deploy*
*Completed: 2026-08-06*

## Self-Check: PASSED

All 11 created files verified present on disk. All 5 commits (5ba5412, 07c8ff2, 39ddd07, 2cff0bd, 36f40b8) verified present in git log.
