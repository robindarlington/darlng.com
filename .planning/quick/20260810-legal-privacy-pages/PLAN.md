---
task: legal-privacy-pages
slug: 20260810-legal-privacy-pages
phase: quick
plan: 01
type: quick
wave: 1
depends_on: []
autonomous: true
created: 2026-08-10
files_modified:
  - website/src/pages/privacy.astro
  - website/src/pages/legal.astro
  - website/src/components/Footer.astro

estimate:
  tokens: 45000
  raw_tokens: 45000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "A visitor on any page can reach the privacy policy and the legal notice from the footer, at 375px and at 1440px, with no horizontal overflow."
    - "/privacy states that the only data collected is an email address via double opt-in newsletter signup, on the legal basis of consent, withdrawable at any time via the unsubscribe link in every email."
    - "/privacy names both processors — self-hosted Listmonk on the artist's own Hetzner server (Hetzner Online GmbH, Germany, EU) and Resend Inc. (email delivery, EU sending region) — and states plainly that there are no cookies, no analytics and no tracking."
    - "/privacy explains the YouTube click-to-load embed and outbound streaming links, lists every GDPR right, gives hello@darlng.com as the single contact, and states the retention rule."
    - "/legal names the publisher (DARLNG, independent artist), the contact address, and Hetzner's full postal address."
    - "Both pages are indexable and appear in the generated sitemap."
    - "The footer keeps its three-column grid at md+ and its centered stack at mobile — the only visible change is the two new links."
  artifacts:
    - "website/src/pages/privacy.astro"
    - "website/src/pages/legal.astro"
    - "website/src/components/Footer.astro (modified — third grid cell wraps policy nav + copyright)"
    - "website/dist/privacy/index.html and website/dist/legal/index.html (build output)"
    - "website/dist/sitemap-0.xml containing https://darlng.com/privacy/ and https://darlng.com/legal/"
  key_links:
    - "The footer grid container must keep exactly THREE direct children. Adding a fourth breaks `md:grid-cols-3` and reflows the whole footer at 768/1440 — the new links go INSIDE the existing third cell."
    - "Astro's directory build format maps `src/pages/privacy.astro` -> `dist/privacy/index.html` -> sitemap URL `https://darlng.com/privacy/`. A filename typo ships a silent 404 with a live footer link pointing at it."
    - "Layout's `noindex` prop must stay unset on both pages — @astrojs/sitemap lists every page regardless, so a stray noindex produces a sitemap that advertises pages crawlers are told to ignore."
---

<objective>
Add two static prose pages — `/privacy` (privacy policy) and `/legal` (legal notice) — to the DARLNG site, and link both from the footer.

Purpose: darlng.com collects email addresses through a Listmonk newsletter. A GDPR-facing privacy policy and a publisher/host legal notice are the minimum a live EU-facing site owes its visitors, and the footer is where people look for them.

Output: `website/src/pages/privacy.astro`, `website/src/pages/legal.astro`, an edited `website/src/components/Footer.astro`, a green build + check, and a pushed commit.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@/Users/rob/Desktop/projects/Sites/darlng.com/CLAUDE.md
@/Users/rob/Desktop/projects/Sites/darlng.com/website/src/layouts/Layout.astro
@/Users/rob/Desktop/projects/Sites/darlng.com/website/src/pages/404.astro
@/Users/rob/Desktop/projects/Sites/darlng.com/website/src/components/Footer.astro
@/Users/rob/Desktop/projects/Sites/darlng.com/website/src/styles/global.css
</context>

## Established facts (verified against the repo, do not re-derive)

