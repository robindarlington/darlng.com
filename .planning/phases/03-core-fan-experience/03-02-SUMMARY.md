---
phase: 03-core-fan-experience
plan: 02
subsystem: ui
tags: [astro, youtube-facade, lucide, sharp, privacy, lcp]

requires:
  - phase: 03-core-fan-experience
    provides: "Plan 01's full-bleed Eseriani hero with the right grid column explicitly reserved (comment marker) for this facade panel"
provides:
  - "src/components/YouTubeFacade.astro — zero-JS-until-click YouTube facade: static Sharp-cropped thumbnail, 72/88px accent play button, scoped define:vars script that synchronously injects a youtube-nocookie.com iframe on click"
  - "Facade panel mounted in the hero's reserved slot, guarded on latestRelease.youtubeEmbed presence"
  - "Browser-verified proof (three viewports) that the homepage makes zero third-party requests before the fan clicks, that the hero image remains the LCP element with the facade present, and that the click-to-embed swap produces zero layout shift"
affects: [05-seo-polish]

actuals:
  tokens: 5200
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Zero-JS-until-click facade: plain scoped <script define:vars> (no Preact island, no client:* directive) synchronously creates and inserts the iframe inside the click handler — preserves the user-gesture chain for cross-origin autoplay"
    - "define:vars for server-to-client value passing — videoId/titleForA11y never string-templated into the script body, only typed build-time constants"

key-files:
  created:
    - website/src/components/YouTubeFacade.astro
  modified:
    - website/src/pages/index.astro
    - website/src/styles/global.css

key-decisions:
  - "Facade panel placed as a second child of the hero's flex/grid content wrapper (not nested inside the left column div) — at mobile/tablet the wrapper is flex-col so it naturally stacks below the CTA row in DOM order; at lg: the same wrapper becomes a 2-column grid so it becomes the right column. No duplicate markup or breakpoint-conditional rendering needed for the two placements the UI-SPEC describes."
  - "Destructured `youtubeEmbed` from `latestRelease` into a local const in frontmatter (rather than inline `latestRelease.youtubeEmbed &&` in the template) so TypeScript's control-flow narrowing unambiguously holds across the JSX-like expression under astro/tsconfigs/strict."

patterns-established:
  - "Facade-style third-party embed pattern (static local thumbnail + accent play button + define:vars click-to-iframe script) — reusable for any future embed that needs LCP/privacy protection."

requirements-completed: [HERO-02]

