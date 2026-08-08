# Phase 4: Newsletter Fan Capture - Research

**Researched:** 2026-08-08
**Domain:** Preact island form -> Listmonk `/api/public/subscription` JSON API, mocked locally; Astro 5 island hydration; CORS/CAPTCHA posture for self-hosted Listmonk
**Confidence:** HIGH — Listmonk endpoint behavior verified by reading the actual Go handler source (`cmd/public.go`, `cmd/handlers.go`) on the `master` branch, consistent with the latest tagged release (v6.2.0, published 2026-06-26). Astro/Preact findings MEDIUM-HIGH (official docs via WebFetch/WebSearch; Context7 MCP tool was not available this session, see note below).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope Revision (authoritative, from CONTENT.md)**
- Build against `PUBLIC_LISTMONK_URL` + `PUBLIC_LISTMONK_LIST_UUID` env vars (build-time, `import.meta.env`). Values arrive when the user deploys Listmonk — code must degrade gracefully when unset.
- Test locally against a MOCKED endpoint (local dev server route or a tiny mock server started for the test) — success, error, and already-subscribed responses all exercised in the browser.
- Live checks from ROADMAP (real confirmation email, mxtoolbox SPF/DKIM/DMARC, live bot POST) are DEFERRED to the user's deploy step; document their verification steps in DEPLOY.md (extend the existing runbook section).

**Form (FAN-01, FAN-02)**
- Preact island (`client:visible` or `client:idle` — pick the lighter correct option; form is below the fold so client:visible fits) — the ONLY client JS besides the facade script.
- POST to `${PUBLIC_LISTMONK_URL}/api/public/subscription` (JSON) with `email`, `list_uuids: [PUBLIC_LISTMONK_LIST_UUID]`. Double opt-in is server-side (list setting) — the UI copy must reflect it: success = "Check your inbox to confirm".
- Three visible states without page refresh: success, error (network/API failure), already-subscribed (Listmonk returns a distinguishable response for existing subscribers — research the exact response shape and handle it; if not distinguishable via the public endpoint, treat as success-equivalent UX and document why).
- Client-side email validation before POST (simple, accessible error messaging; aria-live for state changes).
- **Env-unset behavior:** prefer HIDING the section when env is unset so production never ships a dead form; local dev/testing sets mock env values. Build must stay green either way.

**Spam Protection (FAN-01)**
- Honeypot field (hidden input; reject on fill client-side) NOW.
- ALTCHA: implement the honeypot client-side, and DOCUMENT the ALTCHA enable step in DEPLOY.md (Listmonk admin setting + any form attribute needed). Research the current Listmonk version's exact options and write what's true into DEPLOY.md.

**Design (UI-SPEC — already generated, see `04-UI-SPEC.md`)**
- Section heading + one-line pitch in the established voice; email input + submit button using the established token system; 44px targets; visible focus states; error color `#F0605E`.
- Mobile-first; single column; sits between The Catalog and footer in the reserved slot.

### Claude's Discretion
- Island filename/structure, fetch error taxonomy, exact mock approach for testing, microcopy detail, whether to add a tiny inline privacy note ("No spam. Unsubscribe anytime." — recommended).
- (UI-SPEC already resolved most of these — see `04-UI-SPEC.md`'s "Discretionary Decisions Log".)

### Deferred Ideas (OUT OF SCOPE)
- Live Listmonk deploy, Resend SMTP, DNS auth records, real double-opt-in email test -> user's deploy step (DEPLOY.md).
- OG/meta/sitemap/Lighthouse -> Phase 5.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FAN-01 | Inline newsletter signup (email field) that POSTs to the self-hosted Listmonk `/api/public/subscription` endpoint, with double opt-in and ALTCHA/honeypot spam protection | Exact endpoint/request/response shape verified from Listmonk source (Standard Stack, Code Examples). ALTCHA reality-check: verified from source that ALTCHA is enforced ONLY on the HTML form handler, never on the JSON API this island calls — see Common Pitfalls #1 and the Security Domain section for the corrected mitigation (honeypot + proxy rate-limiting). |
| FAN-02 | Newsletter form shows clear success / error / already-subscribed states to the fan | Verified: the public API never distinguishes new-vs-existing subscribers (identical 200 response either way). Don't-Hand-Roll + Code Examples sections give a mock-server design that lets the UI-SPEC's already-subscribed branch be exercised locally without contradicting real Listmonk behavior. |
</phase_requirements>

## Summary

This phase wires a Preact island (`NewsletterForm.tsx`) to Listmonk's public JSON subscription endpoint. The two riskiest unknowns going into planning — "does Listmonk distinguish already-subscribed emails?" and "does ALTCHA protect the API endpoint?" — are now **definitively answered by reading Listmonk's actual Go source** (`cmd/public.go`, `master` branch, consistent with the latest tagged release v6.2.0): no, and no. The public JSON handler (`PublicSubscription`, mounted at `POST /api/public/subscription`) always returns HTTP 200 with `{"data":{"has_optin":<bool>}}` for both new and repeat subscribers, and it never calls the CAPTCHA verifier at all — only the separate HTML-form handler (`SubscriptionForm`, `POST /subscription/form`) checks ALTCHA. This means the UI-SPEC's "already-subscribed" state is unreachable against real Listmonk (confirms the UI-SPEC's own documented fallback), and ROADMAP Phase 4 Success Criterion #3 ("rapid-fire bot POST ... returns non-200 ... ALTCHA validation active") **cannot be satisfied by Listmonk's own ALTCHA feature against this endpoint** — the real mitigation is honeypot (client-side, this phase) + reverse-proxy rate-limiting (deploy-time, document in DEPLOY.md). This is a genuine correction to the roadmap's stated success criterion that the planner and user need to see.

