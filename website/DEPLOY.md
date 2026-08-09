# DEPLOY.md — DARLNG Live Infrastructure Runbook

This file is executed by you (the operator), by hand, after the local build in this
repository has been reviewed and approved. Nothing in this document is automated —
every checkbox below names an exact screen, field, and value to enter.

> **WARNING — read this before starting.** The legacy 2019 placeholder files
> (`index.html`, `randevu.mp3`, `Gruntfile.js`, and friends) have already been moved
> out of the repo root into `legacy/` (see the "Legacy Cutover" section below). This
> means the currently-live 2019 site — which builds from the repo root on every push
> to `master` — will **stop building successfully on the next auto-deploy from
> `master`**, because `index.html` is no longer there. Once you push this commit,
> the cutover to the new Coolify application (Section 1) must be completed in the
> same sitting. Do not leave the site half-cut-over: pushing this commit and then
> walking away leaves darlng.com serving nothing until Section 1 is done.

## Legacy Cutover

The old 2019 placeholder was live at darlng.com and built directly from the repo
root. This repository's `master` branch now has that placeholder archived under
`legacy/`, and `website/` is unambiguously the new site. Any existing Coolify
application that auto-deploys from `master` against the repo root will break on the
next push — see the WARNING above. Complete Section 1 in the same session you push
this change.

## 1. Coolify — Static Site Application

This is the step that actually cuts darlng.com over to the new build. Complete this
in full before moving on — a half-finished cutover is the WARNING above made real.

- [ ] **Domain binding collision check — do this FIRST.** Log into Coolify and check
      whether an existing application already has `darlng.com` (or `www.darlng.com`)
      bound as a domain. Two Coolify applications cannot both claim the same domain.
      You have exactly two choices here — pick one, not both:
      - **Option A (recommended):** Repoint the EXISTING application that currently
        serves the legacy site — change its Base Directory and Build Pack (below)
        so it now builds the new site from the same repo/branch.
      - **Option B:** Create a brand-new Coolify application, then remove the domain
        binding from the old application and add it to the new one. Do this in one
        sitting — the domain must never be simultaneously bound to two apps, and it
        must never be unbound from both at once (that's the DoS window discussed
        below).
- [ ] Point the application at this repo's existing GitHub remote, branch `master`.
- [ ] Set **Base Directory** to `website/` (not the repo root — this keeps the
      archived `legacy/` tree and everything outside `website/` out of the build
      context entirely).
- [ ] Set **Build Pack** to **Dockerfile** (not Nixpacks, not the "static site"
      checkbox — the custom `website/Dockerfile` + `website/nginx.conf` in this repo
      handle real 404s and path-specific cache headers that Nixpacks' generated
      config cannot).
- [ ] Under **Domains**, add both `https://darlng.com` and `https://www.darlng.com`.
- [ ] Under **Advanced**, find the domain **Direction** setting and set it to
      "Redirect www to non-www" (i.e. `www.darlng.com` → `darlng.com`, apex is
      canonical). This is Coolify's built-in redirect mechanism — use it instead of
      hand-writing Traefik labels.
      - **Fallback, only if your installed Coolify version has no Direction
        setting in the UI:** add a manual Traefik `redirectregex` label pair to the
        application (one rule matching `^https://www\.darlng\.com/(.*)` redirecting
        to `https://darlng.com/$1`). Only fall back to this if the built-in setting
        genuinely isn't present — it is documented as the standard supported path
        and avoids known label-authoring bugs.
- [ ] Under **Advanced**, enable **Force HTTPS**.
- [ ] Deploy. Confirm the build succeeds and that Let's Encrypt issues a certificate
      via its HTTP-01 challenge — this will succeed without extra DNS work because
      the A record for darlng.com at LWS already resolves to this Coolify box.
- [ ] Note for your own understanding: TLS terminates at Coolify's Traefik reverse
      proxy in front of the container. The container itself serves plain HTTP on
      port 80 internally — no certificate handling happens inside the Docker image.

## 2. Listmonk + Postgres