- **Layout props:** `title`, `description`, `image` (defaults to `/og/home.png`), `type`, `canonical`, `musician`, `releaseDate`, `noindex`, `preloadImage`. Passing nothing but `title` + `description` yields a correct canonical + OG set. `Layout` already renders `Header`, the `<main id="main" class="mx-auto w-full max-w-7xl px-4 md:px-6 xl:px-8">` wrapper, and `Footer`. **Pages must not re-add their own page-width container** — `main` already provides it.
- **Page pattern (from `404.astro`):** a single `<section class="py-12 md:py-16">`, `<h1 class="font-display font-extrabold text-headline leading-[1.05]">`, body copy as `<p class="text-base text-text-muted max-w-prose mt-4">`.
- **Section-heading pattern (from `index.astro`):** `<h2 class="text-2xl leading-tight font-display font-bold">`.
- **Tokens available:** `text-headline` (2.5rem), `font-display` (Unbounded), `font-body` (Manrope, on `body`), `text-text`, `text-text-muted`, `text-accent`, `bg-surface`, `rounded-card`. Global `:focus-visible` already draws a 2px accent outline.
- **Build format:** Astro default `directory` — `src/pages/privacy.astro` builds to `dist/privacy/index.html`; the sitemap entry is `https://darlng.com/privacy/` (trailing slash, confirmed against the existing `dist/sitemap-0.xml`).
- **Grep hygiene (measured on the current `dist/`):** `dist/index.html` is 35 lines and heavily packed, so `grep -c` counts LINES, not occurrences (`grep -c 'rel="noopener noreferrer"' dist/index.html` = 5 while the real count is 22). For any count-equality assertion use `grep -o PATTERN FILE | wc -l`. `grep -c 'name="robots"'` is safe as a zero/non-zero gate only (it is 0 on indexable pages, 1 on `dist/404.html`).
- **Commands:** run everything from `website/`. `npm run check` = `astro check` + contrast script. `npm run build` runs a `prebuild` asset generator first.

## Voice rules for the prose (both pages)

Plain, confident, human. First person singular for the artist ("I run this site", "I keep your email until…"), second person for the reader ("your email", "you can…"). Short declarative sentences. No legalese: no "hereinafter", no "the Data Subject", no "we may from time to time", no defined-term capitalisation. Every legally required fact from the spec below must still be present and unambiguous — plain language is the style, not a licence to omit facts.

<tasks>

