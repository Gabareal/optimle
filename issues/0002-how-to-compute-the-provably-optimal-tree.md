---
title: "How to compute the provably optimal tree"
labels: [wayfinder:research]
status: closed
parent: "0001"
blocked_by: []
assignee: ""
---

## Question

How have others computed the **provably optimal** normal-mode Wordle Decision tree (original 2,315 Answers and 12,972 Guesses, minimising average guesses)? Find:

- the algorithms and pruning (exact search, branch and bound, lower bounds, caching) and their reported compute time and hardware
- the published optimal values (SALET 7,920 total) and whether the full optimal trees are downloadable, in what format, and under what licence
- whether the optimal tree is unique, and how ties are reported
- whether a per-node "expected guesses for alternative Guesses" score can be produced cheaply. The visualiser wants to explain why the chosen Guess beats others.

Then recommend one approach: reimplement, adopt an existing solver, or validate a published tree.

## Resolution

**Recommendation:** validate the published tree; adopt Alex Selby's solver offline for alternative-Guess scores; do not reimplement the proof search.

- **Agreed optimum:** SALET, 7,920 total (3.42117 average), max 5 Guesses. Matched independently by Selby, Tseng, Olson, Bertsimas–Paskov (*Operations Research*, 2025) and about 14 leaderboard entrants.
- **Method everywhere:** exact recursion over Candidate sets, with branch-and-bound ("beta cutoff") pruning, fast lower bounds, caching, and heuristic ordering of Guesses.
- **Compute (Selby, 1 core, i7-4930K from 2013):**
  - SALET's exact value: about 1.2 s
  - proving SALET is the best first Guess: about 15 h
  - all 12,972 first Guesses: about 6 days
- **Tree:** `optimaltree.normalmode.txt` in github.com/alex1770/wordle, MIT licence.
  - Plain text, one Path per Answer.
  - Checked locally: 2,315 lines, total 7,920.
  - Still to do: a small validator that recomputes the Feedback patterns.
- **Not unique:** ties are common, e.g. any two-Answer Candidate set. No canonical tie-break exists, so the UI should flag equal-cost alternatives as "also optimal".
- **Per-node alternatives:** Selby's `-w <state>.<guess>` gives exact scores for good Guesses in seconds. Bad Guesses can take hours; `-b` returns a cheap proven ">= bound" instead. Plan: precompute the top K exactly, with bounds for the rest.

Details and sources: [../research/optimal-tree.md](../research/optimal-tree.md)
