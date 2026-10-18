---
title: "Frontend stack"
labels: [wayfinder:grilling]
status: closed
parent: "0001"
blocked_by: ["0004"]
assignee: "gabrielng"
---

## Question

Which framework, visualisation library (D3, visx, Observable Plot, ECharts, and so on) and build tool fit the chosen tree interaction model and the stats graphs, for a static, public site?

Constraint from [Solver implementation choice](0006-solver-implementation-choice.md): the site must be **TypeScript**, because the Feedback and tree-derivation module is shared with the pipeline. The site must also be a static build that loads the JSON files from [Tree data contract](0005-tree-data-contract.md).

## Resolution

Resolved with gabrielng, 2026-10-17.

1. **Framework:** React + Vite, in TypeScript, with a static build.
2. **Charts:**
   - Hand-drawn SVG React components. `d3-scale` and `d3-array` are used for the maths only.
   - No chart library. Click-to-jump is a plain handler.
3. **URL state:**
   - The Game state lives in the URL hash, for example `#salet.YBBBB.mucho.BBBBB`, so every Game state and Answer Path is a shareable link and the back button rewinds.
   - No router library and no server rewrites.
4. **Repo shape:** a pnpm workspace with three packages:
   - `core`: Feedback patterns and tree derivation, shared by the other two
   - `pipeline`: Node scripts plus the pinned Selby submodule
   - `site`
5. **Styling:** plain CSS with custom-property tokens, lifted from the [Tree exploration UX](0004-tree-exploration-ux.md) prototype, plus dark mode.
6. **Testing:**
   - Vitest on `core`: Feedback-pattern edge cases such as repeated letters, and derived stats that reproduce 7,920.
   - The tree validator runs in CI.
   - No end-to-end browser tests for now.
7. **Hosting:** GitHub Pages, deployed by a GitHub Action. This assumes the repo lives on GitHub; if not, Cloudflare Pages.