<task type="tracer" tdd="false">
  <name>Task 1: /privacy end-to-end — page, footer link, build, sitemap</name>
  <files>website/src/pages/privacy.astro, website/src/components/Footer.astro</files>
  <read_first>
    - website/src/pages/404.astro (page skeleton to mirror exactly)
    - website/src/components/Footer.astro (the three-child grid you are editing)
    - website/src/layouts/Layout.astro (prop names)
  </read_first>
  <action>
    This is the thin vertical slice: one new page, wired from the footer, proven through the build into the sitemap. `/legal` in Task 2 then copies a pattern that is already known to work.

    STEP 1 — Create `website/src/pages/privacy.astro`. Frontmatter imports `Layout` from `../layouts/Layout.astro` and nothing else. Render `<Layout title="Privacy — DARLNG" description="How DARLNG handles your data: an email address for the newsletter, nothing else. No cookies, no analytics, no tracking.">`. Pass no `image` prop (the Layout default `/og/home.png` is correct) and pass no indexing-suppression prop — this page must be indexable.

    STEP 2 — Page body. One `<section class="py-12 md:py-16">` as the only top-level child of `Layout`. Do NOT wrap it in another `max-w-7xl` container; `Layout`'s `<main>` already supplies page width and padding.
    - `<h1 class="font-display font-extrabold text-headline leading-[1.05]">Privacy</h1>`
    - A lead paragraph directly under the h1: `<p class="text-base text-text-muted max-w-prose mt-4">`.
    - Each subsequent section is an `<h2 class="text-2xl leading-tight font-display font-bold mt-12">` followed by one or more `<p class="text-base text-text-muted max-w-prose mt-4">`. Where a list reads better than a paragraph (the rights list), use `<ul class="text-base text-text-muted max-w-prose mt-4 list-disc pl-5 space-y-2">` with plain `<li>` children.
    - The `hello@darlng.com` contact must be a real `mailto:` anchor at least once, classed `text-text underline underline-offset-4 transition-colors hover:text-accent`.

    STEP 3 — Content. Write it in the voice rules above. Every one of these facts must appear, in this order:
    - **Lead:** DARLNG runs this site and is the controller of any personal data it handles; the contact for anything on this page is hello@darlng.com.
    - **What I collect** (h2): an email address, and only if you hand it over via the newsletter signup. Signup is double opt-in — you get a confirmation email and nothing happens until you click it. Nothing else about you is collected: no name, no location, no account.
    - **Why I'm allowed to hold it** (h2): consent, given at that confirmation click. You can withdraw it at any time using the unsubscribe link at the bottom of every email — that removes you, no reply or explanation needed.
    - **Who else touches it** (h2): the newsletter runs on Listmonk, self-hosted on my own server at Hetzner Online GmbH in Germany (EU). Email delivery goes through Resend Inc., configured to send from their EU region. Those are the only two processors. Name both explicitly.
    - **No cookies, no analytics, no tracking** (h2): the site sets no cookies, runs no analytics, and does not track visitors across pages or sites. State it flatly.
    - **Embeds and links out** (h2): the video on the site does not load until you click play — it uses youtube-nocookie.com, so nothing reaches Google until that click, and once you click you are connected to YouTube/Google under their own privacy policy. The streaming and social buttons are links to third-party platforms (Spotify, Apple Music, YouTube, Instagram, Facebook, TikTok); once you follow one you are on their site under their policy, not this one.
    - **Your rights** (h2): under GDPR you can ask for access to your data, correction of it, erasure of it, a portable copy of it, you can object to its processing, you can withdraw consent, and you can complain to a data protection supervisory authority. All of the first six happen by emailing hello@darlng.com.
    - **How long I keep it** (h2): your email stays on the list until you unsubscribe or ask me to erase it; after that it is gone.
    - **Last updated** — a final `<p class="text-sm text-text-muted mt-12">` reading `Last updated: 10 August 2026`.

    STEP 4 — Footer. In `website/src/components/Footer.astro`, the grid container currently has exactly three direct children (brand block, social `nav`, copyright `<p>`). Keep it at three. Replace the third child — the copyright `<p class="text-sm text-text-muted md:text-right">` — with a `<div class="flex flex-col items-center gap-1 md:items-end md:text-right">` containing, in order:
    - a `<nav aria-label="Site policies" class="flex items-center gap-2 text-sm text-text-muted">` holding an anchor to `/privacy` with the visible text `Privacy`, then a `<span aria-hidden="true">·</span>` separator. (The `/legal` anchor is added in Task 2 — this task ships the Privacy link only.)
    - the original copyright `<p>`, now classed `text-sm text-text-muted` (drop `md:text-right`; the wrapper handles alignment).
    Each policy anchor is classed `inline-flex items-center min-h-11 px-1 transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent` — `min-h-11` gives the 44px tap-target height the footer's social icons already use, `px-1` keeps the horizontal hit area off the separator. These are internal links: no `target`, no `rel`.
    Leave the separator `·` in the markup even though only one link exists at the end of this task; Task 2 fills the right-hand side.
  </action>
  <verify>
    <automated>cd /Users/rob/Desktop/projects/Sites/darlng.com/website && npm run check && npm run build && test -f dist/privacy/index.html && grep -q '<title>Privacy — DARLNG</title>' dist/privacy/index.html && grep -q 'https://darlng.com/privacy/' dist/sitemap-0.xml && test "$(grep -c 'name="robots"' dist/privacy/index.html)" = "0" && grep -q 'href="/privacy"' dist/index.html && grep -q 'href="/privacy"' dist/404.html && grep -q 'mailto:hello@darlng.com' dist/privacy/index.html && grep -q 'Hetzner Online GmbH' dist/privacy/index.html && grep -q 'Resend' dist/privacy/index.html && grep -q 'youtube-nocookie.com' dist/privacy/index.html && grep -q '10 August 2026' dist/privacy/index.html && test "$(grep -o 'rel="noopener noreferrer"' dist/index.html | wc -l)" = "$(grep -o 'target="_blank"' dist/index.html | wc -l)"</automated>
  </verify>
  <acceptance_criteria>
    - `npm run check` and `npm run build` both exit 0.
    - `dist/privacy/index.html` exists with the exact title `Privacy — DARLNG` and contains no robots meta tag.
    - `dist/sitemap-0.xml` contains `https://darlng.com/privacy/`.
    - The footer link to `/privacy` is present in every built page (spot-checked on `dist/index.html` and `dist/404.html`).
    - The page names Hetzner Online GmbH, Resend, youtube-nocookie.com, a `mailto:hello@darlng.com` link, and the 10 August 2026 date.
    - The external-link invariant is untouched: occurrence counts of `rel="noopener noreferrer"` and `target="_blank"` in `dist/index.html` are still equal.
    - The footer grid container still has exactly three direct children.
  </acceptance_criteria>
  <done>`/privacy` builds, is indexable, is in the sitemap, and is reachable from the footer of every page.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: /legal notice + second footer link</name>
  <files>website/src/pages/legal.astro, website/src/components/Footer.astro</files>
  <read_first>
    - website/src/pages/privacy.astro (the pattern Task 1 just proved — mirror its structure exactly)
  </read_first>
  <action>
    STEP 1 — Create `website/src/pages/legal.astro` using the identical skeleton to `privacy.astro`: same `Layout` import, one `<section class="py-12 md:py-16">`, same h1 / h2 / paragraph classes, same `mailto:` anchor styling, no `image` prop, no indexing-suppression prop.

    Layout props: `title="Legal — DARLNG"`, `description="Legal notice for darlng.com — publisher, contact, and hosting details."`

    STEP 2 — Content, same plain voice, in this order:
    - `<h1 ...>Legal notice</h1>` plus a one-line lead: this page says who publishes darlng.com and who hosts it.
    - **Publisher** (h2): DARLNG, independent artist. Contact: hello@darlng.com as a `mailto:` anchor.
    - **Hosting** (h2): the site is hosted by Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Germany. Give the address in full.
    - A final `<p class="text-sm text-text-muted mt-12">` reading `Last updated: 10 August 2026`.

    STEP 3 — Placeholder. Immediately after the Publisher section's markup, add a real HTML comment (`<!-- ... -->`, not a `{/* */}` expression comment) recording that a full legal name and postal address belong here if a jurisdiction ever requires them for this site, and that they are deliberately omitted while DARLNG operates as an independent artist without a registered business address. Use the words "legal name" verbatim inside that comment so it is findable. Do not put any real name, address, phone number or tax ID in it.

    STEP 4 — Footer. In `website/src/components/Footer.astro`, add the second anchor to the `Site policies` nav, immediately after the `·` separator: `href="/legal"`, visible text `Legal`, the same anchor class string used for the Privacy link. Do not touch anything else in the footer — the grid still has exactly three direct children.
  </action>
  <verify>
    <automated>cd /Users/rob/Desktop/projects/Sites/darlng.com/website && npm run check && npm run build && test -f dist/legal/index.html && grep -q '<title>Legal — DARLNG</title>' dist/legal/index.html && grep -q 'https://darlng.com/legal/' dist/sitemap-0.xml && test "$(grep -c 'name="robots"' dist/legal/index.html)" = "0" && grep -q 'Industriestr. 25' dist/legal/index.html && grep -q '91710 Gunzenhausen' dist/legal/index.html && grep -q 'mailto:hello@darlng.com' dist/legal/index.html && grep -q '10 August 2026' dist/legal/index.html && grep -q 'legal name' src/pages/legal.astro && grep -q 'href="/legal"' dist/index.html && grep -q 'href="/legal"' dist/privacy/index.html && grep -q 'href="/privacy"' dist/legal/index.html && test "$(grep -o 'rel="noopener noreferrer"' dist/index.html | wc -l)" = "$(grep -o 'target="_blank"' dist/index.html | wc -l)"</automated>
  </verify>
  <acceptance_criteria>
    - `npm run check` and `npm run build` both exit 0.
    - `dist/legal/index.html` exists with the exact title `Legal — DARLNG` and no robots meta tag.
    - `dist/sitemap-0.xml` contains both `https://darlng.com/privacy/` and `https://darlng.com/legal/`.
    - The legal page carries the full Hetzner postal address, a `mailto:hello@darlng.com` link, and the 10 August 2026 date.
    - `src/pages/legal.astro` contains an HTML comment mentioning `legal name`, with no real personal data in it.
    - Both footer links resolve from every page: `/legal` appears in `dist/index.html` and `dist/privacy/index.html`; `/privacy` appears in `dist/legal/index.html`.
    - The external-link invariant still holds on `dist/index.html`.
  </acceptance_criteria>
  <done>Both pages exist, are indexable, are in the sitemap, and cross-link through the footer.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Responsive browser verification at 375 + 1440, then commit and push</name>
  <files>(no source changes expected — fix-forward only if verification fails)</files>
  <precondition>`git ls-remote origin` succeeds from the repo root (SSH auth to git@github.com:robindarlington/darlng.com is configured) — the task ends in a push to origin master.</precondition>
  <action>
    STEP 1 — Serve the built site. From `website/`, run `npm run preview` in the background and note the port it reports (Astro's preview default is 4321). Wait until it responds before driving the browser.

    STEP 2 — Drive the browser with `agent-browser` (fall back to `npx agent-browser` if the binary is not on PATH). At BOTH viewports — `agent-browser set viewport 375 812` and `agent-browser set viewport 1440 900` — do the following against the preview server:
    - Open `/`. Confirm no horizontal overflow by evaluating `document.documentElement.scrollWidth <= window.innerWidth` — it must be `true`.
    - Snapshot and confirm the footer shows both policy links, visible and readable, sitting with the copyright line and not colliding with the social icon row or the brand block.
    - Click the Privacy link, confirm you land on `/privacy/` with the `Privacy` h1, and re-run the overflow evaluation there.
    - Navigate to `/legal/`, confirm the `Legal notice` h1, and re-run the overflow evaluation there.
    - Take a screenshot of the footer at each viewport as evidence for the summary.
    Also confirm at 768 width that the three-column footer grid still reads as three columns (this is the width where a fourth grid child would have shown up as a break).

    STEP 3 — If anything fails, fix it in `Footer.astro` or the page files, rebuild, and re-run STEP 2 before proceeding. Do not commit a failing state.

    STEP 4 — Stop the preview server. Stage only the three intended files (`website/src/pages/privacy.astro`, `website/src/pages/legal.astro`, `website/src/components/Footer.astro`) — the working tree has unrelated untracked files (`loopcaption.md`, `template/`) that must NOT be staged. Commit with the message `feat: add privacy policy and legal notice pages`. Then push with `git push origin master`.
  </action>
  <verify>
    <automated>cd /Users/rob/Desktop/projects/Sites/darlng.com && git log -1 --pretty=%s | grep -q 'feat: add privacy policy and legal notice pages' && test -z "$(git status --porcelain website/src)" && test "$(git log -1 --name-only --pretty=format: | grep -c .)" = "3" && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/master)" && test -z "$(git log origin/master..HEAD --oneline)"</automated>
    <human-check>Footer screenshots at 375 and 1440 show `Privacy · Legal` sitting cleanly with the copyright line, with the three-column layout intact at desktop.</human-check>
  </verify>
  <acceptance_criteria>
    - `document.documentElement.scrollWidth <= window.innerWidth` evaluates `true` on `/`, `/privacy/` and `/legal/` at both 375x812 and 1440x900.
    - Both footer links are visible and clickable at both viewports, and navigation from the footer reaches each page.
    - The footer still renders as three columns at 768 and above, and as a centered stack below it.
    - Exactly one new commit exists with the message `feat: add privacy policy and legal notice pages`, touching only the three intended files.
    - `loopcaption.md` and `template/` remain untracked and uncommitted.
    - `git log origin/master..HEAD` is empty — the commit is pushed.
  </acceptance_criteria>
  <done>Both pages verified in a real browser at mobile and desktop widths, committed, and pushed to origin master.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| visitor -> static HTML | Read-only. These two pages accept no input, run no JS, and post nowhere. |
