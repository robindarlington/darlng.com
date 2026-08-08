# Phase 4: Newsletter Fan Capture - Context

**Gathered:** 2026-08-08
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — decisions from ROADMAP requirements, `.planning/CONTENT.md` scope revision, and the user's standing direction; remaining choices delegated to Claude.

<domain>
## Phase Boundary

The homepage newsletter capture: a Preact island form in the reserved slot (between The Catalog and the footer) that POSTs to Listmonk's public subscription endpoint, with success / error / already-subscribed states, honeypot + ALTCHA-ready spam posture, and full LOCAL testing against a mocked Listmonk endpoint. **No live Listmonk exists yet** — the user deploys it later from website/DEPLOY.md; this phase ships code that works the moment two env vars are set in Coolify.
</domain>

<decisions>
## Implementation Decisions

### Scope Revision (authoritative, from CONTENT.md)
- Build against `PUBLIC_LISTMONK_URL` + `PUBLIC_LISTMONK_LIST_UUID` env vars (build-time, `import.meta.env`). Values arrive when the user deploys Listmonk — code must degrade gracefully when unset (see below).
- Test locally against a MOCKED endpoint (local dev server route or a tiny mock server started for the test) — success, error, and already-subscribed responses all exercised in the browser.
- Live checks from ROADMAP (real confirmation email, mxtoolbox SPF/DKIM/DMARC, live bot POST) are DEFERRED to the user's deploy step; document their verification steps in DEPLOY.md (extend the existing runbook section).

### Form (FAN-01, FAN-02)
- Preact island (`client:visible` or `client:idle` — pick the lighter correct option; form is below the fold so client:visible fits) — the ONLY client JS besides the facade script.
- POST to `${PUBLIC_LISTMONK_URL}/api/public/subscription` (JSON) with `email`, `list_uuids: [PUBLIC_LISTMONK_LIST_UUID]`. Double opt-in is server-side (list setting) — the UI copy must reflect it: success = "Check your inbox to confirm".
- Three visible states without page refresh: success ("Check your inbox to confirm."), error (network/API failure — friendly retry copy), already-subscribed (Listmonk returns a distinguishable response for existing subscribers — research the exact response shape and handle it; if not distinguishable via the public endpoint, treat as success-equivalent UX and document why).
- Client-side email validation before POST (simple, accessible error messaging; aria-live for state changes).
- **Env-unset behavior:** if `PUBLIC_LISTMONK_URL`/`PUBLIC_LISTMONK_LIST_UUID` are missing at build time, the section still renders but the form submits to nothing gracefully — decide the cleanest approach (render the section with the form disabled + a build-time console warning, OR hide the section entirely). Prefer HIDING the section when env is unset so production never ships a dead form; local dev/testing sets mock env values. Build must stay green either way (Phase 1 established builds pass with these unset).

### Spam Protection (FAN-01)
- Honeypot field (hidden input; reject on fill client-side) NOW.
- ALTCHA: the roadmap wants bot POSTs rejected — but ALTCHA server-side verification is a Listmonk-side configuration (Listmonk ≥v5 supports ALTCHA natively). This phase: implement the honeypot client-side, and DOCUMENT the ALTCHA enable step in DEPLOY.md (Listmonk admin setting + any form attribute needed). If Listmonk's public subscription page handles ALTCHA transparently only on ITS hosted form (not the API), record that the API-side bot mitigation is double opt-in + honeypot + (optionally) Listmonk's built-in captcha setting — research the current Listmonk version's exact options and write what's true into DEPLOY.md.

### Design (UI-SPEC to be generated)
- Section heading + one-line pitch in the established voice (independent artist, no schedule — e.g. "New music, no schedule. Get told the moment it drops."). Claude drafts exact copy in the UI-SPEC.
- Email input + submit button using the established token system (surface field, accent CTA per button contract); 44px targets; visible focus states; error color #F0605E for validation text (already contrast-verified).
- Mobile-first; single column; sits between The Catalog and footer in the reserved slot.

### Claude's Discretion
- Island filename/structure, fetch error taxonomy, exact mock approach for testing, microcopy detail, whether to add a tiny inline privacy note ("No spam. Unsubscribe anytime." — recommended).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Reserved insertion slot comment in `website/src/pages/index.astro` (between Catalog section and footer).
- Token system + button/input-ready styles in `global.css`; `@astrojs/preact@^4.1.3` + `preact@^10.27.2` installed since Phase 1 (first actual island this phase — verify the integration works, it's never been exercised).
- Copy voice established (hero kicker, about copy); error color token contrast-verified on bg and surface.
- `website/DEPLOY.md` runbook — extend with: Listmonk list UUID → env vars, CORS at Traefik/proxy layer (STATE.md decision: CORS at proxy, NOT app layer), ALTCHA/bot-protection enable steps, and the live verification checklist (confirmation email test, mxtoolbox, bot POST).

### Established Patterns
- Zero-JS default; islands only where interactive. Browser verification via `npx agent-browser` at 375/768/1440 with screenshots to /tmp/.
- `npm run build` + `npm run check` green with env vars unset (must remain true).
- External links rel pairing invariant; contrast gate 9/9 (add pairs only if new combos appear — input placeholder/text on surface may need a check — reuse verified tokens).

### Integration Points
- STATE.md decision: CORS handled at Traefik/nginx proxy layer on the Listmonk side (documented for the user; nothing to code client-side beyond a normal fetch).
- Phase 5 will need the section to not regress CLS/LCP (island below fold, client:visible, reserve height to avoid CLS).

</code_context>

<specifics>
## Specific Ideas

- The form is a conversion moment, not a chore: styled like the rest of the site pops — accent CTA, confident copy. No corporate "Subscribe to our newsletter".
- aria-live="polite" region for state changes; input labeled (visually or aria); autocomplete="email"; inputmode/email type.
- Reserve vertical space for the island pre-hydration (CLS 0).

</specifics>

<deferred>
## Deferred Ideas

- Live Listmonk deploy, Resend SMTP, DNS auth records, real double-opt-in email test → user's deploy step (DEPLOY.md).
- OG/meta/sitemap/Lighthouse → Phase 5.

</deferred>

---

*Phase: 4-Newsletter Fan Capture*
*Context gathered: 2026-08-08*
