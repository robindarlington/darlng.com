---
phase: 03-core-fan-experience
audit_date: 2026-08-08
asvs_level: 1
block_on: high
threats_open: 0
status: SECURED
---

# Phase 03 Security Audit

All 11 threats from the Phase 03 threat models (03-01, 03-02, 03-03) independently re-verified against the working tree (fresh `npm run build`, `npx astro check`, `node scripts/check-contrast.mjs`; grep evidence on `dist/` output including exact-match count invariants; independent recomputation of the fallback-icon count from `releases.ts` rather than trusting the SUMMARY's self-report; `git log`/`git diff` confirmation that no package manifest changed).

## Threat Verification

| Threat ID | Category | Severity | Disposition | Evidence |
|-----------|----------|----------|-------------|----------|
| T-03-01 | Tampering | high | mitigate | `target="_blank"`/`rel="noopener noreferrer"` occurrence counts match exactly across all 6 built pages: `index.html` 22/22, `404.html` 10/10, `listen/eseriani` 14/14, `listen/randevu` 17/17, `listen/brave` 15/15, `listen/open-wide` 16/16 |
| T-03-02 | Information Disclosure | high | mitigate | `grep -o '<iframe' dist/index.html` = 0. Only inert `href`-attribute references to youtube.com (Follow-anchor x2, hero CTA watch link x1); the one `youtube-nocookie.com` substring lives inside the inline `<script>` string template in `YouTubeFacade.astro:51`, built and assigned only inside the `{ once: true }` click handler. No `<link>`/`<img>`/`<script src>` references any youtube/ytimg/google host |
| T-03-03 | Tampering | medium | mitigate | `YouTubeFacade.astro:42` — `<script define:vars={{ videoId, titleForA11y }}>`, typed constants from `releases.ts`, never read from DOM/URL. Injected iframe sets `title`, `allow="autoplay; encrypted-media; picture-in-picture"`, `allowFullscreen`, `referrerPolicy="strict-origin-when-cross-origin"` |
| T-03-04 | Spoofing | medium | mitigate | `platform-icons.ts` maps only the 8 verified simple-icons exports; `amazonMusic`/`anghami`/`boomplay` -> `null`, rendered via `ExternalLink` fallback, never filtered/skipped in `DiscographyCard.astro` or `PlatformButton.astro`. Recomputed expected fallback count from `releases.ts` independently: 2 on homepage cards, 4 across listen pages = 6 total — matches |
| T-03-05 | Tampering | low | accept | `website/nginx.conf` sets no `Content-Security-Policy` header today (verified header list: Cache-Control, X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy). Phase 5 CSP dependency recorded in 03-02-PLAN.md |
| T-03-06 | Denial of Service | low | mitigate | `fit="cover"` present on every `<Picture>` this phase touches; hero `widths` capped at `[640,960,1254]` matching the 1254px source; facade `widths` capped at `[480,720,960]` |
| T-03-07 | Information Disclosure | low | accept | `rel="noopener noreferrer"` (superset of `noreferrer`) applied on every new external anchor — exceeds the accepted baseline |
| T-03-08 | Tampering | low | transfer | `X-Frame-Options: SAMEORIGIN` present in both the `server{}` block and `/_astro/` location block of `website/nginx.conf`; inner-frame framing posture is YouTube's, out of project control, as documented |
| T-03-09 | Spoofing | high | mitigate | All 4 FAN-03 profile URLs present >=2x on all 6 built pages; `aria-label="Follow DARLNG on` = exactly 10/page; `open.spotify.com/follow`, `spotify.com/embed`, `<iframe` all = 0 on all 6 pages |
| T-03-10 | Information Disclosure | low | mitigate | `DiscographyCard.astro` renders only `<a>` anchors, no embed/player; `<iframe` count = 0 in built homepage |
| T-03-SC | Tampering | high | accept | No phase-3 commit touches `website/package.json`; `@lucide/astro`/`simple-icons` versions unchanged since Phase 2 |

## Unregistered Flags

None. No `## Threat Flags` section in `03-01-SUMMARY.md`, `03-02-SUMMARY.md`, or `03-03-SUMMARY.md`. Independent scan for new attack surface (`set:html`, `innerHTML`, `dangerouslySetInnerHTML`, `eval(`, `new Function`, `document.cookie`, `location.` reads) across all phase-3 component/page files found nothing.

## Known Accepted Tradeoffs (carried forward, not re-flagged)

- npm audit items (`sharp <0.35.0` high-severity libvips CVEs, `esbuild`/transitive `astro` advisories) requiring an Astro 7 upgrade — locked to Astro 5.x per CLAUDE.md.
- nginx runs as root in stock `nginx:stable-alpine` (Phase 1 note, unaffected by this phase).