| repo -> public web | Anything written into `legal.astro`, including HTML comments, ships to the public `dist/` output. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QUICK-01 | Information Disclosure | `website/src/pages/legal.astro` HTML comment placeholder | medium | mitigate | The placeholder comment is a note about WHERE a legal name/postal address would go — Task 2 forbids putting any real name, address, phone number or tax ID in it. HTML comments render into public output. |
| T-QUICK-02 | Tampering (reverse tabnabbing) | `website/src/components/Footer.astro` | low | mitigate | Both new links are internal (`/privacy`, `/legal`) with no `target="_blank"`. Tasks 1 and 2 both assert the existing `rel="noopener noreferrer"` / `target="_blank"` occurrence counts in `dist/index.html` stay equal, proving the footer edit did not disturb the existing external-link invariant. |
| T-QUICK-03 | Information Disclosure | privacy policy accuracy | low | accept | The policy asserts "no cookies, no analytics, no tracking". This is true of the current build (no analytics package in `package.json`, no cookie-setting code). If analytics are ever added, this page becomes a false statement — that is a future-phase obligation, not a mitigation available here. |

No new dependencies, no new network calls, no new user input, no PII collected by either page. Attack surface added: zero.
</threat_model>

<verification>
- `cd website && npm run check && npm run build` exit 0.
- `dist/privacy/index.html` and `dist/legal/index.html` exist, carry their unique titles, and carry no robots meta tag.
- `dist/sitemap-0.xml` contains `https://darlng.com/privacy/` and `https://darlng.com/legal/`.
- Occurrence counts (`grep -o ... | wc -l`) of `rel="noopener noreferrer"` and `target="_blank"` in `dist/index.html` are equal — unchanged from before this task.
- Browser check at 375x812 and 1440x900: footer links visible, both pages reachable by click, no horizontal overflow on `/`, `/privacy/`, `/legal/`.
- One commit, three files, pushed to origin master.
</verification>

<success_criteria>
A visitor at any viewport can find `Privacy · Legal` in the footer, click either one, and read a plain-language page that names DARLNG as controller, hello@darlng.com as contact, Hetzner and Resend as processors, and states the consent basis, the GDPR rights, the retention rule, and the 10 August 2026 date — with the footer layout and the site's existing external-link security invariant both unchanged.
</success_criteria>

<output>
Create `.planning/quick/20260810-legal-privacy-pages/SUMMARY.md` when done.
</output>
