---
title: "Exact scores for every Guess at every Eligible Game state"
labels: [wayfinder:research]
status: closed
parent: "0011"
blocked_by: []
assignee: ""
---

## Question

Graded scoring needs the exact Expected guesses (or total) for *any* of the 12,972 allowed Guesses at each of the ~283 Eligible Game states in the SALET tree. Today `alts.salet.json` has only the solver's top 10 per state.

Find out:
- Can Selby's solver (`wordle -w <state> -s -N K`, as the `alts` step uses) score all 12,972 Guesses at a state? How long does that take for all ~283 states?
- Is a full exact score needed for poor Guesses, or would a cheaper bound or approximation do? Examples: a lower bound from group sizes, or exact scores for the top N plus a heuristic for the rest. What error would that introduce into a graded score?
- How big is the resulting data file (raw and gzipped), and can it load lazily in the Ranked trainer only?
- Could the browser compute it instead, and how fast?

Output: a recommended approach for the scoring data, with runtime and file size, so the scoring-formula ticket can rely on it.

## Research

Findings: [Exact scores for every Guess at every Eligible Game state](../research/exact-scores-for-every-guess.md).

The solver scores all 12,972 Guesses exactly at every one of the 283 Eligible Game states (`wordle -w <state> -s -N 12972`). The full run takes about 6 minutes wall time on an M1 with 4 jobs; SALET→BBBBB alone takes 154 s. Bounds and top-N approximations err by up to 0.47 Expected guesses inside the scoring band, on a scale whose whole range is 1.0, so they aren't usable. Recommendation: precompute Uint8 deltas per (state, Guess) and ship them as 283 lazily fetched per-state files (2.6–16 KB gzipped each, about 9 KB per Round, 1.27 MB total). A single binary is the alternative: 3.5 MB raw, 1.0 MB gzipped. An in-browser JS solver also works, at a median of 79 ms per Guess at the largest state, but it is a fallback, not the plan.

## Resolution

Resolved by research, 2026-10-18. **Precompute exact scores for every Guess in the pipeline.** A new step runs `wordle -w <state> -s -N 12972` at each of the 283 Eligible Game states. It takes about 6 minutes with 4 jobs, each in its own working directory. The step stores each Guess's total minus the optimal total (a delta that fits in one byte, since n ≤ 221) in `guesses.json` order, plus the state's optimal total. It asserts that every row is exact and that each row's minimum matches the tree.

The data ships as 283 per-state files that only the Ranked trainer fetches, lazily: about 9 KB gzipped per Round and 1.27 MB in total. A single 1.0 MB gzipped binary is the alternative if one request is preferred. Group-size bounds and top-N approximations are rejected because they err by up to 0.47 Expected guesses on a scale of 1.0. An in-browser solver works but stays a fallback.

Facts the scoring formula can rely on:
- A Guess's cost over optimal is always between 0 and 1.0 Expected guesses.
- At the median state, 206 Guesses are within +0.25 of optimal (972 at SALET→BBBBB).