coverage:
  - id: D1
    description: "The hero renders a 16:9 panel showing a static, locally-processed thumbnail with a large accent play button before any interaction; no iframe exists and no request is made to youtube.com/youtube-nocookie.com/ytimg.com/google.com on initial page load"
    requirement: "HERO-02"
    verification:
      - kind: unit
        ref: "cd website && npm run check (0 errors) && npm run build — dist/index.html contains zero <iframe>, zero i.ytimg.com references, target/rel counts match (13=13)"
        status: pass
      - kind: automated_ui
        ref: "agent-browser eval at 375x812/768x1024/1440x900 on / — document.querySelectorAll('iframe').length === 0 and performance.getEntriesByType('resource') contains zero youtube/ytimg/google hosts at every viewport (agent-browser's `network requests --filter` sub-flag itself printed 'No requests captured' — see Deviations — so the resource-timing check plus the full unfiltered `network requests` listing, both showing localhost-only traffic, were used as the primary evidence)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Clicking the play button synchronously injects a youtube-nocookie.com/embed/qltP16ukVr4 iframe with the exact title/allow/allowfullscreen/referrerpolicy attributes, inside the same fixed 16:9 container, with zero layout shift"
    requirement: "HERO-02"
    verification:
      - kind: automated_ui
        ref: "agent-browser eval at 375x812/768x1024/1440x900 on / — post-click iframe.src === 'https://www.youtube-nocookie.com/embed/qltP16ukVr4?autoplay=1', title === 'DARLNG x Tobiko — Eseriani (Official Video)', allow === 'autoplay; encrypted-media; picture-in-picture', allowFullscreen === true, referrerPolicy === 'strict-origin-when-cross-origin', thumbnail/button removed, container getBoundingClientRect() unchanged (within 0.5px) before vs. after click at all three viewports"
        status: pass
    human_judgment: false
  - id: D3
    description: "The play button is keyboard-reachable, >=44px (72px mobile/tablet, 88px desktop), the facade container holds a fixed 16:9 ratio, and the hero image remains the LCP element with the facade panel present"
    requirement: "HERO-02"
    verification:
      - kind: automated_ui
        ref: "agent-browser eval — trigger.focus() sets document.activeElement to the trigger with computed outline-offset 4px at all three viewports; trigger rect 72x72 (375, 768) / 88x88 (1440); facade container aspect ratio exactly 1.77778 at all three; PerformanceObserver({type:'largest-contentful-paint', buffered:true}) reports the LCP element is #hero picture img (matchesSelector: true) at all three viewports"
        status: pass
    human_judgment: true
    rationale: "Whether the play button reads as 'premium and deliberately DARLNG-branded rather than a generic red YouTube triangle' and whether the glow/panel placement look right is a design-quality judgment call, not machine-decidable. Screenshots on disk at /tmp/darlng-phase3/facade-pre-{375,768,1440}.png and facade-post-1440.png for human visual review — reviewed during execution and read as clearly on-brand (turquoise circular button, subtle accent glow, panel sits comfortably beside the headline column)."
  - id: D4
    description: "Post-click embed failure backstop: if the ad-blocker/network prevents the embed from loading, the hero CTA row's direct YouTube link remains the working escape hatch"
    verification: []
    human_judgment: true
    rationale: "No ad-blocker extension was available in this automated browser-CLI environment to run the manual test the plan's backstop truth calls for. The escape hatch itself (CTA row's direct youtube.com link, unmodified by this plan) was not touched by either task and continues to function independently of the facade — verified by inspection, not by an actual ad-blocker run. Flagged as a genuine backstop requiring human verification per the plan's own `verification: backstop` designation."

duration: 9min
completed: 2026-08-08
status: complete
---

# Phase 3 Plan 2: YouTube Facade Summary

**Zero-JS-until-click YouTube facade in the hero — a static Sharp-cropped thumbnail with a 72/88px accent play button that swaps itself for a youtube-nocookie.com embed only on click, browser-verified to ship zero third-party requests before that click and to leave the hero image as the LCP element.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-08-08T13:32:00Z (approx.)
- **Completed:** 2026-08-08T13:41:28Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `YouTubeFacade.astro` — `.facade-container` (16:9, `overflow-hidden`, `rounded-card`) rendering a local Sharp-processed thumbnail (`object-[50%_22%]`, `loading="lazy"`, no third-party host), a uniform tint overlay, and a centered `[data-facade-trigger]` play button (72px mobile/tablet, 88px `lg:`, `bg-accent`/`text-bg`, `@lucide/astro` `Play` icon) with `.facade-play:hover` glow and `.facade-play:focus-visible` 4px offset rules in `global.css`
- A scoped `<script define:vars={{ videoId, titleForA11y }}>` synchronously builds and inserts a `youtube-nocookie.com` iframe (`autoplay=1`, `allow="autoplay; encrypted-media; picture-in-picture"`, `allowfullscreen`, `referrerpolicy="strict-origin-when-cross-origin"`) inside the click handler, replacing the thumbnail/button via `replaceChildren` with `{ once: true }` — no async gap that would break the user-gesture chain
- Facade mounted in `index.astro`'s hero, guarded on `latestRelease.youtubeEmbed` presence, placed as a sibling of the left content column so the same flex-col-at-mobile/grid-at-lg wrapper naturally stacks it below the CTA row on small screens and moves it to the right column at `lg:`, with no duplicate markup
- Browser-verified at 375x812/768x1024/1440x900: zero iframes and zero youtube/ytimg/google resource-timing entries pre-click; LCP element confirmed as `#hero picture img` (not the facade thumbnail) at every viewport; play-button geometry and 16:9 container aspect ratio exact; keyboard focus reaches the trigger with a 4px focus-visible offset; post-click iframe carries the exact required `src`/`title`/`allow`/`allowfullscreen`/`referrerpolicy`, and the container's bounding rect is pixel-identical before and after the swap (zero layout shift) — four screenshots on disk at `/tmp/darlng-phase3/`
- `dist/index.html` static-build checks: zero `<iframe>` elements, zero `i.ytimg.com` references, `qltP16ukVr4` serialized exactly twice (CTA row link + script), `target="_blank"`/`rel="noopener noreferrer"` counts still matched (13/13)

