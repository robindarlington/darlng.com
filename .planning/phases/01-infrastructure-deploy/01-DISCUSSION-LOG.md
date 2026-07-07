# Phase 1: Infrastructure & Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 1-Infrastructure & Deploy
**Areas discussed:** Listmonk state, Deploy method, Legacy cutover, DNS/Cloudflare

---

## Listmonk state

| Option | Description | Selected |
|--------|-------------|----------|
| Already running | Listmonk deployed; just configure list | |
| Deploy fresh now | Stand up Listmonk + Postgres on Coolify from scratch | ✓ |
| Not sure / check it | Verify first, plan for fresh | |

**Subdomain choice:** `mail.darlng.com` (over `lists.darlng.com` / shared instance).

**User's choice:** Deploy fresh now — plus raised the SMTP/port-25 question: "help me think thru a SMTP solution as hetzner blocks port 25. Can I use ngrok or something of that nature and run it on a local box?"

**SMTP relay sub-decision:**

| Option | Description | Selected |
|--------|-------------|----------|
| Resend | Dev-friendly, clean DNS, free tier, SMTP+API | ✓ |
| Amazon SES | Cheapest at scale, needs sandbox exit | |
| Brevo / MailerSend | Free tier, simple dashboard | |
| You decide | Simplest reliable free option | |

**Notes:** Clarified the core misconception — port 25 is only for direct MTA delivery, which Listmonk does not do. Listmonk is an SMTP *client* and uses submission port 587 to a relay, which Hetzner does NOT block. Rejected ngrok/local-box/self-hosted MTA (no IP reputation/PTR → confirmations land in spam; not always-on). Chose Resend over 587 with SPF/DKIM/DMARC on darlng.com.

---

## Deploy method

| Option | Description | Selected |
|--------|-------------|----------|
| Dockerfile + nginx | Multi-stage build, custom nginx.conf in website/, full control of 404s + cache headers | ✓ |
| Nixpacks static | Coolify 'static site' checkbox; default nginx mishandles 404s | |
| You decide | Default to Dockerfile+nginx | |

**Build source sub-decision:**

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-deploy on push | Coolify webhook rebuilds on push to master | ✓ |
| Manual deploy | Trigger deploys manually | |
| You decide | Default to auto-deploy | |

**User's choice:** Dockerfile + nginx; auto-deploy on push to master.

---

## Legacy cutover

| Option | Description | Selected |
|--------|-------------|----------|
| Old site is live now | 2019 placeholder currently serves — real cutover | ✓ |
| Nothing live yet | First real deploy | |
| Not sure | Verify | |

**Legacy files sub-decision:**

| Option | Description | Selected |
|--------|-------------|----------|
| Leave them, stop serving | Base Directory=website/ means root not served | |
| Move to legacy/ folder | Tidy root, tuck old files into legacy/ | ✓ |
| Delete them | Remove entirely (history preserves) | |

**User's choice:** Old site live now → real cutover; move legacy files into `legacy/` folder.

---

## DNS / Cloudflare

| Option | Description | Selected |
|--------|-------------|----------|
| On Cloudflare already | Repoint records + SSL Full (Strict) | |
| Elsewhere, move to CF | Move nameservers to Cloudflare | |
| Elsewhere, stay there | Point A record at Coolify, use Coolify/Let's Encrypt TLS | ✓ (via LWS) |
| Not sure | Check registrar | |

**Cutover-risk sub-decision:**

| Option | Description | Selected |
|--------|-------------|----------|
| Verify then flip | Temp Coolify URL → confirm → repoint | |
| Flip directly | Repoint to Coolify, let it provision | ✓ |
| You decide | Default verify-then-flip | |

**User's choice:** DNS managed at **LWS** (registrar), **already pointing at Coolify** — no Cloudflare. Flip directly.

**Notes:** Corrected the research assumption — no Cloudflare in front, so its "Full (Strict)" SSL + redirect-rule guidance is moot. TLS/redirects come from Coolify's Traefik + Let's Encrypt. Flip-directly is low-risk because DNS already resolves to the box (HTTP-01 validation will succeed).

---

## Claude's Discretion

- Dockerfile base images + nginx.conf specifics (standard multi-stage patterns).
- Listmonk+Postgres deployment shape on Coolify (one-click/template vs compose stack).
- Resend domain setup specifics (whether to use a `send.` subdomain for DKIM alignment).

## Deferred Ideas

- Newsletter form ↔ Listmonk wiring, proxy CORS, ALTCHA anti-spam → Phase 4.
- `PUBLIC_LISTMONK_*` env-var consumption in the build → Phase 4 (this phase produces the values).
- Deleting the `legacy/` folder entirely → milestone cleanup.
