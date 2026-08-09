---
phase: 05-seo-launch-polish
audit_date: 2026-08-09
asvs_level: 1
block_on: high
threats_open: 0
status: SECURED
---

# Phase 05 Security Audit

All 15 unique threat IDs (17 instances across 05-01/05-02/05-03, including the repeated `T-05-SC` supply-chain entry) independently re-verified against a fresh `npm run build` and direct file/artifact inspection — not accepted from SUMMARY.md self-reports.

## Threat Verification

| Threat ID | Category | Severity | Disposition | Evidence |
|-----------|----------|----------|-------------|----------|
| T-05-01 | Tampering | low | mitigate | `generate-assets.mjs` — `SLUG_PATTERN = /^[a-z0-9-]+$/` validated before every output path composition; home card path hardcoded, never slug-derived |
| T-05-02 | Tampering | low | mitigate | Zero `set:html` in `Layout.astro`; all interpolated values pass through Astro auto-escaped attribute binding |
| T-05-03 | Spoofing | medium | mitigate | `new URL(..., Astro.site).href` throughout; all og:image/og:url/twitter:image on all 6 built pages begin `https://darlng.com/` |
| T-05-04 | Information Disclosure | low | accept | `src/assets/releases/` holds exactly the 4 released covers; no draft assets |
| T-05-05 | Denial of Service | low | accept | Cards fixed 1200x630, build-time only, never on a request path |
| T-05-06 | Denial of Service | high | mitigate | `dist/robots.txt` byte-diffed against expected 4-line string — exact match |
| T-05-07 | Information Disclosure | low | accept | `dist/sitemap-0.xml` contains exactly 5 loc entries, no /404 |
| T-05-08 | Tampering | medium | mitigate | `location = /sitemap.xml` declares no add_header — server security headers inherited |
| T-05-09 | Tampering | low | accept | favicon.svg is rect + one path only — no script, no external reference |
| T-05-10 | Spoofing | low | mitigate | robots Sitemap line + all sitemap locs are `https://darlng.com/...` only |
| T-05-11 | Tampering | medium | mitigate | Mock Listmonk values passed inline only (never written to file); tree clean; generated assets gitignored |
| T-05-12 | Elevation of Privilege | medium | mitigate | No sandbox-disabling flags in Lighthouse/Chrome invocations |
| T-05-13 | Information Disclosure | low | mitigate | Test containers bind-mount only dist/ + nginx.conf, read-only, stock nginx:stable-alpine |
| T-05-14 | Denial of Service | low | mitigate | Force-remove + exit trap in verify scripts; no darlng-perf container present. (Ad hoc darlng-lh container from the orchestrator h2 re-measurement torn down at audit close.) |
| T-05-15 | Repudiation | medium | mitigate | DEPLOY.md cites real measured numbers with corroborating JSON path; the LCP measurement-artifact story is disclosed, not hidden |
| T-05-SC (x3) | Tampering | high | mitigate | Only package.json change across Phase 5 is one `scripts.prebuild` line — zero dependency changes |

## Unregistered Flags

None — all three SUMMARY Threat Flags sections report "None," independently corroborated.

## Accepted-Risks Log (this phase)

T-05-04, T-05-05, T-05-07, T-05-09 — rationale in each plan's threat_model table. Checked against the Phase 04 accepted-risks log — no conflicts.

## Known Accepted Tradeoffs (carried forward, not re-flagged)

- No Content-Security-Policy header (T-03-05 / IN-05) — deliberate documented decision.
- Orphaned newsletter island chunk in env-unset builds (Astro architecture, browser-unreachable).
- npm audit items requiring Astro 7 (locked to 5.x per CLAUDE.md).
- nginx root in the stock upstream image.