- [ ] In Coolify, go to **Services → New Resource** and search for **Listmonk**.
      Use Coolify's own one-click template picker here — do NOT import a
      hand-modified `docker-compose.yml`. A known Coolify bug breaks the Listmonk
      template when its compose source is a private fork rather than Coolify's
      bundled template catalog, and the one-click path provisions Postgres and
      wires the connection variables for you automatically.
- [ ] Set the service subdomain to **`mail.darlng.com`**.
- [ ] Deploy the service and wait for Postgres provisioning to finish.
- [ ] **Immediately after the Listmonk admin UI is reachable, and before touching
      any other setting: log in with the default admin credentials and change the
      password.** Do this first — Listmonk's admin panel is internet-reachable at
      `mail.darlng.com` the moment it's up, so leaving the default password in
      place even briefly is an open door.
- [ ] Go to Listmonk's **Settings → SMTP** and configure the outbound relay (values
      below come from Section 3 — do this after Resend is set up, or fill in the
      settings now and revisit once you have a live API key):
      - Host: `smtp.resend.com`
      - Port: `587`
      - Auth protocol: `login`
      - Username: `resend` (literally the word "resend")
      - Password: your Resend API key — paste it directly into this Listmonk
        settings field, never into a file in this repository
      - TLS type: `STARTTLS`
      - **Cross-check these values against Resend's own SMTP integration docs
        before saving** — this document's copy of them is second-hand research and
        may drift from Resend's current setup guide.
- [ ] Go to **Lists → New List**. Create the fan list and enable **double opt-in**.
- [ ] Once the list exists, copy its **list UUID** (shown in the list's detail
      view). You'll need it in the next step.
- [ ] In Coolify, open the **static site application's** environment variables
      (the one from Section 1, not this Listmonk service) and add:
      - `PUBLIC_LISTMONK_URL` = `https://mail.darlng.com`
      - `PUBLIC_LISTMONK_LIST_UUID` = the list UUID you just copied
      Both are pasted directly into Coolify's environment-variable UI — never into
      a file in this repository. These are **build-time** values (Astro bakes
      `PUBLIC_*` env vars in at build time, not runtime), so after setting them you
      must trigger a redeploy of the static site application for them to take
      effect. Phase 4 of this project is what actually wires the newsletter form to
      consume these values; this step just records them where Phase 4 will find
      them.

## 3. Resend — Domain & DNS

There is no mail server to install here. Listmonk acts purely as an SMTP *client*
submitting authenticated mail to Resend on port 587 — it is never an MTA accepting
inbound mail on port 25, so Hetzner's port-25 block is irrelevant to this setup.

- [ ] Confirm the SMTP values you entered in Section 2 against Resend's own SMTP
      documentation before relying on them — host `smtp.resend.com`, port `587`,
      STARTTLS, auth protocol `login`, username `resend`, password = your Resend API
      key. These are account-scoped and this document's copy is second-hand; a
      stale value here fails loudly at the SMTP test in Listmonk rather than
      silently at send time, but check it anyway.
- [ ] In the Resend dashboard, **Add Domain** for `darlng.com`, following Resend's
      own recommendation on whether to use a subdomain (e.g. `send.darlng.com`) for
      DKIM alignment.
- [ ] Open the domain's **Records** tab in Resend. Copy each DNS record shown there
      **verbatim** into LWS's DNS management for darlng.com. Do not type a
      DKIM public key, DKIM selector, or SPF value from memory or from a generic
      guide — these are unique to your Resend account and domain, and a
      plausible-looking fake value produces DNS records that silently never
      verify.
- [ ] Wait for Resend's dashboard to show all records as verified (can take a few
      minutes, occasionally up to 24 hours for DNS propagation).
