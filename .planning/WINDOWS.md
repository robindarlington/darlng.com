---
schema_version: 1
RESOLVED_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-08T13:32:01.619Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 03 | deviation | website/src/components/Header.astro |  | Pre-existing Phase-2 header social-nav overflow: at 375px viewport, wordmark+5 icon row (252px+wordmark ~133px) exceeds the 343px content width, causing document scrollWidth 401 vs clientWidth 375 (26px horizontal overflow) on every page including / and /listen/*. Reproduced independently on /404 (untouched by Phase 3 Plan 01) confirming it predates this plan. Not fixed here per plan 03-01's explicit Header.astro 'unchanged by contract' scope and the scope-boundary deviation rule; needs a Phase-2-owned responsive fix (e.g. wrap fallback or smaller mobile wordmark). | open |  | 2026-08-08T13:32:01.619Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "03",
    "file": "website/src/components/Header.astro",
    "line": null,
    "description": "Pre-existing Phase-2 header social-nav overflow: at 375px viewport, wordmark+5 icon row (252px+wordmark ~133px) exceeds the 343px content width, causing document scrollWidth 401 vs clientWidth 375 (26px horizontal overflow) on every page including / and /listen/*. Reproduced independently on /404 (untouched by Phase 3 Plan 01) confirming it predates this plan. Not fixed here per plan 03-01's explicit Header.astro 'unchanged by contract' scope and the scope-boundary deviation rule; needs a Phase-2-owned responsive fix (e.g. wrap fallback or smaller mobile wordmark).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-08T13:32:01.619Z",
    "resolved_at": null
  }
]
````

> Entry #1 RESOLVED 2026-08-08: header 375px overflow (caused by the 24px wordmark close-out fix) — wordmark now text-xl/tracking-normal at base, text-2xl/tracking-wide from md:; icon gap-1 at base. Verified scrollWidth=375 on / and /404.
