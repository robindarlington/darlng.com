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
