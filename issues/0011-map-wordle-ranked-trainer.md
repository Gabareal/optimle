---
title: "Map: Wordle Ranked trainer"
labels: [wayfinder:map]
status: open
---

## Destination

A build-ready spec for the **Ranked trainer**: a sub-site of the existing static site that sits beside the Visualiser. A Run is 5 Rounds. Each Round puts one Eligible Game state from the SALET Optimal strategy to the player, who answers with one Guess and is scored on how close it is to optimal. The spec covers how states are drawn, how Guesses are scored, the Run's UX and end-of-Run breakdown, and how the two sub-sites share one site.

## Notes

- Builds on the Visualiser map ([Map: Wordle optimal-strategy visualiser](0001-map-wordle-optimal-strategy-visualiser.md)), whose decisions still hold: static site with no backend, normal mode, original word lists, the SALET tree, and the data contract. Glossary: [CONTEXT.md](../CONTEXT.md). Use its terms (Run, Round, Eligible Game state, Path frequency).
- Settled at charting (gabrielng, 2026-10-17):
  - The site has two sub-sites: the **Visualiser** and the **Ranked trainer**.
  - **Tree:** SALET only.
  - **Eligible Game states:** not the root, and at least 3 Candidates. That is about 283 states in SALET: 96 at turn 2, 181 at turn 3, 6 at turn 4.
  - **Draw weighting and depth by Round:** see Decisions so far.
  - **Scoring is graded:** points shrink with the extra Expected guesses a Guess costs over optimal, with a floor of 0. Any Also-optimal Guess scores full marks.
  - **Guesses:** any of the 12,972 allowed Guesses. No timer, no hints.
  - **"Ranked" without a backend:** a final score, a personal best and history kept in the browser, and a daily seeded Run (the same states for everyone, with a shareable result) alongside free play.
  - **Reveals come at the end of the Run**, not after each Round: a breakdown per Round with the optimal Guess(es), what your Guess cost, the top alternatives, and an "Open in Visualiser" link to that Game state.
- **Built ahead of the last two tickets** (gabrielng, 2026-10-18): the trainer is coded from the decisions so far. Scoring uses the provisional formula in `packages/core/src/ranked.ts` (`scoreRound`: 100 × max(0, 1 − extra / 0.5), with tiers), which is the one place [Scoring formula](0016-scoring-formula.md) changes. Only free play ships, with a copyable result; [Daily Run and sharing](0017-daily-run-and-sharing.md) adds the Daily Run, history and personal best.
- Skills: grilling and domain-modeling for grilling tickets; prototype for prototype tickets; research for research tickets.
- Tracker: local markdown in `issues/` (see `issues/README.md`).

## Decisions so far

- [Exact scores for every Guess at every Eligible Game state](0012-exact-scores-for-every-guess.md): precompute exact totals for all 12,972 Guesses at all 283 states with Selby's solver (about 6 min), shipped as lazily fetched one-byte-per-Guess delta files (about 9 KB per Round); approximations rejected.
- [Draw weighting and depth schedule feel](0013-draw-weighting-and-depth-schedule.md): Path frequency (weight = Candidates), Rounds drawn from turns 2, 2, 3+, 3+, 3+, no repeated state and no two Rounds sharing a first row; a seeded, deterministic procedure with α kept as a tuning knob.
- [Round UX and end-of-Run breakdown](0014-round-ux.md): one Round at a time on a Wordle board with an on-screen keyboard, no Candidate list or count, Enter twice to lock in, only progress pips during the Run, and an end-of-Run stack of Round cards (cost bar, optimal and Also-optimal Guesses, top-5 alternatives, Open in Visualiser); mobile and accessibility follow the Visualiser's baseline.
- [Sub-site structure](0015-sub-site-structure.md): a Vite multi-page build, with the Visualiser at `/` (still the home page) and the trainer at `/ranked/`, each owning its own hash; a shared header ("Optimal Wordle", sub-site nav) and footer; the trainer's pure logic in `packages/core` and shared UI in `site/src/shared/`; "Open in Visualiser" opens `../#<state hash>?whatif=<guess>` in a new tab; no per-state "Practise this".

## Not yet specified

- **Difficulty tiers or a local rating:** once scoring exists, decide whether anything beyond score and personal best (for example a rating that moves with each Run, or difficulty filters) is worth having.
- **Practising one chosen state:** a "Practise this state" drill from the Visualiser, as a single Round outside Runs. It was deferred at the sub-site structure ticket, not decided.

## Out of scope

- Global leaderboard or online rating: it needs a backend, and the site stays static.
- Other openers' trees: SALET only.
- Hard mode: carried over from the Visualiser map.
- Timed mode: no per-Round timer.
- Real-player frequency weighting: there is no data for it, and it would draw off-tree states the tree can't score.
