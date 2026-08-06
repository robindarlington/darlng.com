---
phase: 01-infrastructure-deploy
audited: 2026-08-06
asvs_level: 1
block_on: high
threats_total: 14
threats_closed: 14
threats_open: 0
unregistered_flags: 0
status: SECURED
---

# Phase 01: Security Audit — Infrastructure & Deploy

**Scope:** 01-01-PLAN.md (walking skeleton: Astro scaffold, Dockerfile, nginx.conf) and
01-02-PLAN.md (legacy archive + `website/DEPLOY.md` runbook). Verification method:
adversarial — every mitigation confirmed by direct grep/read against implemented files,
not inferred from SUMMARY.md prose or plan intent. ASVS L1: presence-level verification
(pattern exists in the cited file at the correct location).

Post-review fixes from `01-REVIEW.md` (WR-01 `.dockerignore` `.env*` exclusion, WR-02
nginx security headers) are treated as part of the implemented baseline and verified
directly in `website/nginx.conf` and `website/.dockerignore`, not taken on faith from the
review's "Resolution" notes.

## Threat Verification — Plan 01-01 (Walking Skeleton)

| Threat ID | Category | Severity | Disposition | Evidence | Status |
|-----------|----------|----------|-------------|----------|--------|
| T-01-SC | Tampering (npm installs) | high | mitigate | `website/package.json` pins every dependency by explicit version (exact `4.1.16` for `@tailwindcss/vite`/`tailwindcss`, caret-pinned elsewhere per plan); `website/package-lock.json` exists and is git-tracked; `website/Dockerfile:4` runs `npm ci` (lockfile-exact install, not `npm install`) | CLOSED |
| T-01-02 | Tampering (Docker base images) | medium | mitigate | `website/Dockerfile:1` `FROM node:22-alpine AS build`, `Dockerfile:8` `FROM nginx:stable-alpine AS final` — both explicit tags, no `latest` anywhere in the file | CLOSED |
| T-01-03 | Information Disclosure (repo secrets) | high | mitigate | `website/.gitignore:4-5` excludes `.env`, `.env.production`; `git ls-files \| grep -i .env` returns nothing committed; no hardcoded secret-shaped literal found in `website/src`, `website/*.mjs`, `website/*.json` | CLOSED |
| T-01-04 | Information Disclosure (shipped image) | medium | mitigate | `website/Dockerfile` `final` stage (lines 8-11) copies only `/app/dist` and `nginx.conf` — no `COPY` of `node_modules` or `src/`; `website/.dockerignore` excludes `node_modules`, `dist`, `.astro`, `.git`, `DEPLOY.md`, `.env`, `.env.*`, `.DS_Store` (post-WR-01-fix state confirmed directly, not from review notes) | CLOSED |
| T-01-05 | Information Disclosure (nginx headers) | low | mitigate | `website/nginx.conf:3` `server_tokens off;` present at server level | CLOSED |
| T-01-06 | Spoofing (legacy content vs. new build) | medium | mitigate | `website/Dockerfile` lives inside `website/`, so any build invoked with that directory as context (`docker build ./website`, and Coolify's documented `Base Directory: website/` in `DEPLOY.md:44`) structurally cannot reach `legacy/`, which sits as a sibling directory outside `website/`; confirmed by directory listing | CLOSED |
| T-01-07 | Denial of Service (nginx container) | low | accept | Rationale recorded in `01-01-PLAN.md` threat_model: static-file-only container, no app runtime/DB/body parsing, rate limiting delegated to Coolify's Traefik edge (out of phase scope). Severity `low` is below `block_on: high` — non-blocking regardless of disposition. Accepted risk carried into this SECURITY.md as the log of record. | CLOSED (accepted, documented) |
| T-01-08 | Tampering (archived `legacy/` tree) | low | accept | Rationale recorded in `01-01-PLAN.md` threat_model: `legacy/` retained per D-12 but outside the Docker build context (confirmed above under T-01-06), unreachable at runtime. Severity `low`, below `block_on: high`. | CLOSED (accepted, documented) |

## Threat Verification — Plan 01-02 (Legacy Archive + DEPLOY.md Runbook)

| Threat ID | Category | Severity | Disposition | Evidence | Status |
|-----------|----------|----------|-------------|----------|--------|
| T-01-09 | Information Disclosure (`DEPLOY.md` in public repo) | high | mitigate | Directly re-ran both negative-grep checks against the current file: `grep -Eq 're_[A-Za-z0-9]{16,}' website/DEPLOY.md` → no match (clean); `grep -Eiq '(password\|api[_ -]?key)[[:space:]]*[=:][[:space:]]*[A-Za-z0-9]{12,}' website/DEPLOY.md` → no match (clean). Every credential in the file is phrased as "where to obtain / where to paste" (e.g. `DEPLOY.md:92-93`, `DEPLOY.md:105`) | CLOSED |
| T-01-10 | Elevation of Privilege (Listmonk admin panel) | high | mitigate | `website/DEPLOY.md:80-84` places "log in with the default admin credentials and change the password" as the first instructed action after the service is reachable, textually before the SMTP config step (`DEPLOY.md:85`) and the list-creation step (`DEPLOY.md:98`) | CLOSED |
| T-01-11 | Spoofing (darlng.com sending identity) | high | mitigate | `website/DEPLOY.md:128-133` (Resend Records tab, copy-verbatim instruction, explicit prohibition on typing DKIM/SPF values from memory or a generic guide) and `DEPLOY.md:136-138` (mxtoolbox external verification before trusting deliverability) — both confirmed present by direct grep (`mxtoolbox` at line 137) | CLOSED |
| T-01-12 | Tampering (Coolify auto-deploy from `master`) | medium | mitigate | `website/DEPLOY.md:44-46` documents `Base Directory: website/` as mandatory, confining the build context away from `legacy/` and repo-root files even under push-triggered CD | CLOSED |
| T-01-13 | Denial of Service (live domain during cutover) | medium | accept | Rationale recorded in `01-02-PLAN.md` threat_model: D-15's direct-flip cutover creates a brief exposure window; runbook reduces it via the domain-binding-collision step confirmed present at `website/DEPLOY.md:31` ("do this FIRST"). Severity `medium`, below `block_on: high`. | CLOSED (accepted, documented) |
| T-01-14 | Repudiation (archived `legacy/` tree) | low | accept | Rationale recorded in `01-02-PLAN.md` threat_model: `legacy/` retained in repo/git history by D-12 decision, outside Docker build context (confirmed above), deletion deferred to milestone cleanup. Severity `low`, below `block_on: high`. | CLOSED (accepted, documented) |

## Unregistered Flags

None. Neither `01-01-SUMMARY.md` nor `01-02-SUMMARY.md` contains a `## Threat Flags`
section, indicating the executor identified no new attack surface outside the planned
threat register. Independent review of the implemented files (Dockerfile, nginx.conf,
DEPLOY.md, package.json, .gitignore/.dockerignore) found no additional entry point,
credential path, or trust boundary not already covered by T-01-SC through T-01-14 —
this phase ships no interactive server code, no forms, no API routes (`output: 'static'`,
no adapter), so the attack surface is limited to build-supply-chain, image-content, and
static-response-header concerns, all of which are registered threats.

## Known Accepted Tradeoffs (carried forward, not re-flagged as open)

- **npm audit findings (4: 2 low, 2 high)** against `astro`, `@astrojs/mdx`, `esbuild`,
  `sharp` — resolvable only by upgrading to `astro@7.2.0`/`sharp@0.35.3`, which is
  forbidden by the locked-stack pin in `CLAUDE.md` (Astro 5.x line only, deliberate
  sibling-site parity decision). Documented in `01-01-SUMMARY.md` "Issues Encountered".
  Not part of the STRIDE register as a discrete threat ID; carried here as context so it
  is not silently rediscovered as a "new" finding in a future audit.
- **nginx running as root in `nginx:stable-alpine`** (no `USER` directive in the final
  stage) — standard behavior for the stock image (workers still drop privileges), flagged
  as `IN-01` (info-level, non-blocking) in `01-REVIEW.md`. Noted as a future
  defense-in-depth item (e.g. `nginxinc/nginx-unprivileged`), not a Phase 1 blocker.

## Verification Method Notes

- All `mitigate` threats verified by direct grep/read against the current state of
  `website/Dockerfile`, `website/nginx.conf`, `website/.dockerignore`, `website/.gitignore`,
  `website/package.json`, and `website/DEPLOY.md` — re-run independently in this audit,
  not copied from `01-01-SUMMARY.md`/`01-02-SUMMARY.md`/`01-VERIFICATION.md` prose.
- All `accept` threats have their rationale recorded in the source `<threat_model>` blocks
  of `01-01-PLAN.md` and `01-02-PLAN.md`; this document is the first `SECURITY.md` for the
  phase and now serves as the accepted-risk log of record going forward.
- No file under audit was modified by this process (read-only verification).

**threats_open:** 0
