# Feature Research

**Domain:** Fan-facing music release hub — independent Afro/RnB/Pop artist site
**Researched:** 2026-06-26
**Confidence:** HIGH (table stakes/anti-features); MEDIUM (differentiators — pattern-based, no direct A/B evidence)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must exist. A fan arriving from a Spotify profile link or social bio expects all of these. Missing any one makes the site feel unfinished or amateurish.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Hero section — latest release (Eseriani, 2026)** | Fan arriving from social is primed for the newest drop; absence of the current release in the hero is the single most common criticism of artist sites | LOW | Full-bleed section with artwork, release name, and primary CTA. Static — no dynamic CMS needed. |
| **Spotify embed for the hero/latest release** | Fans expect to preview audio immediately in-page without leaving; Spotify iframe is the de facto standard. | LOW | Use `loading="lazy"` only if embed is below the fold. Above-fold embeds must NOT use lazy loading (LCP killer). Use Spotify's official iframe embed via `open.spotify.com/embed/album/…`. |
| **Primary streaming CTAs in the hero** | "Listen on Spotify / Apple Music" buttons are the expected conversion action for a music site hero | LOW | Buttons for Spotify, Apple Music, YouTube Music at minimum. Links open in new tab. |
| **Discography section — back catalog** | Fans want to explore. Missing Randevu, Brave, Open Wide signals an incomplete site | LOW-MEDIUM | Grid layout is standard: 4 releases, cover art, title, year, per-release streaming links. No audio embeds needed for back catalog — clean native links suffice per PROJECT.md. |
| **"Listen Everywhere" page** | Modern fans are on every platform. A single branded hub replacing a third-party smart-link page (Linktree/Linkfire) is expected and builds trust | LOW | Per-platform buttons: Spotify, Apple Music, YouTube, YouTube Music, Tidal, Amazon Music, Deezer, SoundCloud. Can be a standalone page linked from nav and hero. |
| **Social follow links** | Instagram, TikTok, YouTube, Spotify artist profile — standard footer/header anchors | LOW | Plain icon links to platform profiles. NOTE: The Spotify Follow Button widget was officially deprecated in 2021 and accounts for <0.1% of artist follows anyway. Use a plain link to the Spotify artist profile instead. |
| **Newsletter signup** | Email is 40x more effective than social for fan retention. Fans who land on a site and can't subscribe have no passive-engagement path. | MEDIUM | Self-hosted Listmonk — form POSTs to Listmonk's `/api/public/subscription` endpoint. Single field (email) + opt-in confirmation flow. No modal/popup needed for v1; inline section is sufficient. |
| **Open Graph / social sharing meta tags** | When a fan shares the URL on Twitter/Instagram Stories/Discord, the link preview must show album art and artist name — not a blank card | LOW | Implement `og:title`, `og:description`, `og:image` (1200×630 release artwork), `og:type: "music.album"` for release pages. Twitter card `summary_large_image` as fallback. Per-release OG image is the key detail. |
| **Mobile-first responsive layout** | >60% of music site traffic arrives on mobile from social bio links | LOW | Single-column stack on mobile; CSS grid/flex for desktop. Tailwind 4 makes this trivial. |
| **Fast initial load / Core Web Vitals pass** | Google ranking signal; also critical for fan retention — music fans bounce fast if the page is slow | MEDIUM | Targets: LCP <2.5s, CLS <0.1, TBT <200ms. Astro's static output already helps. Key risks: hero image (Sharp/srcset), Spotify iframe (lazy below fold only), font loading (Fontsource, preload). |

---

### Differentiators (Competitive Advantage)

