---
phase: 04-newsletter-fan-capture
audit_date: 2026-08-08
asvs_level: 1
block_on: high
threats_open: 0
status: SECURED
---

# Phase 04 Security Audit

All 17 threat instances (15 unique IDs) across the three plans independently verified against code/docs — greps and rebuilds performed fresh, not trusted from SUMMARYs.

## Threat Verification

| Threat ID | Category | Severity | Disposition | Evidence |
|-----------|----------|----------|-------------|----------|
| T-04-01 | Denial of Service | high | mitigate | Honeypot check runs FIRST in `handleSubmit`, before any fetch (`NewsletterForm.tsx:63-78`); DEPLOY.md documents nginx `limit_req_zone` + Traefik `ratelimit` recipes as the server-side lever |
| T-04-02 | Information Disclosure | low | accept | List UUID is public by design (CLAUDE.md: "not a credential"); no Listmonk API key anywhere in the build |
| T-04-03 | Information Disclosure | medium | mitigate | Zero `localStorage`/`sessionStorage`/`console.` matches in the island; email lives only in `useState` |
| T-04-04 | Tampering | medium | mitigate | Fetch target composed solely from the build-time env prop, trailing-slash-normalized in `index.astro`; no query/DOM/referrer fallback |
| T-04-05 | Spoofing | low | accept | Client regex is UX-only; no server-trust claim |
| T-04-SC (x3) | Tampering | high/low | mitigate/accept | No dependency-adding commits this phase; tailwind pins byte-identical |
| T-04-06 | Tampering | medium | mitigate | DEPLOY.md: "CORS — configure it in exactly ONE place, never two" (trusted_urls primary, proxy fallback) |
| T-04-07 | Denial of Service | high | mitigate | Rate-limit recipes + live verification step requiring operator to confirm 429 fires |
| T-04-08 | Information Disclosure | medium | mitigate | Independent greps for API-key/DKIM/UUID-shaped patterns in DEPLOY.md — clean |
| T-04-09 | Repudiation | high | mitigate | DEPLOY.md states plainly ALTCHA does not protect the API endpoint; direct POST returning 200 documented as expected |
| T-04-10 | Elevation of Privilege | medium | transfer | First-login password-change step present in DEPLOY.md Section 2 |
| T-04-11 | Denial of Service | high | mitigate (residual note) | Env-unset rebuild: `id="newsletter"` count = 0; env-set: 1. Residual orphaned `NewsletterForm.*.js` chunk on disk is referenced by NO HTML page (grep verified) — browser-unreachable, honestly self-reported in 04-03-SUMMARY |
| T-04-12 | Tampering | low | mitigate | No mock-listmonk artifacts in dist (independent rebuild) |
| T-04-13 | Information Disclosure | low | accept | Only synthetic `.local` addresses used in tests; evidence confined to /tmp (outside repo) |
| T-04-14 | Repudiation | medium | mitigate | The literal failing check was reported as a failure in the coverage table, not weakened; a stronger additive check established the real safety property |

## Unregistered Flags

None — no `## Threat Flags` sections in any SUMMARY; no new unmapped attack surface.

## Accepted-Risks Log (seed)

First secure-phase accepted-risk log for this repo. Accepted/transferred this phase: T-04-02 (public list UUID), T-04-05 (client-only validation), T-04-SC x3 (no package surface touched), T-04-10 (admin password ownership transferred to operator), T-04-13 (synthetic test data). Rationale lives in the PLAN.md threat tables. Future phases should check new accepts against this log.

## Known Accepted Tradeoffs (carried forward)

- npm audit items requiring Astro 7 (locked to 5.x per CLAUDE.md); nginx root in stock image; orphaned island chunk in env-unset builds (Astro architecture, browser-unreachable).
