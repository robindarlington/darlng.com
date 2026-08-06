---
phase: 02-brand-data-base-layout
audit_date: 2026-08-07
asvs_level: 1
block_on: high
threats_open: 0
status: SECURED
---

# Phase 02 Security Audit

All 12 threats from the Phase 02 threat models independently re-verified against the working tree (fresh `npm run build`, `npx astro check`, `npm run check:contrast`; grep evidence on `dist/` output; line-by-line URL diffs against `.planning/CONTENT.md`).

## Threat Verification

| Threat ID | Category | Severity | Disposition | Evidence |
|-----------|----------|----------|-------------|----------|
| T-02-01-SC | Tampering | high | mitigate | `website/package.json`: `@fontsource-variable/unbounded@^5.3.0`, `@fontsource-variable/manrope@^5.3.0`, `@lucide/astro@^1.29.0`, `simple-icons@^16.28.0` — matches RESEARCH.md audit exactly. Deprecated `lucide-astro` absent. `package-lock.json` git-tracked (commit `84f0545`), clean status, matching pinned versions. |
| T-02-01-01 | Information Disclosure | medium | mitigate | `grep -rc 'googleapis\|gstatic\|cdn\.' dist/` → 0. No external `url()` refs in `dist/_astro/*.css`. Fonts self-hosted via Fontsource imports + Vite `?url` woff2 preloads (`Layout.astro`). |
| T-02-01-02 | Spoofing | medium | mitigate | All 4 Eseriani platform URLs diffed character-for-character against CONTENT.md — exact match. No aggregator URLs shipped. |
| T-02-01-03 | Tampering | low | accept | Rationale in 02-01-PLAN threat_model (developer-owned image sources; Sharp fails loudly). Below block threshold. |
| T-02-01-04 | Denial of Service | low | accept | Build-time only; bounded `widths` `[384,768,1152]` below 1254px source. Below block threshold. |
| T-02-01-05 | Tampering | medium | mitigate | `check-contrast.mjs` Guard A (token presence) + Guard B (non-vacuous 9-pair table) present; re-ran gate — 9/9 PASS ≥4.5:1. |
| T-02-02-01 | Tampering (reverse tabnabbing) | medium | mitigate | `dist/index.html`: 10× `target="_blank"` / 10× `rel="noopener noreferrer"` (matched). `dist/404.html`: 10/10. Fresh build. |
| T-02-02-02 | Spoofing | medium | mitigate | All 5 `socials` URLs exact-match CONTENT.md in correct order (Spotify, Instagram, Facebook, YouTube, TikTok). |
| T-02-02-03 | Information Disclosure | low | accept | simple-icons is CC0-1.0 data-only; `BrandIcon.astro` renders `icon.path` as escaped attribute, not `set:html`. Below block threshold. |
| T-02-02-04 | Tampering (Amazon URL scheme) | medium | mitigate | `https://www.amazon.com/gp/product/B082RBHFWH` vs CONTENT.md `http://` — identical host+path, scheme upgrade only (documented). Zero remaining `http://` URLs in releases.ts. |
| T-02-02-05 | Denial of Service | low | accept | Build-time only, capped widths. Below block threshold. |
| T-02-02-SC | Tampering | low | accept | Commits `2a7d2c1`/`fad2811` touch no package manifests — "installs no packages" claim confirmed. Below block threshold. |

## Unregistered Flags

None. No `## Threat Flags` sections in either SUMMARY. Independent scan for new attack surface (XSS sinks, `eval`/`new Function`, hardcoded secrets, `astro.config.mjs` changes) found nothing — this phase ships zero interactive JS, zero forms, zero API routes (static output only).

## Known Accepted Tradeoffs (carried forward, not re-flagged)

- npm audit items requiring Astro 7 upgrade (locked to Astro 5.x per CLAUDE.md).
- nginx runs as root in stock `nginx:stable-alpine` (Phase 1 note, unaffected by this phase).
