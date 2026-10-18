---
title: "Sub-site structure"
labels: [wayfinder:grilling]
status: closed
parent: "0011"
blocked_by: []
assignee: "gabrielng"
---

## Question

How do the Visualiser and the Ranked trainer share one static site on GitHub Pages?
- URLs: separate paths (e.g. `/` and `/ranked/`, a Vite multi-page build) or one SPA with hash routes. The Visualiser already keeps the Game state in the URL hash.
- A landing page, or does the Visualiser stay the home page?
- Shared chrome: a title, top nav between the two sub-sites, and the footer credits
- Shared code and data: what moves into `packages/core` (Feedback, tree derivation) or a shared UI package; the trainer loads only the SALET tree and the scoring data
- Deep links: the format of the end-of-Run 'Open in Visualiser' link, and whether the Visualiser links back ('Practise this')

Output: the routing and build layout and the cross-link format.

## Resolution

Resolved with gabrielng, 2026-10-18. **The site is a Vite multi-page build. The Visualiser stays at `/` and the Ranked trainer lives at `/ranked/`. Each page owns its own URL hash.**

**Routing and build:**
- `packages/site/index.html` is the Visualiser and `packages/site/ranked/index.html` is the trainer, both listed under `build.rollupOptions.input`. Each has its own entry and bundle, so the trainer never downloads Visualiser-only code (d3, Stats, Openers).
- `deploy.yml` doesn't change, because it still uploads `packages/site/dist`. The relative `base: './'` stays.
- **Required fix:** `data.ts` builds data URLs from `import.meta.env.BASE_URL` (`./`), which resolves against the page. On `/ranked/` that becomes `/ranked/data/…` and 404s. Resolve `data/` against the site root instead, for example a per-page root constant (`./` on the Visualiser, `../` on the trainer) or `new URL('../data/', import.meta.url)` from a module that sits at a known depth in the build.
- Rejected: one SPA with hash routes (`#ranked/…`). It would merge two hash grammars into one namespace and one `App`, and the trainer would ship the whole Visualiser.

**Home:** the Visualiser stays the home page, so every existing `#salet.…` link keeps working. There is no landing page.

**Shared chrome:**
- **`SiteHeader`:** the site title **"Optimal Wordle"** plus the sub-site nav "Visualiser · Ranked trainer", with `aria-current` on the current page. It appears on both pages.
- **Visualiser only:** its section tabs (Explore / Stats / Openers), Opener search and tagline, below the header.
- **`SiteFooter`:** the credits (tree source, Selby/MIT, optimality citations, word lists), shared by both pages. The trainer adds a line that its scores come from Selby's solver.

**Shared code:**
- **`packages/core`:** the trainer's pure logic, tested with vitest. That covers the seeded draw procedure, scoring, and parsing the per-state score files. Feedback and tree derivation are already there.
- **`packages/site/src/shared/`:** shared UI (header, footer, `Tiles`/board rows, the `once`/`getJson` loader). It sits beside `src/visualiser/` (today's code, moved) and `src/ranked/`, in one site package.
- **What the trainer loads:** only the word lists (to check Guesses), `tree.salet.json` and its per-state score files. It doesn't load alternatives files, openers or Strategy counts.
- **Rejected:** a separate `packages/ui` workspace package, and a separate `packages/ranked` app copied into `dist/`. Neither earns its keep with one Vite build.

**Cross-links:**
- **"Open in Visualiser"** (each end-of-Run Round card) is a relative link that opens in a new tab, so the breakdown stays: `../#salet.P1.g2.P2.g3…?whatif=<guess>`. The state part is the Visualiser's existing Explore hash, with no solved flag.
- **The `?whatif=` suffix** is a new, optional part of the Visualiser hash. It pre-fills the What-if Guess with the player's Guess at that Game state. The current parser already ignores it, because it lands in a Guess token, which the tree fixes anyway. `formatHash` doesn't emit it.
- **"Practise this":** none for now. The Visualiser links to the trainer only through the header nav. A one-Round drill at a chosen state is recorded on the map as not yet specified. Seeding a Run to include a chosen state is rejected, because it bends the draw rules from 0013.

**The trainer's hash:** empty during free play. The URL carries no Run state, so it can't leak or edit the Rounds. The Daily Run ticket (0017) owns any shareable forms (Daily, seeded). A Run in progress survives a reload through browser storage, not the URL.
