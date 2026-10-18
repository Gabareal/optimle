---
title: "Map: Wordle optimal-strategy visualiser"
labels: [wayfinder:map]
status: open
---

## Destination

A build-ready spec for a public static website that shows the provably optimal Wordle decision tree. Visitors can click into any Game state, enter an Answer to see its Path, and explore interactive Wordle stats graphs. The spec also covers the offline solver that produces that tree.

## Notes

- Domain: Wordle, decision theory (one-player; the Answer is fixed, uniformly random). Glossary: [CONTEXT.md](../CONTEXT.md). Use its terms.
- Settled at charting:
  - Objective: minimise **average** guesses over all Answers. No worst-case cap.
  - Lists: original 2,315 Answers and 12,972 allowed Guesses. Keep the lists swappable.
  - Normal mode only (hard mode is out of scope). Any allowed word may be guessed, not only Candidates.
  - Must be **provably optimal**. Validate against the published SALET result (7,920 total guesses, about 3.4212 average).
  - Static site, no backend. The tree is precomputed offline and shipped as data.
  - Audience: anyone. The goal is a visual, interactive way to show the optimal solution.
  - Explanations show expected guesses, entropy, and the distribution of group sizes a Guess splits the Candidates into.
- Skills: grilling and domain-modeling for grilling tickets; prototype for the tree UX; research for research tickets.
- Tracker: local markdown in `issues/` (see `issues/README.md`).

## Decisions so far

- [How to compute the provably optimal tree](0002-how-to-compute-the-provably-optimal-tree.md): don't reimplement. Validate Selby's MIT-licensed SALET tree (7,920) and use his solver offline for alternative-Guess scores. Ties are common.
- [Which stats graphs ship](0003-which-stats-graphs-ship.md): five graphs, global and re-scoped to the selected node; what-if split and entropy computed in the browser; curated opener trees; comparison against Greedy-entropy and Answers-only optimal.
- [Tree exploration UX](0004-tree-exploration-ux.md): Board walk. A Wordle board where visitors paint feedback onto the letters (or pick from the pattern list), rewind by clicking rows, with bits explained and Candidates collapsible.
- [Tree data contract](0005-tree-data-contract.md): bare JSON trees with stats derived in the browser; comparison Strategies as per-Answer counts; top-10 alternatives per node; SALET loaded eagerly, other openers lazily; provenance header on every file.
- [Solver implementation choice](0006-solver-implementation-choice.md): a TypeScript pipeline drives a pinned copy of Selby's C++ solver for all opener trees; Feedback logic is shared with the site; every tree is validated; generated JSON is committed; Greedy-entropy is our own.
- [Frontend stack](0007-frontend-stack.md): React + Vite + TypeScript with hand-drawn SVG charts; Game state in the URL hash; a pnpm workspace (core/pipeline/site); plain CSS tokens; Vitest on core; GitHub Pages.
- [Page layout: Board walk plus stats](0008-page-layout-board-walk-plus-stats.md): top-nav tabs Explore the tree · Stats · Openers; What-if box on the pattern list; stats scoped to the selected Game state; comparisons appear under the board once solved.
- [Non-Answer search input](0009-non-answer-search-input.md): a non-Answer Guess gets an explanation plus a 'compare as What-if' action (and leaderboard rank if it has one); autocomplete after 2 letters; 'Did you mean' for typos; no extra word list.
- [Mobile and accessibility](0010-mobile-and-accessibility.md): on phones the tabs go behind a ☰ menu beside the title, the layout is stacked, and the pattern list shows the top 8 first; keyboard painting and screen-reader labels ship; no high-contrast mode.

## Not yet specified

_Nothing left: the way to the destination is clear (2026-10-17)._

## Out of scope

- Play-along assistant (live best-next-guess for the user's own game): dropped at charting by the user.
- Adversarial or Absurdle-style play: one-player optimisation only.
- Hard mode: ruled out by gabrielng on 2026-10-17. It would need its own trees, solver runs and UI rules; normal mode only.
