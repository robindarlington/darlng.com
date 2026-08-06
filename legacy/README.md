# Legacy 2019 Placeholder

This directory holds the archived 2018-2019 DARLNG placeholder site (Grunt/SCSS/jQuery),
moved out of the repo root during the Phase 1 infrastructure cutover so `website/` is
unambiguously the live site.

It is retained for reference only, is outside the Docker build context (`website/.dockerignore`
scopes builds to `website/`, and Coolify's Base Directory is set to `website/`), and is never
served by the current site. Deleting this tree entirely is deferred to milestone cleanup by
explicit decision (see `.planning/phases/01-infrastructure-deploy/01-CONTEXT.md`, Deferred Ideas).