Features that distinguish a memorable, premium-feeling artist site from a generic template. Not strictly required, but each one meaningfully raises the experience level.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Cinematic full-bleed hero with mood-first visual design** | Dark-moody, late-night Afro/RnB/Pop aesthetic immediately communicates the music's vibe before a note plays. Branded distinctly from generic Squarespace templates. | MEDIUM | Deep black backgrounds, neon/jewel accent color (single accent hue), high-quality release artwork, possible subtle CSS animation or grain overlay. Must be hand-crafted — not a template. |
| **Per-release "listen everywhere" sub-pages** | Instead of one generic smart-link page, each release (Eseriani, Randevu, etc.) gets its own branded `/eseriani`, `/randevu` page with artwork, per-platform buttons, and optional embed. Makes sharing a specific release link feel intentional rather than generic. | LOW-MEDIUM | Four static pages. Slug-based routing in Astro. Reuses the same component layout per release. |
| **Branded own "listen everywhere" page (vs. third-party)** | Linkfire/Feature.fm/Linktree charge fees, add their branding, and own the redirect analytics. A native page at `darlng.com/listen` is fully branded, zero-cost, and keeps fans on-domain. | LOW | Already a core requirement (PROJECT.md), but the *execution quality* is the differentiator — high contrast platform buttons, artwork header, release selector if multi-release. |
| **Subtle scroll-reveal / entrance animations** | Adds polish and cinematic feel consistent with Afro/RnB visual language. Sites with no animation feel flat by contrast. | LOW | CSS `animation` or Intersection Observer — no heavy JS libraries. Respect `prefers-reduced-motion`. |
| **Schema.org MusicGroup + MusicAlbum structured data** | Increases chance of Google Knowledge Panel, discography carousel in search results. Fans searching "DARLNG" on Google may see music cards directly in SERP. | LOW | JSON-LD in `<head>`. `Person` schema for artist (solo), `MusicAlbum` per release with `datePublished`, `genre`, `byArtist`. `sameAs` pointing to Spotify, Instagram, etc. |
| **Custom OG images per release** | When Eseriani is shared vs. Randevu, the preview image should be that release's artwork — not a generic site logo. Fans notice and click through higher-quality cards. | LOW | Static per-release `og:image` pointing to properly sized (1200×630) artwork assets. Handled in per-release page `<head>`. |
| **Accessible high-contrast dark theme** | Dark themes are the default preference for music/nightlife audiences. Done properly with 4.5:1+ contrast ratios, it's both on-brand and compliant. Done lazily, it creates illegible grey-on-black text. | LOW | WCAG AA contrast (4.5:1 normal text, 3:1 large text) must be verified against chosen accent + background values. Use a contrast checker at design time. |
| **Privacy-first analytics (no cookie banner)** | Cookieless analytics mean no GDPR banner, no consent friction, cleaner fan experience. Artist can still see which releases drive traffic, where fans come from. | LOW | Plausible Analytics (self-hostable) or Umami (self-hostable on Coolify) preferred over GA4 — no cookies, no consent banner, GDPR-compliant by default. Fits the self-hosting preference. |

---

### Anti-Features (Deliberately NOT Building in v1)

These are things that look reasonable but are explicitly out of scope, actively harmful to the lean goal, or better deferred until a trigger event proves demand.

