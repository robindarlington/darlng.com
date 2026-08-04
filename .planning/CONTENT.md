# DARLNG Content Inventory (Canonical)

**Gathered:** 2026-08-04 — all links resolved from the user's aggregator pages (hyperfollow/song.link), verified via iTunes API and YouTube search. This file is the single source of truth for release data, brand direction, and copy inputs. Phases 2–5 consume it.

## Scope Revision (2026-08-04, agreed with user)

**LOCAL-ONLY BUILD.** The user will personally handle all live infrastructure AFTER approving the local build: Coolify app creation, Listmonk+Postgres deploy, Resend SMTP setup, LWS DNS records, live cutover.

- DO NOT attempt live deploys, DNS changes, or Listmonk instance work in any phase.
- DO author deploy artifacts (Dockerfile, nginx.conf per D-07/D-08) and a Coolify setup runbook (`website/DEPLOY.md`) so the user can flip the switch.
- Success criteria requiring the live domain (live cutover, live email delivery, live Lighthouse, mxtoolbox DNS) are DEFERRED to the user's deploy step. Verify local equivalents instead: clean `npm run build`, local preview server, Lighthouse against local built dist, mocked Listmonk endpoint for form states.
- Workflow per phase: build → `npm run build` passes → browser-test via preview MCP at 375px / 768px / 1440px minimum → fix and re-test until polished → commit → push to origin master.

## Releases (newest first)

### Eseriani (2026) — Darlng x Tobiko
- **Slug:** `eseriani` — LATEST RELEASE, hero feature
- **Cover art:** `/Users/rob/Desktop/DARLNG/ESERIANI/ESERIANI.jpg` (1254×1254)
- **Hero embed:** YouTube official video `https://youtube.com/watch?v=qltP16ukVr4` via youtube-nocookie.com facade pattern (thumbnail + click-to-load, protect LCP)
- Spotify (album): https://open.spotify.com/album/3rPZRfnYweEdoQXt78DkJQ
- Apple Music: https://music.apple.com/us/album/eseriani-single/6780308217
- YouTube: https://youtube.com/watch?v=qltP16ukVr4
- iHeartRadio: https://www.iheart.com/artist/id-51034697/albums/id-408729127
- Hyperfollow (reference only): https://distrokid.com/hyperfollow/darlngxtobiko/eseriani

### Randevu (2024) — Darlng ft. Shubi Di Badman
- **Slug:** `randevu`
- **Cover art:** `/Users/rob/Desktop/DARLNG/RANDEVU/RANDEVU.jpg` (2450×2450)
- Spotify (track): https://open.spotify.com/track/0IZDYN5TWzvcAzLtmX0Tbf
- Deezer: https://www.deezer.com/track/2872988692
- Amazon Music: https://music.amazon.com/albums/B0D8LHNXQ6?trackAsin=B0D8LJSBW4
- Tidal: https://listen.tidal.com/track/372717222
- Pandora: https://www.pandora.com/TR:128946631
- Napster: https://play.napster.com/track/tra.809485382
- Anghami: https://play.anghami.com/song/1166313324
- NOT on Apple Music. Songlink (reference only): https://song.link/randevu

### Brave (2020) — Darlng ft. Ray Pineapple
- **Slug:** `brave`
- **Cover art:** `/Users/rob/Desktop/DARLNG/BRAVE/BRAVE.jpg` (3000×3000)
- Spotify (track): https://open.spotify.com/track/6tExFPMrQNZx233cYQmqNq
- Apple Music: https://music.apple.com/fr/album/brave-feat-ray-pineapple-single/1535673587
- Tidal: https://listen.tidal.com/track/158456117
- Pandora: https://www.pandora.com/TR:107403386
- Boomplay: https://www.boomplay.com/songs/144156765
- Songlink (reference only): https://song.link/darlng-brave

### Open Wide (2019) — Darlng ft. Don Classic
- **Slug:** `open-wide`
- **Cover art:** `/Users/rob/Desktop/DARLNG/OPEN WIDE/OPEN_WIDE.jpg` (3000×3000)
- Spotify (album): https://open.spotify.com/album/0tH6wTY01FjjYnFuTBMA3e
- Apple Music: https://music.apple.com/us/album/open-wide-feat-don-classic-single/1491599938
- Amazon: http://www.amazon.com/gp/product/B082RBHFWH
- Deezer: https://www.deezer.com/album/123035192
- iHeartRadio: https://www.iheart.com/artist/id-33736629/albums/id-85989670
- Napster: https://us.napster.com/artist/darlng/album/open-wide
- SKIP the hyperfollow page's "YouTube Music" link (dead Google Play URL). Hyperfollow (reference only): https://distrokid.com/hyperfollow/darlng/open-wide-feat-don-classic

## Social Profiles (header/footer follow links)

- Spotify artist: https://open.spotify.com/artist/0uXxSPfLr36OuyGDKiBzV3
- Instagram: https://www.instagram.com/darlngmusic
- Facebook: https://www.facebook.com/darlng.music
- YouTube: https://www.youtube.com/channel/UC_noHUKnp2wJ3fi29smmZKw
- TikTok: https://www.tiktok.com/@darlng_music

## Brand Direction (user's words)

- No existing branding — "Make it pop", pick something original. Dark/moody cinematic base per BRAND-01.
- **Single jewel accent color**, architected as ONE swappable design token so it can be re-tinted to match the latest release later.
- Fonts: Claude's pick from Fontsource — cinematic display + clean body pairing.
- Genre line: **"Afro / RnB / Pop"** (exact phrasing).
- Artist positioning for all copy (tagline, newsletter pitch, meta description): 100% independent artist; releases music when he feels like it, no schedule; full creative freedom in collaborations and direction. Tone: confident, not corporate.

## Newsletter (Phase 4 inputs)

- Build Preact form island against `PUBLIC_LISTMONK_URL` + `PUBLIC_LISTMONK_LIST_UUID` env vars (values arrive when user deploys Listmonk).
- Success / error / already-subscribed states; test locally against a mocked endpoint.
- No live Listmonk work in any phase.