On the Astro/Preact side: `@astrojs/preact@4.1.3` and `preact@10.29.8` are already installed and wired into `astro.config.mjs` (confirmed by reading both files), but this is genuinely the **first island ever exercised** in this codebase — `website/tsconfig.json` currently has no `jsx`/`jsxImportSource` compiler options, which the official Astro docs require for `.tsx` files under `@astrojs/preact`. Without adding these two lines, `npm run check` (which runs `astro check`) will very likely fail the moment `NewsletterForm.tsx` is added, even though `npm run build` might still succeed (Vite's JSX transform is independent of tsconfig). This is the single highest-value pitfall this research surfaces.

For local testing, `astro dev` and `astro build` both inline shell-exported `PUBLIC_*` env vars the same way (Vite's static replacement, confirmed via official Astro docs) — so a tiny zero-dependency Node `http` mock server plus `PUBLIC_LISTMONK_URL=http://localhost:PORT PUBLIC_LISTMONK_LIST_UUID=test-uuid npm run dev` is sufficient to exercise success, error, and (synthetically, since real Listmonk can't) already-subscribed states in the browser, satisfying CONTEXT.md's explicit "all three states exercised" requirement.

**Primary recommendation:** Build the island exactly as the UI-SPEC and CONTEXT.md already scoped it, add the two missing tsconfig compiler options, POST JSON to `/api/public/subscription`, treat any 2xx as success (reading `has_optin` from the body only for internal/debug purposes, not for state branching), collapse all non-2xx/timeout/network failures into the single "network/API error" UI state, and build a small stateful mock server (keyed on already-seen email) so the already-subscribed UI branch is visually testable — while documenting in DEPLOY.md that this branch is a UI affordance, not something real Listmonk will ever trigger.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Email input, client-side validation, honeypot check | Browser / Client (Preact island) | — | Pure client-side interaction; no server round-trip needed until submit |
| Subscription POST + response-state branching | Browser / Client (Preact island, `fetch`) | API / Backend (Listmonk) | `output: 'static'` has no server runtime — the browser must POST directly cross-origin; Listmonk's `PublicSubscription` handler owns validation, list-membership insert/update, and (for double opt-in lists) triggering the confirmation email |
| Double opt-in confirmation email send + link | API / Backend (Listmonk) + external SMTP (Resend) | — | Listmonk queues the mail via its configured SMTP relay; entirely outside this phase's code, deferred to DEPLOY.md |
| CORS header emission | API / Backend (Listmonk, native middleware) or CDN/proxy (Traefik) — see Common Pitfalls #4 for the corrected recommendation | — | Verified from source: Listmonk has its OWN app-layer CORS middleware keyed off `security.trusted_urls`, contradicting STATE.md's "proxy layer only" assumption — see Pitfall #4 |
| Bot mitigation (honeypot) | Browser / Client (Preact island) | — | Client-side, best-effort, catches naive/unsophisticated bots only, by design (per UI-SPEC's "no tell to the bot" spec) |
| Bot mitigation (rate limiting) | CDN / Proxy (Traefik/nginx in front of Listmonk) | — | Verified: Listmonk's ALTCHA does NOT protect `/api/public/subscription` (see Summary); the only server-side lever available for THIS endpoint is proxy-level rate limiting, documented for DEPLOY.md, not implemented in this phase's application code |
| Env-unset conditional render | Frontend Server (SSR at build time — Astro static prerender) | — | `import.meta.env.PUBLIC_*` is resolved at build time inside `index.astro`'s frontmatter; when false, the island's hydration script is never emitted into the static output at all |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `preact` | `10.29.8` (installed; package.json pins `^10.27.2`) | Preact runtime for the island | Already installed since Phase 1; 3 KB hooks-based runtime, first real exercise this phase `[VERIFIED: website/package.json:23, website/node_modules/preact/package.json]` |
| `@astrojs/preact` | `4.1.3` (installed; package.json pins `^4.1.3`) | Astro integration wiring Preact into the build | Already wired in `astro.config.mjs` (`preact()` in `integrations`) `[VERIFIED: website/astro.config.mjs:5,11]`. This is the Astro-5-era major (4.x); `6.x` is npm's `latest` tag and targets Astro 6+ — do NOT bump `[VERIFIED: npm view @astrojs/preact versions]` |

No new packages are installed this phase — both dependencies have been present since Phase 1 and are exercised for the first time here.

### Supporting
None new this phase. No icons (UI-SPEC: "this phase adds no icons"), no additional libraries — the mock server (Code Examples, below) is a zero-dependency `node:http` script, not an npm package.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zero-dep `node:http` mock server | `msw` (Mock Service Worker) | MSW is the more "standard" browser-network-mocking tool, but it intercepts at the Service Worker/fetch layer inside the same origin — for THIS phase we specifically need to exercise real cross-origin `fetch()` + CORS behavior (the actual pitfall class documented in PITFALLS.md #4), which a same-origin service-worker mock does not exercise. A real second-process HTTP server on a different port is closer to the actual failure mode. Not worth adding a new devDependency for a throwaway phase-4 testing script. |
| Listmonk's own ALTCHA for the JSON API | Building a custom proof-of-work challenge into the island | Out of scope — verified from source that Listmonk's `PublicSubscription` handler has no captcha hook at all; building a custom client-side PoW check that Listmonk itself doesn't verify would be pure theater. Correct mitigation is proxy rate-limiting (deploy-time), not application code. |

**Installation:**
No installation needed — `preact` and `@astrojs/preact` are already in `website/package.json`. Only `website/tsconfig.json` needs an edit (see Common Pitfalls #1).

**Version verification:**
```
$ npm view preact version          -> 10.29.8
$ npm view @astrojs/preact version -> 6.0.2 (Astro 6+ line — do NOT install; installed 4.1.3 is correct for Astro 5)
```
Both confirmed against the npm registry 2026-08-08. `@astrojs/preact`'s `latest` dist-tag is misleading here — always pin/verify against the *installed* version in `node_modules`, not `npm view ... version`'s bare output, when the package has diverged major lines across an Astro major boundary.

## Package Legitimacy Audit

No new packages are installed this phase — `preact` and `@astrojs/preact` were installed in Phase 1 and are only *exercised* (not newly added) here. Ran the legitimacy gate anyway for completeness since this is the first phase that actually imports them into a build.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `preact` | npm | Established project; most recent patch published 2026-08-01 | 28.2M/wk | github.com/preactjs/preact | SUS (seam reason: `too-new`) | Approved — false positive, see note below |
| `@astrojs/preact` | npm | Established project; most recent patch published 2026-07-28 | 82.1K/wk | github.com/withastro/astro | SUS (seam reason: `too-new`) | Approved — false positive, see note below |

**Note on the `SUS`/`too-new` verdicts:** `gsd-tools query package-legitimacy check` flags both packages because their *latest npm-registry publish timestamp* is within the last ~1-4 weeks — but that reflects a routine patch release on a long-established, extremely high-download package (preact: 28M/week, official `preactjs` org; `@astrojs/preact`: official `withastro` org, part of the Astro monorepo), not a newly-created or slopsquatted package. Both have been installed in this repo's `package.json` since Phase 1 and shipped in Phase 1-3 builds already. No `checkpoint:human-verify` is warranted — this is a mechanical false positive from checking "latest publish date" rather than "package age," and both packages pass `npm view <pkg> scripts.postinstall` with no output (no postinstall script) `[VERIFIED: npm view preact scripts.postinstall; npm view @astrojs/preact scripts.postinstall]`.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `preact`, `@astrojs/preact` — both dispositioned "Approved" above; no new checkpoint needed since both are pre-existing, already-shipped dependencies, not new installs.

## Architecture Patterns

### System Architecture Diagram

```
Fan's browser (darlng.com, static Astro build)
  |
  |-- scroll near bottom of homepage --> client:visible fires
  |         |
  |         v
  |   NewsletterForm.tsx hydrates (Preact runtime, already SSR'd as static HTML)
  |         |
  |   [idle] fan types email, clicks "Get the drop"
  |         |
  |         v
  |   client-side validation (regex/native email type) --fail--> [error: client validation] (no network call)
  |         | pass
  |         v
  |   honeypot check (hp_website filled?) --yes--> silently render [success] state, NO fetch sent
  |         | no
  |         v
  |   fetch POST https://mail.darlng.com/api/public/subscription
  |     { email, list_uuids: [PUBLIC_LISTMONK_LIST_UUID] }
  |     AbortController timeout ~8s
  |         |
  |         |----> browser sends CORS preflight OPTIONS first (cross-origin request)
  |         |         |
  |         |         v
  |         |     Listmonk's CORS middleware (app-layer, keyed off Settings->Security->
  |         |     Trusted URLs) OR Traefik/nginx CORS headers -- exactly ONE of these,
  |         |     never both (see Pitfall #4) -- responds 204 with Access-Control-* headers
  |         |
  |         v
  |   Listmonk PublicSubscription handler (cmd/public.go)
  |     - EnablePublicSubPage must be true, else 400
  |     - list must not be "Private" type, else 400
  |     - InsertSubscriber; on 409-conflict-existing-email, falls back to
  |       UpdateSubscriberWithLists instead -- SAME response either way
  |     - if list is double opt-in: subscriber status = unconfirmed,
  |       Listmonk enqueues a confirmation email via configured SMTP (Resend)
  |         |
  |         v
  |   HTTP 200 { "data": { "has_optin": true } }   <-- identical for new AND existing subscriber
  |     OR
  |   non-2xx (400/500) / AbortError (timeout) / TypeError (network failure, CORS block)
  |         |
  |         v
  |   island sets status: 'success' (always, on any 2xx) | 'error' (anything else)
  |         |
  |         v
  |   aria-live="polite" #newsletter-status region updates text; button label/disabled
  |   state updates; no page reload, no layout shift (reserved 48px floor per UI-SPEC)
```

### Recommended Project Structure
```
website/src/
├── components/
│   └── NewsletterForm.tsx     # the Preact island (per UI-SPEC: input, honeypot, button, status region only)
├── pages/
│   └── index.astro            # gains <section id="newsletter"> at the existing reserved-slot comment (line 96)
└── tsconfig.json               # (repo root of website/) needs jsx + jsxImportSource added — see Pitfall #1
```

### Pattern 1: Env-gated conditional island render with TS narrowing
**What:** Read both `PUBLIC_LISTMONK_URL` and `PUBLIC_LISTMONK_LIST_UUID` from `import.meta.env` in `index.astro`'s frontmatter; render the whole `<section>` (including the island invocation) only when both are truthy, re-checking both variables directly in the JSX conditional (not just a derived boolean) so TypeScript narrows them from `string | undefined` to `string` for the island's required `string` props.
**When to use:** Any time a build-time-only env var gates both markup presence and a typed prop.
**Example:**
```astro
---
// Source: pattern derived from 04-UI-SPEC.md's "Env-Unset Behavior" contract,
// TS narrowing behavior confirmed against astro/tsconfigs/strict (website/tsconfig.json:2)
const listmonkUrl = import.meta.env.PUBLIC_LISTMONK_URL;
const listmonkListUuid = import.meta.env.PUBLIC_LISTMONK_LIST_UUID;
const newsletterEnabled = Boolean(listmonkUrl && listmonkListUuid);
---

{newsletterEnabled && listmonkUrl && listmonkListUuid && (
  <section id="newsletter" aria-labelledby="newsletter-heading" class="py-12 md:py-16">
    <h2 id="newsletter-heading">New Music, No Schedule.</h2>
    <p>Get told the moment it drops — straight to your inbox, nothing else.</p>
    <NewsletterForm client:visible listmonkUrl={listmonkUrl} listUuid={listmonkListUuid} />
    <p>No spam. Unsubscribe anytime.</p>
  </section>
)}
```
Repeating `listmonkUrl && listmonkListUuid` inside the JSX conditional (not just relying on the single `newsletterEnabled` boolean) is required — a single boolean flag does not narrow the two separately-declared `string | undefined` variables under TypeScript's control-flow analysis, and `astro check` (strict mode, `astro/tsconfigs/strict`) will otherwise reject passing them into props typed as required `string`.

### Pattern 2: Preact island fetch + state machine
**What:** `useState` for `status: 'idle' | 'submitting' | 'success' | 'already-subscribed' | 'error-validation' | 'error-network'`; a single `handleSubmit` that does client validation -> honeypot check -> fetch -> branch.
**When to use:** This island, matching the UI-SPEC's exact state table.
**Example:**
```tsx
// Source: pattern combines Listmonk's verified request/response shape
// (github.com/knadh/listmonk/blob/master/cmd/public.go:536-549, 723-808)
// with Astro/Preact's documented client:visible hydration model.
import { useState } from 'preact/hooks';

type Status = 'idle' | 'submitting' | 'success' | 'already-subscribed' | 'error-validation' | 'error-network';

interface Props {
  listmonkUrl: string;
  listUuid: string;
}

export default function NewsletterForm({ listmonkUrl, listUuid }: Props) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error-validation');
      return;
    }

    if (honeypot) {
      // Bot detected: silently render the exact same success UI, no network call.
      setStatus('success');
      return;
    }

    setStatus('submitting');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${listmonkUrl}/api/public/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, list_uuids: [listUuid] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        setStatus('error-network');
        return;
      }

      const json = await res.json().catch(() => null);
      // Real Listmonk never sends this field (verified from source) -- this
      // branch only fires against the local mock server's synthetic signal.
      // See Code Examples: Mock Server, and Common Pitfalls #2.
      if (json?.data?.already_subscribed === true) {
        setStatus('already-subscribed');
      } else {
        setStatus('success');
      }
    } catch {
      // Covers AbortError (timeout) and TypeError (network/DNS/CORS failure) --
      // both collapse to the single UI-SPEC "network/API error" state.
      clearTimeout(timeoutId);
      setStatus('error-network');
    }
  }

  // ... render per UI-SPEC's exact state table (idle/submitting/success/
  // already-subscribed/error-validation/error-network -> button label,
  // disabled, aria-live text)
}
```

### Anti-Patterns to Avoid
- **Branching UI state on `has_optin`:** `has_optin` tells you whether the LIST is double-opt-in, not whether the subscriber was new or pre-existing — don't use it to decide already-subscribed vs. success (verified: it's `true` for both a brand-new signup AND a repeat signup to the same double-opt-in list, since `UpdateSubscriberWithLists` is called with the same optin-recompute logic as `InsertSubscriber`).
- **Trusting a non-2xx body as JSON automatically:** Echo's default error handler renders `{"message": "..."}` on error, not the `{"data": ...}` envelope — don't assume the error path has the same shape as success; treat any non-2xx purely by status, not by attempting to parse a specific error schema.
- **Building a custom ALTCHA proof-of-work check in the island:** Verified from source that `PublicSubscription` never calls `a.captcha.Verify()` — any client-side ALTCHA widget work would be validated against nothing. Don't build it for this endpoint.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Double opt-in confirmation email flow | Custom "send confirmation link" logic | Listmonk's built-in double opt-in list setting (already configured per DEPLOY.md Section 2) | Listmonk owns token generation, the confirmation page, and status transitions server-side; the island only ever needs to render "check your inbox" |
| Distinguishing new vs. already-subscribed | A custom "check if email already exists" pre-flight API call before submitting | Nothing — verified the public API is intentionally opaque here; UI-SPEC already designed around this (success-equivalent fallback) | An extra pre-flight GET would need its own endpoint (doesn't exist publicly) and would leak subscriber-existence as a timing/enumeration side channel — worse, not better |
| Bot mitigation on the JSON API | A hand-rolled proof-of-work/challenge scheme | Honeypot (this phase, client-side) + reverse-proxy rate limiting (`limit_req_zone`, deploy-time, documented in DEPLOY.md) | Matches the actual attack surface: Listmonk's own ALTCHA doesn't cover this endpoint, so the realistic, low-effort mitigations are the ones already in PITFALLS.md #5 |

**Key insight:** The single biggest hand-rolling risk in this phase is inventing client-side logic to compensate for Listmonk's public API not exposing a signal (already-subscribed distinguishability, captcha enforcement) that genuinely doesn't exist server-side. The correct response, in both cases, is to build exactly what the UI-SPEC already pre-specified (a state that may simply never fire) rather than engineering a workaround.

## Common Pitfalls

### Pitfall 1: Missing `jsx`/`jsxImportSource` in tsconfig.json breaks `astro check`, not `astro build`
**What goes wrong:** `npm run check` (which runs `astro check && npm run check:contrast`) fails with a TypeScript JSX error the moment `NewsletterForm.tsx` is added, while `npm run build` may still succeed — because Vite's esbuild-based JSX transform (used by `@astrojs/preact`'s Vite plugin at actual build time) is independent of `tsconfig.json`'s `compilerOptions`, but `astro check`'s underlying `tsc`-based type checking is not.
**Why it happens:** `website/tsconfig.json` currently contains only `{"extends": "astro/tsconfigs/strict"}` `[VERIFIED: website/tsconfig.json:1-3]` — no `jsx`/`jsxImportSource` compiler options. This is the first `.tsx` file in the project (Phases 1-3 are all `.astro`), so the gap has never surfaced before.
**How to avoid:** Add to `website/tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```
(exact settings per the official `@astrojs/preact` integration docs — CITED below).
**Warning signs:** `npm run check` errors referencing `Cannot use JSX unless the '--jsx' flag is provided` or `This JSX tag requires the module path 'preact/jsx-runtime' to exist` the first time it's run after adding `NewsletterForm.tsx`.

### Pitfall 2: Listmonk's public API cannot distinguish new vs. already-subscribed — the UI-SPEC's fallback IS the real answer
**What goes wrong:** A plan that tries to detect "already subscribed" by inspecting the real Listmonk response will never see it fire — it's always `HTTP 200 {"data":{"has_optin": <bool>}}`, identical whether the email is brand new or already on the list.
**Why it happens:** `processSubForm` (`cmd/public.go:723-808`) calls `InsertSubscriber`; on a 409-conflict internal error (email already exists), it falls through to `UpdateSubscriberWithLists` and returns the SAME `hasOptin` bool with the SAME 200 status — there is no code path that surfaces "this was a duplicate" to the HTTP caller `[VERIFIED: cmd/public.go:774-801, read via github.com/knadh/listmonk raw source, master branch]`.
**How to avoid:** Implement the UI-SPEC's already-documented fallback exactly as written: treat all 2xx responses as success. To still satisfy CONTEXT.md's "already-subscribed exercised in the browser" requirement, give the LOCAL MOCK server (not real Listmonk) a synthetic `already_subscribed: true` field in its JSON body when the same email POSTs twice, and have the island check for that field — see Code Examples. Document plainly in DEPLOY.md and in a code comment that this branch is unreachable against real Listmonk.
**Warning signs:** A plan or PR that reads `res.status === 409` or a similar "existing subscriber" status code check against the real endpoint — Listmonk's public handler never returns 409 to the client for this case (409 only appears internally, inside `core.InsertSubscriber`, and is swallowed before the HTTP response is written).

### Pitfall 3: ROADMAP Phase 4 Success Criterion #3 cannot be satisfied by Listmonk's own ALTCHA against this endpoint
**What goes wrong:** ROADMAP.md states: *"A rapid-fire bot POST to the Listmonk subscription endpoint returns a non-200 response (ALTCHA validation active)."* Enabling ALTCHA in Listmonk Settings does NOT make this true for `/api/public/subscription`.
**Why it happens:** `PublicSubscription` (`cmd/public.go:536-549`) has no captcha check at all. Only `SubscriptionForm` (`cmd/public.go:463-532`, mounted at `POST /subscription/form`, the HTML-form path) calls `a.captcha.IsEnabled()` / `a.captcha.Verify()` `[VERIFIED: cmd/public.go:474-503 vs. 536-549, read via github.com/knadh/listmonk raw source, master branch]`. Community discussion confirms this is a known, acknowledged gap, not a bug: GitHub issue knadh/listmonk#2038 ("Captcha for public API") was closed as "not planned."
**How to avoid:** DEPLOY.md must document the TRUE mitigation for this endpoint: (1) the honeypot field shipped this phase (client-side, best-effort), and (2) reverse-proxy rate limiting (`limit_req_zone` in nginx, or Traefik's rate-limit middleware) in front of Listmonk, scoped to the `/api/public/subscription` path — this is the only server-side lever that actually applies. Flag to the user that ROADMAP's Success Criterion #3 as literally worded ("ALTCHA validation active") should be reworded to describe rate-limiting, or the verification step should target `/subscription/form` instead (which DOES enforce ALTCHA, but is not the endpoint this phase's island uses).
**Warning signs:** A verification/UAT step that enables ALTCHA in Listmonk admin, then curls `/api/public/subscription` expecting a 4xx and gets a 200 instead.

### Pitfall 4: STATE.md's "CORS at proxy layer only" undersells a simpler, built-in Listmonk option
**What goes wrong:** DEPLOY.md (as currently written, extending STATE.md's decision) only instructs configuring CORS at the Traefik/nginx layer in front of Listmonk. This works, but Listmonk has its OWN native CORS middleware that's simpler to enable and avoids PITFALLS.md #4's documented "duplicate header" failure mode entirely (since only one origin, Listmonk itself, would ever emit the header).
**Why it happens:** `initHTTPHandlers` in `cmd/handlers.go:43-49` registers `middleware.CORSWithConfig` globally whenever `security.trusted_urls` (an admin-configurable list, also reused for the `?next=` redirect trust-check on the hosted form) is non-empty `[VERIFIED: cmd/handlers.go:43-49, cmd/init.go:128, cmd/public.go:517-518, read via github.com/knadh/listmonk raw source, master branch]`.
**How to avoid:** In DEPLOY.md, recommend adding `https://darlng.com` to Listmonk's Settings -> Security -> Trusted URLs list (exact UI label not independently confirmed this session — verify against the live admin UI at deploy time) as the primary CORS mechanism; only fall back to proxy-level `add_header` directives if that setting proves insufficient (e.g., it doesn't cover preflight `OPTIONS` on every route the way a proxy rule would). Whichever is chosen, PITFALLS.md #4's core warning stands: never configure CORS in both places simultaneously.
**Warning signs:** Duplicate `Access-Control-Allow-Origin` headers in the browser Network tab (browsers reject the response outright when this happens) if both Listmonk's Trusted URLs AND a proxy-level CORS header are configured at once.

### Pitfall 5: `EnablePublicSubPage` and list "type" both gate the endpoint — two separate admin settings, not one
**What goes wrong:** Even with the list created, double opt-in enabled, and env vars set, `POST /api/public/subscription` returns 400 if either (a) the global "public subscription page" toggle is off, or (b) the target list's type is "Private."
**Why it happens:** `PublicSubscription` checks `if !a.cfg.EnablePublicSubPage { return 400 }` before anything else `[VERIFIED: cmd/public.go:537-539]`, and separately, `processSubForm` rejects any list where `t == models.ListTypePrivate` `[VERIFIED: cmd/public.go:762-772]`.
**How to avoid:** Add both checks to DEPLOY.md's Section 2 checklist: confirm the "public subscription page" setting is enabled (admin Settings — exact tab not independently confirmed this session, verify at deploy time), and confirm the fan list's type is "Public" (not "Private") when created.
**Warning signs:** `curl -X POST .../api/public/subscription` returns 400 with a message resembling "invalid feature" or an invalid-UUID-style error, even though the list UUID is correct.

## Code Examples

### Mock Server (local testing, zero dependencies)
```js
// Source: pattern designed against Listmonk's verified request/response
// shape (cmd/public.go:536-549) plus CORS preflight requirements
// (PITFALLS.md #4 -- OPTIONS must return 204 with explicit headers).
// website/scripts/mock-listmonk.mjs (dev-only, not shipped in dist/)
import { createServer } from 'node:http';

const PORT = process.env.MOCK_LISTMONK_PORT || 8890;
const seenEmails = new Set();

const server = createServer((req, res) => {
  const origin = req.headers.origin || 'http://localhost:4321';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600',
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/public/subscription') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      res.setHeader('Access-Control-Allow-Origin', origin);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'invalid body' }));
        return;
      }

      // Trigger the error-state UI path.
      if (parsed.email === 'error@test.local') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'simulated server error' }));
        return;
      }

      // Real Listmonk never emits "already_subscribed" (verified from
      // source -- see 04-RESEARCH.md Pitfall #2). This mock adds it
      // ONLY so the UI-SPEC's already-subscribed branch is visually
      // testable locally; it is a testing artifact, not a Listmonk fact.
      const alreadySeen = seenEmails.has(parsed.email);
      seenEmails.add(parsed.email);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          data: { has_optin: true, ...(alreadySeen ? { already_subscribed: true } : {}) },
        })
      );
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Mock Listmonk listening on http://localhost:${PORT}`);
  console.log('Trigger error state: email = error@test.local');
  console.log('Trigger already-subscribed state: submit the same email twice');
  console.log('Trigger network-failure/timeout state: stop this server mid-test, or submit while it is down');
});
```

**Exact test commands:**
```bash
# Terminal 1 -- start the mock
cd website && node scripts/mock-listmonk.mjs

# Terminal 2 -- run Astro dev with shell-exported PUBLIC_* vars
# (confirmed: astro dev inlines shell-set PUBLIC_* the same way astro build does --
# see docs.astro.build/en/guides/environment-variables/)
cd website && PUBLIC_LISTMONK_URL=http://localhost:8890 PUBLIC_LISTMONK_LIST_UUID=test-list-uuid npm run dev

# Browser: http://localhost:4321 -> scroll to #newsletter
#   - real-looking email          -> success state
#   - same email submitted twice  -> already-subscribed state (2nd submit)
#   - error@test.local            -> network/API error state
#   - kill Terminal 1, then submit -> network/API error state (TypeError/fetch failure path)

# Verify the env-unset build still stays green (no PUBLIC_* vars set):
cd website && npm run build   # section must not render; build must exit 0
cd website && npm run check   # astro check + contrast gate must both stay green
```

### Listmonk request/response shape (verified from source)
```
POST /api/public/subscription
Content-Type: application/json

{
  "email": "fan@example.com",
  "list_uuids": ["<PUBLIC_LISTMONK_LIST_UUID>"]
}

-> 200 OK
{
  "data": { "has_optin": true }
}
```
Source: `cmd/public.go:536-549` (handler), `cmd/public.go:723-732` (request struct: `form:"email" json:"email"`, `form:"l" json:"list_uuids"`), `cmd/handlers.go:24-26` (`okResp{ Data any \`json:"data"\` }` envelope). `name` is optional and defaults to the local-part of the email if omitted — not needed for this phase's minimal form.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| STACK.md's June 2026 research assumed `{"data": true}` as the success response | Verified from current source: `{"data": {"has_optin": <bool>}}` | Unclear exact version this changed (STACK.md's research predates this session's direct source read); confirmed correct against `master`/v6.2.0 as of 2026-08-08 | Any island code that checked `res.data === true` literally would be checking the wrong shape — check `res.ok` (HTTP status) for success, not the body's exact value |
| PITFALLS.md's June 2026 research: "Listmonk does not expose a config.toml CORS block ... configure CORS at the reverse proxy level" | Verified from source: Listmonk DOES have native app-layer CORS middleware, driven by the `security.trusted_urls` admin setting (not a `config.toml` block, but a DB-backed Settings-UI field) | Confirmed present on `master`/v6.2.0; unclear if present in June 2026's researched version | Simplifies DEPLOY.md's CORS section — a single admin-UI field addition may suffice instead of hand-writing proxy CORS rules; see Pitfall #4 |

**Deprecated/outdated:** hCaptcha support in Listmonk is present in the source but flagged deprecated in favor of ALTCHA per WebSearch results (community/release-notes sourced, not independently source-verified this session) — irrelevant to this phase either way since neither protects the JSON API endpoint.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact admin-UI label/tab for `security.trusted_urls` (guessed as "Settings -> Security -> Trusted URLs") and for `enable_public_subscription_page` (guessed as somewhere in Settings -> General or Privacy) — confirmed the underlying config keys from source, not the UI copy/location | Common Pitfalls #4, #5 | Low — DEPLOY.md instructions may point at the wrong tab initially; the user will find the correct field within the same Settings area regardless, since the config keys themselves are verified correct |
| A2 | ALTCHA's deprecation of hCaptcha, and the exact admin complexity setting range (`1000-1000000`) | State of the Art, background context only | Low — not load-bearing for this phase's code; purely FYI for DEPLOY.md wording, not used in any planning decision |
| A3 | Astro/Preact official-docs quotes (tsconfig `jsx`/`jsxImportSource` settings, `PUBLIC_*` shell-var inlining) came from WebFetch summarization of docs.astro.build rather than a direct Context7 MCP query (unavailable this session — see note below) | Common Pitfalls #1, Code Examples test commands | Medium — these are official-docs-sourced (CITED tier), but summarized by an intermediate model rather than read verbatim; recommend the plan author spot-check `website/tsconfig.json`'s exact required keys against https://docs.astro.build/en/guides/integrations-guide/preact/ before executing, in case the summarization dropped a nuance |

## Open Questions

1. **Does ROADMAP.md's Phase 4 Success Criterion #3 need to be reworded?**
   - What we know: "rapid-fire bot POST to the Listmonk subscription endpoint returns a non-200 response (ALTCHA validation active)" cannot be true for `/api/public/subscription` as Listmonk is currently built (verified from source — no captcha hook on that handler).
   - What's unclear: Whether the user wants to (a) reword the criterion to describe proxy-level rate-limiting instead, (b) accept that this criterion is effectively unverifiable and drop it, or (c) additionally build a second submission path through `/subscription/form` (which DOES support ALTCHA) as a fallback UI when the primary JSON POST fails — a much larger scope change not implied anywhere in CONTEXT.md.
   - Recommendation: Planner should flag this explicitly to the user rather than silently building against a criterion that cannot pass; propose rewording Success Criterion #3 to reference rate-limiting (`limit_req_zone` / Traefik rate-limit middleware) as the actual mechanism, to be verified at the user's deploy step per DEPLOY.md.

2. **Exact admin-UI location/label for `security.trusted_urls` and `enable_public_subscription_page`.**
   - What we know: both are real, verified config keys that gate CORS and the subscription endpoints respectively.
   - What's unclear: their exact Settings-tab placement and field label in the current Listmonk admin UI (not independently screenshot-verified this session, since no live Listmonk instance exists yet per CONTEXT.md).
   - Recommendation: DEPLOY.md's Section 2 checklist item should say "find the field backing `trusted_urls` (likely Settings -> Security)" so the user isn't blocked if the label has moved since this research; verify at first live deploy.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (for the mock server script) | Local testing (Code Examples) | Yes | v24.9.0 `[VERIFIED: node -v]` | — |
| `preact` (npm package) | Island runtime | Yes, already installed | `10.29.8` `[VERIFIED: website/node_modules/preact/package.json]` | — |
| `@astrojs/preact` (npm package) | Island integration | Yes, already installed | `4.1.3` `[VERIFIED: website/node_modules/@astrojs/preact/package.json]` | — |
| Live Listmonk instance | Real end-to-end email delivery, real CORS/ALTCHA verification | No — explicitly deferred to DEPLOY.md per CONTEXT.md | — | Mocked local HTTP server (Code Examples); live verification checklist added to DEPLOY.md |
| Context7 MCP tool | Authoritative Astro/Listmonk docs lookup | No — not present in this session's tool list | — | WebSearch + WebFetch against docs.astro.build and raw GitHub source (used throughout this research; Listmonk findings additionally cross-verified by reading actual Go source, which is stronger than docs would have been) |

**Missing dependencies with no fallback:** none blocking — the live Listmonk instance is intentionally out of scope for this phase per CONTEXT.md.

**Missing dependencies with fallback:** Context7 MCP (fell back to WebSearch/WebFetch, plus direct source reads for the highest-stakes Listmonk claims, which exceeds normal docs-citation confidence).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Public, unauthenticated endpoint by Listmonk design — not a code defect, matches PITFALLS.md #5's documented posture |
| V3 Session Management | No | No session/cookie involved in this flow |
| V4 Access Control | Marginal | List "type" (Public vs Private) and `enable_public_subscription_page` are Listmonk-side access gates, not application code (see Pitfall #5) |
| V5 Input Validation | Yes | Client-side: `type="email"` + regex pre-check before POST (defense-in-depth, not the authority — Listmonk's `SanitizeEmail` is authoritative server-side, verified at `cmd/public.go:746-750`) |
| V6 Cryptography | No | No credentials or secrets handled client-side; `PUBLIC_LISTMONK_LIST_UUID` is explicitly documented as non-secret (STACK.md: "it's a public endpoint; the UUID is not a credential") |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Automated bot mass-subscription spam via the public JSON endpoint | Denial of Service / resource exhaustion (mail relay reputation) | Honeypot (this phase, client-side, best-effort only) + reverse-proxy rate limiting on `/api/public/subscription` (deploy-time, since Listmonk's own ALTCHA does not cover this route — verified from source, see Pitfall #3) |
| CORS misconfiguration exposing the endpoint to unintended origins, or duplicate CORS headers breaking legitimate cross-origin requests | Tampering / availability | Exactly one CORS authority (Listmonk's `security.trusted_urls` OR the proxy, never both) — see Pitfall #4 |
| Subscriber enumeration via response-timing or shape differences | Information Disclosure | Not applicable here — verified the endpoint is already maximally opaque (identical response for new/existing subscribers), which is actually the SAFEST possible behavior against enumeration, a fortunate side effect of the UX limitation documented in Pitfall #2 |

## Sources

### Primary (HIGH confidence — read directly, this session)
- `github.com/knadh/listmonk` raw source, `master` branch, files `cmd/public.go` and `cmd/handlers.go` (fetched via `curl` + read line-by-line with the `Read` tool) — endpoint routes, `PublicSubscription`/`SubscriptionForm` handler bodies, `processSubForm` already-subscribed fallthrough, `okResp` envelope shape, `EnablePublicSubPage` and list-type gates, native CORS middleware wiring
- `github.com/knadh/listmonk` `cmd/init.go` — `Security.TrustedURLs []string \`koanf:"trusted_urls"\`` config schema
- `github.com/knadh/listmonk` releases API — confirmed latest tag `v6.2.0`, published 2026-06-26, consistent with the `master` source read
- `website/tsconfig.json`, `website/package.json`, `website/astro.config.mjs`, `website/src/pages/index.astro`, `website/src/styles/global.css`, `website/src/layouts/Layout.astro`, `website/DEPLOY.md`, `website/scripts/check-contrast.mjs` — all read directly this session
- `npm view preact version`, `npm view @astrojs/preact version`, `npm view preact scripts.postinstall`, `npm view @astrojs/preact scripts.postinstall` — registry checks run this session

### Secondary (MEDIUM confidence)
- `docs.astro.build/en/guides/integrations-guide/preact/` (via WebFetch) — `jsx`/`jsxImportSource` tsconfig requirement
- `docs.astro.build/en/guides/environment-variables/` (via WebFetch) — `PUBLIC_*` static replacement, shell-exported var inlining for both `astro dev` and `astro build`
- `github.com/knadh/listmonk/issues/2038` (via WebFetch) — community confirmation that the public API's lack of captcha coverage is an acknowledged, closed-as-not-planned limitation (corroborates the direct source read, doesn't contradict it)
- `listmonk.app/docs/apis/subscribers/` (via WebFetch) — documented request fields, confirms `email`/`list_uuids`/`name` and JSON-or-form-encoded body acceptance

### Tertiary (LOW confidence)
- WebSearch results on ALTCHA settings key names (`security.captcha.altcha.enabled`, complexity range) and hCaptcha deprecation status — not independently source-verified this session, flagged in Assumptions Log A2, not load-bearing for any planning decision
- WebSearch result mentioning `security.cors_origins` as a possible alternate config key name — contradicted by the direct source read of `cmd/init.go:128` (`trusted_urls`); the source read is authoritative, this WebSearch claim is noted but not used

## Metadata

**Confidence breakdown:**
- Listmonk endpoint/response/CORS/CAPTCHA behavior: HIGH — read directly from the actual handler source on `master`, cross-checked against the latest tagged release
- Astro/Preact island + tsconfig + env var behavior: MEDIUM-HIGH — official docs via WebFetch (Context7 MCP unavailable this session, see Environment Availability), cross-checked against this repo's actual, currently-read `tsconfig.json`/`astro.config.mjs`
- Local mock server design: HIGH for the pattern (standard `node:http` + CORS preflight handling, matches PITFALLS.md's documented CORS failure mode) — the "already_subscribed" synthetic field is a documented, deliberate testing artifact, not a claim about real Listmonk

**Research date:** 2026-08-08
**Valid until:** 30 days for the Astro/Preact findings (stable, slow-moving); Listmonk findings should be re-verified against source if the live deploy (DEPLOY.md) happens against a Listmonk version meaningfully newer than v6.2.0