| Anti-Feature | Why Requested | Why It's An Anti-Feature | What to Do Instead |
|--------------|--------------|--------------------------|-------------------|
| **Full EPK (press bio, photos, tech rider)** | Standard item on "musician website checklist" articles | Audience is fans, not bookers/press. Adds weight, dilutes the fan conversion funnel, requires maintaining a separate content type. | Defer entirely until a booking inquiry explicitly hits darlng.com. A press page can be added in v2 if demand materialises. |
| **Tour / live dates section** | Ubiquitous on musician sites | No touring content exists for v1, and a blank or placeholder dates section signals "nothing happening." | Omit. Add in a future phase when active shows are booked. The absence of a blank section is better than a visible empty one. |
| **Merch / store** | Fans do buy merch | Requires payment processing, inventory management, fulfilment, returns — substantial scope and maintenance for a v1 static site. | Defer. If merch demand emerges, link out to a Bandcamp or Shopify storefront rather than building custom e-commerce. |
| **Dynamic CMS / blog / news feed** | "Keep fans updated" is a common recommendation | Requires authoring workflow, database or headless CMS, incremental builds — all complexity for content that most fans don't read regularly. Email newsletter is higher-ROI for the same content. | Use the newsletter (Listmonk) for updates. Static "about" copy in the site for evergreen content. If a news feed is later needed, MDX + Astro's content collections can handle it without a CMS. |
| **Third-party smart link services (Linkfire, Feature.fm, ToneDen)** | Convenient for generating "listen on all platforms" pages quickly | Adds third-party branding, fees, redirect latency, analytics black box, and domain dependency. Already-released catalog needs no pre-save — a native branded page is strictly better. | Own native "listen everywhere" page at `darlng.com/listen`. For a future unreleased drop where real Spotify pre-save is wanted, a smart-link service can be slotted in just for that campaign. |
| **Spotify Follow Button widget** | Official Spotify widget — looks legit | Spotify deprecated the Follow Button widget in October 2021. It drives <0.1% of artist follows. Generates an extra third-party JS request for negligible impact. | Simple icon link to `open.spotify.com/artist/0uXxSPfLr36OuyGDKiBzV3`. Same visual result, no deprecation risk, no JS cost. |
| **Exit-intent popup / newsletter modal** | Higher email capture rate in A/B tests | Intrusive; hurts first impression on a mood-first cinematic site. Conflicts with the "dark, premium" aesthetic. Popup tooling adds JS weight. | Inline newsletter section, well-placed below the hero/discography. A warm fan who scrolled past the music is a better subscriber than one interrupted by a popup. |
| **Multiple language / localisation** | Afro/RnB has global audience | Maintenance complexity for a solo artist site; content is in English; streaming platforms handle localisation on their end. | Single English-language site. If international fan base becomes meaningful, revisit. |
| **Countdown timer / pre-save flow** | Useful for upcoming drops | Nothing in the active v1 scope is unreleased. Countdown + pre-save tooling (Feature.fm etc.) is only valuable for a *future* drop. | When the next release is scheduled, add a pre-save campaign page (temporary) using a third-party pre-save service or Spotify's Campaign Kit — then swap to native links post-release. |
| **Video section / music video gallery** | Visual artists often want this | YouTube embeds are heavy (adds to LCP risk), require maintaining a separate section, and duplicate what YouTube already does well. | Link to YouTube channel in social links. Individual music video links can appear in release pages without an embedded gallery. |

---

## Feature Dependencies

```
Newsletter Signup
    └──requires──> Listmonk instance running on Coolify (external — infra dependency)
    └──requires──> Thank-you / confirmation state (inline or redirect)

Per-Release Listen Pages (/eseriani, /randevu, /brave, /open-wide)
    └──requires──> Release metadata (artwork, platform URLs, release dates) — must be gathered before build
    └──enhances──> "Listen Everywhere" hub page (hub can link to per-release pages)

Spotify Embed (hero)
    └──requires──> Spotify album/track URI for Eseriani — confirmed: artist `0uXxSPfLr36OuyGDKiBzV3`
    └──conflicts──> loading="lazy" IF embed is above the fold (kills LCP)

Open Graph / Schema Structured Data
    └──requires──> Final release artwork assets at canonical URLs (must be production domain, not localhost)
    └──enhances──> Per-release pages (each gets its own og:image)

Schema.org MusicGroup + MusicAlbum
    └──enhances──> SEO / Google Knowledge Panel (not required for site to function)
    └──independent──> (can be added at any time, no runtime dependency)

Social Follow Links
    └──requires──> Confirmed platform handles/URLs (Spotify artist ID, Instagram handle, TikTok handle, YouTube channel)
    └──independent──> (no JS, no external widget dependency)

Analytics
    └──independent──> (can be added any time; Plausible/Umami snippet in <head>)
    └──must-not──> use GA4 if goal is no cookie banner
```

### Dependency Notes