## Task Commits

1. **Task 1: YouTubeFacade component — static thumbnail, accent play button, click-to-iframe script** - `b2d1793` (feat)
2. **Task 2: Mount the facade in the hero and prove the page is third-party-free until click** - `5fffdcf` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `website/src/components/YouTubeFacade.astro` - the facade component: thumbnail + play button + click-to-iframe script
- `website/src/pages/index.astro` - facade mounted in the hero's right grid column / below-CTA-row slot Plan 01 reserved
- `website/src/styles/global.css` - `.facade-play:hover` glow and `.facade-play:focus-visible` 4px-offset rules

## Decisions Made
- Facade panel placed as a sibling of the hero's left content column, relying on the existing flex-col-at-mobile / grid-at-lg wrapper to reposition it per breakpoint, rather than duplicating markup or adding breakpoint-conditional rendering.
- `youtubeEmbed` destructured into a local `const` in frontmatter for unambiguous TypeScript narrowing under strict mode, rather than repeating `latestRelease.youtubeEmbed` inline in the guard expression.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing-critical-functionality, or blocking issues surfaced during execution. The plan's acceptance criteria and verify script passed on the first implementation pass for both tasks.

### Noted, not a deviation from correctness

**1. `agent-browser network requests --filter <host>` reported "No requests captured" instead of filtering the request log**
- **Found during:** Task 2 browser verification, pre-click purity check
- **Issue:** The plan's fallback instruction anticipated this ("If the network sub-command is unavailable in this build, say so explicitly ... and fall back to the iframe assertion plus a `performance.getEntriesByType('resource')` check"). The installed `agent-browser` CLI's `network requests --filter <term>` flag returned "No requests captured" even though `agent-browser network requests` (no filter) correctly listed the full request log for the session.
- **Resolution:** Used the plan's documented fallback: `document.querySelectorAll('iframe').length === 0` plus `performance.getEntriesByType('resource')` filtered in-page for youtube/ytimg/google hosts (returned `[]` at all three viewports), cross-checked against the full unfiltered `agent-browser network requests` output, which showed only `localhost:4321` and inline `data:` URIs across the entire session — no external host of any kind.
- **Files modified:** None (verification-only, no code change).
- **Impact:** None on correctness — the fallback provided equally strong evidence per the plan's own contingency.

---

**Total deviations:** 0 auto-fixed. One documented verification-method substitution per the plan's own stated fallback (not a deviation from the plan, since the plan explicitly anticipated and authorized it).
**Impact on plan:** None — all acceptance criteria and the plan-level `<verification>` block passed as specified.

## Issues Encountered
None beyond the noted verification-method substitution above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- HERO-02 is fully satisfied: the facade ships zero third-party bytes pre-click, autoplays on click via the synchronous-insertion + `allow="autoplay"` pattern, and the hero image remains the LCP element throughout.
- The Phase 5 CSP dependency flagged by both 03-UI-SPEC.md and 03-RESEARCH.md remains open and unaddressed by this plan (correctly — CSP is out of scope for Phase 3): if Phase 5 introduces a `Content-Security-Policy` with a `script-src` directive, `YouTubeFacade.astro`'s inline `<script define:vars>` will need a nonce or hash. No action taken here; noted for Phase 5 planning.
- Manual ad-blocker verification of the post-click failure backstop (the plan's `verification: backstop` truth) was not performed — no ad-blocker extension was available in this automated environment. The CTA row's direct YouTube link (unmodified by this plan) remains the escape hatch by construction; a human should confirm this manually before Phase 3 sign-off if that specific edge case matters for launch.
- No blockers for Plan 03-03 (discography grid) — this plan touched only the hero's already-reserved facade slot and introduced no changes to `releases.ts`, `Layout.astro`, or any file Plan 03-03 depends on.

---
*Phase: 03-core-fan-experience*
*Completed: 2026-08-08*

## Self-Check: PASSED