- [ ] Before trusting deliverability, run an external check — for example
      [mxtoolbox.com](https://mxtoolbox.com) — and confirm SPF, DKIM, and DMARC all
      pass for darlng.com.

**Ordering note:** Resend's domain must show as verified before Listmonk's SMTP
settings are worth test-sending through — an unverified domain will often still
accept the SMTP connection but land mail in spam or get rejected. And the fan list
in Section 2 must exist before you can copy its UUID — if you're working through
this document top-to-bottom, Section 2's list-UUID step and this section's
domain-verification step both need to be done before you can trust a real end-to-end
test send.

## 4. Post-Cutover Verification

Run this checklist after Sections 1–3 are complete. Everything here is a
copy-pasteable `curl` command or a manual browser check — run the `curl` commands
from any machine with network access.

Roadmap success criterion 1 (`npm run build` produces a clean `dist/`) was already
proven locally in Plan 01 of this phase and is not re-checked here. Everything below
is genuinely new risk introduced by the live cutover — the container build and local
`docker run` + `curl` checks in Plan 01 proved the *image* behaves correctly, but
did not (and could not) prove the live domain, TLS, and redirect chain, which only
exist once Coolify, DNS, and Let's Encrypt are actually wired together.

- [ ] `curl -I https://darlng.com` returns `200` and the body is the new Astro
      build — confirm by viewing source and checking for `_astro/` hashed asset
      references, NOT the old jQuery/Bootstrap markup from the legacy site.
- [ ] `curl -I https://www.darlng.com` returns `301` redirecting to
      `https://darlng.com` — and following that redirect does not loop.
- [ ] `curl -I http://darlng.com` returns `301` redirecting to the `https://`
      version.
- [ ] `curl -I https://darlng.com/index.html` shows `Cache-Control: no-cache` in
      the response headers.
- [ ] `curl -I https://darlng.com/_astro/<any-hashed-filename-from-dist>` shows
      `Cache-Control: public, max-age=31536000, immutable`. Find an actual hashed
      filename by viewing page source or checking `website/dist/_astro/` after a
      local build.
- [ ] `curl -I https://darlng.com/this-path-does-not-exist` returns `404`, not
      `200` and not a redirect to the homepage.
- [ ] Visit `https://mail.darlng.com` in a browser — the Listmonk admin login page
      loads, and you can log in with the non-default password you set in Section 2.
- [ ] In Listmonk, confirm the fan list from Section 2 exists and has double opt-in
      enabled.
- [ ] Send a real test subscription (via Listmonk's own "send test email" feature,
      or by submitting a real email through Listmonk's public subscription
      endpoint) and confirm the confirmation email arrives in the inbox — not the
      spam folder.

### Newsletter — the three checks deferred to this deploy step

Run this subsection only after Section 5 is complete and the static site application
has been redeployed with both `PUBLIC_LISTMONK_URL` and `PUBLIC_LISTMONK_LIST_UUID`
set. Before that, the newsletter section is deliberately absent from the live page —
there is nothing here to test yet.

- [ ] **Real signup (Roadmap success criterion 1).** Load the live site and scroll to
      the newsletter section — confirm it's present at all. If it's missing, the env
      vars were not set at build time, or the redeploy after setting them didn't
      run. Submit a real email address you control through the live form. Expect the
      in-page success message inviting you to check your inbox, then a confirmation
      email arriving within two minutes, in the inbox, not the spam folder. Click
      the confirmation link and confirm the subscriber's status flips to `confirmed`
      in Listmonk's admin subscriber view. Note: Section 2's earlier "send test
      email" checkbox above proves SMTP works but does not prove this path — this
      check exercises the deployed form, CORS, and double opt-in together, live.
- [ ] **Deliverability (Roadmap success criterion 4).** Run
      [mxtoolbox.com](https://mxtoolbox.com) against the sending domain and confirm
      SPF, DKIM, and DMARC all pass — see Section 3 above for the DNS records this
      is checking; this step doesn't repeat that setup, only re-verifies it live.
- [ ] **Bot posture (Roadmap success criterion 3, amended 2026-08-08).** First,
      understand what this check does and does not prove: run a `curl` POST
      directly at the endpoint —
      ```bash
      curl -i -X POST https://mail.darlng.com/api/public/subscription \
        -H "Content-Type: application/json" \
        -d '{"email":"bot-test@example.com","list_uuids":["<your-list-uuid>"]}'
      ```
      This bypasses the browser form entirely, so the honeypot never sees it, and it
      **will return `200`** — that is expected and correct, not a failure. The
      honeypot is a client-side filter on the form, not a guard on the endpoint
      itself. What to actually verify:
      - [ ] Repeating that same `curl` rapidly starts returning a rate-limit status
            (`429` for nginx, `429`/`503` depending on middleware config for
            Traefik) once the Section 5 rate-limit rule is in place — that's the
            server-side mitigation actually working.
      - [ ] The address subscribed this way sits **unconfirmed** in Listmonk's
            subscriber view and therefore never receives a campaign send — that's
            double opt-in doing its half.
      - Roadmap success criterion 3 originally called for the endpoint to return a
        non-200 response with "ALTCHA validation active." That criterion was
        **amended on 2026-08-08** because Listmonk's captcha does not cover this
        route (see Section 5's bot-mitigation note above) — an operator reading an
        older note should not go hunting for a setting that cannot exist for this
        endpoint.
      - [ ] Cleanup: delete the test subscribers created by both the real-signup
        check above and this bot-POST check from Listmonk's admin, so the fan list
        starts clean.

### SEO, cards, and performance — the checks deferred to this deploy step

Phase 5 (05-03) measured Lighthouse and axe against the built `dist/` served by this
repo's own `nginx.conf` in a local `nginx:stable-alpine` container — the real
serving layer, but not the real domain, TLS, or CDN path. Everything below is
genuinely new risk that only exists once the live cutover (Section 1) is done.

- [ ] **Live PageSpeed Insights.** Run [PageSpeed
      Insights](https://pagespeed.web.dev/) against `https://darlng.com` and
      `https://darlng.com/listen/eseriani` and compare against the lab numbers
      measured locally (server: `docker` — the real `nginx:stable-alpine` container
      bind-mounting this repo's `dist/` and `nginx.conf`, not the `astro preview`
      fallback):

      | URL | Form factor | LCP (ms) | CLS | TBT (ms) | Perf score |
      |---|---|---|---|---|---|
      | `/` | mobile | 2866 | 0.000 | 0 | 0.95 |
      | `/` | desktop | 825 | 0.000 | 0 | 0.99 |
      | `/listen/eseriani/` | mobile | 1670 | 0.000 | 0 | 1.00 |
      | `/listen/eseriani/` | desktop | 376 | 0.000 | 0 | 1.00 |

      Three of the four runs pass every Core Web Vitals target (LCP < 2500ms, CLS <
      0.1, TBT < 200ms). `/` on mobile measured LCP 2866ms — 366ms over the 2500ms
      target — after three genuine in-scope fixes (nginx gzip for text responses,
      demoting the two font preloads below the hero image's priority, confirming
      avif-before-webp source order was already correct). See
      `05-03-SUMMARY.md` for the full root-cause writeup. Real-world PageSpeed
      numbers over the live CDN/TLS path are commonly better than Lighthouse's
      conservative default mobile throttling profile (simulated slow 4G: 1.6Mbps,
      150ms RTT, 4x CPU slowdown) — confirm whether the live measurement still misses
      before treating this as an open issue.
- [ ] **opengraph.xyz.** Check [opengraph.xyz](https://www.opengraph.xyz/) for
      `https://darlng.com` and `https://darlng.com/listen/eseriani` — confirm the
      1200x630 artwork, title, and description resolve with no image-not-found and
      no relative-URL failure. This is the specific failure mode the absolute
      `og:image`/`og:url`/`twitter:image` URLs built from `Astro.site` (05-01) exist
      to prevent.
- [ ] **Search Console sitemap submission.** In Google Search Console, submit
      `https://darlng.com/sitemap-index.xml` — the index, not a numbered shard — and
      confirm Search Console reports the five expected URLs discovered (`/` plus the
      four `/listen/*` pages).
- [ ] **robots.txt and /sitemap.xml over HTTPS.** Confirm
      `https://darlng.com/robots.txt` returns 200 with the byte-exact allow-all body
      (05-02), and `https://darlng.com/sitemap.xml` returns 200 with the sitemap
      index document — this exercises the `location = /sitemap.xml` nginx route added
      in 05-02 and re-verified against the running container in 05-03.
- [ ] **Favicon rendering.** In a real browser tab, confirm the favicon renders as a
      legible turquoise `D` on the dark background. On an iOS device, add the site to
      the home screen and confirm the apple-touch-icon appears correctly (not the
      default screenshot thumbnail).

## 5. Newsletter Wiring — Listmonk Public Subscription

The homepage's newsletter island POSTs JSON `{ email, list_uuids }` straight from the
fan's browser to `${PUBLIC_LISTMONK_URL}/api/public/subscription`, cross-origin, with
no server runtime sitting in between — this site is a static build, so there is no
proxy or API route of ours to hide the request behind. The whole `<section
id="newsletter">` (including the island's hydration script) is only emitted into the
built HTML at all when both `PUBLIC_LISTMONK_URL` and `PUBLIC_LISTMONK_LIST_UUID` were
present at build time — see Section 2 above for exactly where those two variables are
set. They are **build-time** values, not runtime ones: Astro bakes `PUBLIC_*` env vars
into the static output when `npm run build` runs, so changing either one in Coolify
does nothing to the live site until you trigger a redeploy of the static site
application.

- [ ] **Endpoint gates — two independent settings, either one alone causes a 400.**
      Neither failure looks like a misconfigured endpoint from the error alone, so
      check both before assuming the request body is wrong:
      - [ ] In Listmonk admin, confirm the public-subscription-page setting is
            enabled. This backs the `enable_public_subscription_page` config key —
            the exact admin tab is not screenshot-verified against a live instance
            (look under Settings first; verify the exact location once you're in the
            UI).
      - [ ] Confirm the fan list created in Section 2 has type **Public**, not
            Private.
      - Troubleshooting note: a `400` response to a request whose list UUID is
        definitely correct almost always means one of these two settings, not a
        malformed request body — check both before debugging the POST payload
        itself.

- [ ] **CORS — configure it in exactly ONE place, never two.** A browser rejects a
      response outright if it carries duplicate `Access-Control-Allow-Origin`
      headers, so picking both the primary and the fallback below at the same time
      breaks legitimate requests, not just illegitimate ones.
      - **Primary (recommended):** add the site's origin (`https://darlng.com`) to
        Listmonk's own Trusted URLs list — the admin field backing the
        `security.trusted_urls` config key (likely under Settings → Security; the
        exact label is not screenshot-verified against a live instance, confirm it
        once you're in the UI). Whenever that list is non-empty, Listmonk registers
        its own app-layer CORS middleware and handles the preflight and response
        headers itself. This is now the recommended approach over proxy-level rules:
        a single admin field replaces hand-written CORS directives and makes the
        duplicate-header mistake above structurally impossible, because there is
        only ever one place CORS could be configured.
      - **Fallback — use ONLY if Trusted URLs turns out not to cover preflight
        `OPTIONS` requests on the subscription route:** configure CORS headers at
        the Traefik/nginx layer in front of Listmonk instead. If you fall back to
        this, first **clear the Trusted URLs entry** so only one CORS authority
        remains active.
      - Note: an earlier note in this project's STATE.md said to configure CORS "at
        the proxy layer, not the app layer." That predates the source read that
        found Listmonk's own native CORS middleware — this section supersedes that
        earlier note.

- [ ] **Bot mitigation — the honest posture.** Read this before enabling anything in
      Listmonk's Settings → Security → Captcha/ALTCHA section: those settings guard
      only Listmonk's own hosted HTML subscription form handler
      (`/subscription/form`). The JSON API route this site's island posts to
      (`/api/public/subscription`) has no captcha check at all — this was confirmed
      by reading Listmonk's own handler source, and the upstream request to add
      captcha coverage to the public API was closed by the Listmonk maintainers as
      not planned. Turning ALTCHA on in Listmonk admin does nothing to protect this
      endpoint. What actually protects the fan list, in order:
      1. The honeypot field shipped in the site's form (`hp_website`) — silently
         withholds the request client-side if a bot fills it. Best-effort only; it
         catches naive scrapers and nothing more sophisticated.
      2. The fan list's double opt-in (enabled in Section 2) — an unconfirmed
         address never becomes a real subscriber and never receives a campaign send.
      3. Reverse-proxy rate limiting scoped to the subscription path — the only
         server-side lever that actually applies to this endpoint. Add one of the
         two recipes below, depending on whether Listmonk sits behind Coolify's
         bundled Traefik or a separate nginx instance.

      **nginx** (add to the `http` block, then reference the zone in the `location`
      block that proxies to Listmonk):
      ```nginx
      limit_req_zone $binary_remote_addr zone=newsletter:10m rate=5r/m;

      location /api/public/subscription {
          limit_req zone=newsletter burst=3 nodelay;
          proxy_pass http://listmonk;
      }
      ```

      **Traefik** (Coolify's bundled proxy — apply as a middleware label on the
      Listmonk service):
      ```yaml
      - "traefik.http.middlewares.newsletter-ratelimit.ratelimit.average=5"
      - "traefik.http.middlewares.newsletter-ratelimit.ratelimit.period=1m"
      - "traefik.http.middlewares.newsletter-ratelimit.ratelimit.burst=3"
      - "traefik.http.routers.<your-listmonk-router>.middlewares=newsletter-ratelimit"
      ```

- [ ] **What the site does and does not use** — the full API surface, decided on
      purpose, not by omission:
      - It uses the public subscription POST with `email` and `list_uuids` only.
      - It deliberately omits the optional `name` field — Listmonk defaults it to
        the email's local part, and the form collects only an email address.
      - It reads the response's `has_optin` flag but never branches UI state on it —
        that flag describes the list's opt-in mode, not whether the address was new.
      - It never distinguishes a repeat subscriber from a new one: the endpoint
        returns an identical `200` either way, so a fan re-submitting the same
        address sees the ordinary success message.
      - It touches no authenticated Listmonk API, so no Listmonk API key ever
        exists anywhere in the site's build or repository.

As with every account-specific value elsewhere in this document: never type a
`PUBLIC_LISTMONK_LIST_UUID`, API key, or DNS record value from memory into this file
or into a config field — always copy it verbatim from its own dashboard (Section 3's
DNS-records warning above states the same rule for Resend's records).

## Notes

- **`vite` override in `package.json`:** `package.json` pins `"@tailwindcss/vite": "4.1.16"`
  exactly (no `^`) and adds `"overrides": { "vite": "^6.4.1" }`. This exists because
  `@tailwindcss/vite` requires a specific `vite` major/minor to avoid Tailwind's CSS-first
  `@theme` pipeline silently breaking on a transitive `vite` version mismatch — Astro
  5.18.2's own dependency tree can otherwise resolve a different `vite` range, which drifts
  the peer chain and causes `astro check` (and sometimes the dev server) to fail in ways
  that are hard to diagnose from the error alone. Pinning `@tailwindcss/vite` exactly and
  forcing `vite` via `overrides` keeps that chain deterministic. Safe to revisit (and
  potentially loosen) after a deliberate Astro/Tailwind upgrade, not on a routine
  `npm update`.

### Addendum — LCP measurement topology (2026-08-09)

The locally measured home-page mobile LCP of ~2.8s was an artifact of testing over
plain HTTP/1.1 on localhost (six parallel connections share Lighthouse's simulated
bandwidth, so below-fold images throttle the hero). Re-measured over HTTPS+HTTP/2 —
matching how Traefik serves the live site — home mobile LCP is **1980ms** (score 0.99),
comfortably inside the <2500ms target. Optimizations landed during this loop: hero
quality 55 + denser widths, homepage LCP `<link rel="preload" as="image">` ahead of
font preloads, facade thumbnail true 16:9 crop (239KB → 129KB at 960w), catalog cards
quality 55. Confirm with PageSpeed Insights on the live domain after cutover — expect
the h2 number, not the h1 artifact.