- **Newsletter requires Listmonk to be live first:** The signup form is dead without the backend. Listmonk on Coolify should be confirmed running before the form is wired up. The form itself POSTs to `/api/public/subscription` on the Listmonk host with `{ email, list_uuids[], name? }`.
- **Spotify embed above-fold must NOT be lazy-loaded:** Native `loading="lazy"` on the hero embed will defer it and tank LCP. Only apply lazy loading to below-fold embeds (back catalog, if any).
- **OG images need production URLs:** Open Graph crawlers (Slack, iMessage, Twitter) hit the `og:image` URL. The image must be at a publicly accessible URL — can't be a build-time relative path. Plan absolute URLs using the production domain from the start.
- **Per-release pages can be static Astro pages** — no content collection / CMS needed. Four releases, four files, all static. Keep simple.

---

## MVP Definition

### Launch With (v1) — this is the full v1 scope, deliberately lean

- [ ] **Cinematic hero** — Eseriani (2026) with full-bleed artwork, release title, Spotify embed, and primary streaming CTAs (Spotify, Apple Music, YouTube)
- [ ] **Discography section** — Randevu (2024), Brave (2020), Open Wide (2019) in a grid with cover art, titles, streaming links (no embeds for back catalog)
- [ ] **"Listen Everywhere" page** (`/listen` or `/eseriani`) — branded per-platform buttons for the latest release, plus a hub for the full catalog
- [ ] **Social follow links** — Spotify artist profile, Instagram, TikTok, YouTube (icon links, no widget JS)
- [ ] **Newsletter signup** — inline section, single email field, POST to self-hosted Listmonk API
- [ ] **Open Graph meta tags** — per-page `og:title`, `og:description`, `og:image` (1200×630 artwork), Twitter card
- [ ] **Dark/moody visual identity** — deep black base, single jewel/neon accent, cinematic typography, mobile-first responsive
- [ ] **Accessible contrast** — WCAG AA minimum on all text/backgrounds (especially critical on dark theme)
- [ ] **Core Web Vitals pass** — LCP <2.5s, CLS <0.1; verify with Lighthouse before ship

### Add After Validation (v1.x)

- [ ] **Schema.org JSON-LD** (MusicGroup + MusicAlbum per release) — add once production domain is live and crawlable; low effort, boosts SERP visibility
- [ ] **Per-release sub-pages** (`/eseriani`, `/randevu`, `/brave`, `/open-wide`) — shareable branded pages for each release; add once v1 base is stable
- [ ] **Privacy-first analytics** (Plausible or self-hosted Umami) — add once Coolify infra is confirmed; requires no user-facing change
- [ ] **Scroll-reveal entrance animations** — polish pass; only after core content/layout is locked

### Future Consideration (v2+)

- [ ] **Tour / live dates section** — trigger: artist books shows
- [ ] **EPK / press page** — trigger: booking/press requests come via the site
- [ ] **Merch integration** — trigger: merch exists to sell; link out to Bandcamp or Shopify rather than building custom
- [ ] **Pre-save campaign page** — trigger: next unreleased drop is scheduled; use Feature.fm or Spotify Campaign Kit temporarily, then remove post-release
- [ ] **Video / visual section** — trigger: music video assets warrant a dedicated showcase beyond YouTube link

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hero — Eseriani + streaming CTAs | HIGH | LOW | P1 |
| Spotify embed (hero) | HIGH | LOW | P1 |
| "Listen Everywhere" page | HIGH | LOW | P1 |
| Social follow links | HIGH | LOW | P1 |
| Newsletter signup (Listmonk) | HIGH | MEDIUM | P1 |
| Discography section (back catalog) | HIGH | LOW | P1 |
| Open Graph meta tags | HIGH | LOW | P1 |
| Dark/moody visual identity | HIGH | MEDIUM | P1 |
| Accessible contrast (dark theme) | HIGH | LOW | P1 |
| Core Web Vitals pass | HIGH | MEDIUM | P1 |
| Schema.org structured data | MEDIUM | LOW | P2 |
| Per-release sub-pages | MEDIUM | LOW | P2 |
| Privacy-first analytics | MEDIUM | LOW | P2 |
| Scroll-reveal animations | LOW | LOW | P2 |
| Tour dates section | LOW | MEDIUM | P3 |
| EPK / press page | LOW | MEDIUM | P3 |
| Merch / store | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have; add after v1 is live and stable
- P3: Defer — requires external trigger or v2+ scope

---

## Competitor / Reference Pattern Analysis

| Feature | Typical template sites (Bandzoogle, Squarespace) | Full artist sites (Adele, Weeknd) | Lean release-hub approach (this project) |
|---------|--------------------------------------------------|----------------------------------|------------------------------------------|
| Hero | Album art + generic CTA button | Cinematic video / full-bleed photo | Full-bleed artwork, mood-first, embed + CTAs |
| Streaming links | Generic "listen on all platforms" | Linkfire smart link (third-party) | Native branded `/listen` page on own domain |
| Discography | Grid or list, all with embeds | Animated sections, video | Grid with artwork + clean links; embed only for latest |
| Newsletter | Exit-intent popup + footer form | Footer capture only | Inline section, no popup, Listmonk self-hosted |
| Social | Footer icons, small | Prominent in nav | Icon links in nav + footer |
| Analytics | Wix/Squarespace built-in (GA-based) | GA4 + Meta Pixel + cookie banner | Cookieless (Plausible/Umami) — no banner |
| EPK | Included by default | Separate press section | Absent in v1 — fans, not bookers |
| Tour dates | Always present (even blank) | Prominent | Absent in v1 — no live shows in scope |
| Schema markup | Rarely implemented | Sometimes, inconsistently | JSON-LD MusicGroup + MusicAlbum in v1.x |

---

## Sources

- [Musician Website Examples: Developer's Guide](https://digitalthriveai.com/en-us/resources/web-development/musician-website-examples/) — performance targets, embed patterns, dark hero patterns
- [Hypebot: 7 Smart Website Changes for Music Fans](https://www.hypebot.com/hypebot/2025/05/7-smart-website-changes-that-turn-music-fans-to-paying-customers.html) — CTA placement, email capture, analytics
- [Bandzoogle: 15 Best Musician Website Designs](https://bandzoogle.com/blog/15-of-the-best-musician-website-designs-on-bandzoogle) — hero CTA patterns, discography grid, newsletter placement
- [HTMLBurger: 23 Awesome Musician Websites](https://htmlburger.com/blog/musician-websites/) — dark aesthetic examples, embed patterns, social integration
- [Linkfire: Email Capture for Musicians](https://www.linkfire.com/blog/email-capture) — opt-in rate data, incentive patterns
- [Chartlex: Email Marketing for Musicians 2026](https://www.chartlex.com/blog/marketing/email-marketing-for-musicians-2026) — frequency, welcome email, social-to-email funnel
- [Spotify Developers: Embeds](https://developer.spotify.com/documentation/embeds) — official iframe embed documentation
- [Spotify Follow Button Deprecation (2021)](https://developer.spotify.com/community/news/2021/10/15/follow-button-deprecation/) — confirms widget deprecated; use artist profile link
- [Web.dev: Iframe Lazy Loading](https://web.dev/articles/iframe-lazy-loading) — 514KB saving from lazy Spotify embed; above-fold caveat
- [Open Graph Protocol](https://ogp.me/) — music.album, music.song og:type spec
- [Olitunes: Musician Schema Markup & SEO](https://olitunes.com/how-to-optimize-your-band-or-musician-schema-markup-structured-data-for-seo/) — MusicGroup, Person, MusicAlbum JSON-LD patterns, sameAs
- [Listmonk](https://listmonk.app/) / [Listmonk on GitHub](https://github.com/knadh/listmonk) — self-hosted newsletter, public subscription API
- [Nuxt Scripts: Privacy-First Analytics Compared](https://scripts.nuxt.com/learn/privacy-first-analytics-compared) — Plausible vs Fathom vs Umami comparison
- [W3C WAI: Media Players Accessibility](https://www.w3.org/WAI/media/av/player/) — ARIA labels for audio, contrast requirements

---

*Feature research for: fan-facing music release hub (DARLNG)*
*Researched: 2026-06-26*
