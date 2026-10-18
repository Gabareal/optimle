---
title: "Tree data contract"
labels: [wayfinder:grilling]
status: closed
parent: "0001"
blocked_by: ["0002", "0004", "0003"]
assignee: "gabrielng"
---

## Question

What exactly does the solver emit for the site to load? Settle:

- the per-node fields: Guess, Feedback-pattern edges, Candidate set or its size, Expected guesses, entropy, and alternative-Guess scores if any
- the format: JSON or a compact binary encoding
- the size budget, and whether the data is split or lazy-loaded
- any extra datasets the stats graphs need

This is the seam between the solver and the site.

The site loads several trees: one per curated opener, plus the comparison Strategies. It also loads the leaderboard and the top-K alternative scores (see [Which stats graphs ship](0003-which-stats-graphs-ship.md)).

## Resolution

Resolved with gabrielng, 2026-10-17. All files are JSON, compressed by the host. Every file has a provenance header (see 6).

1. **Bare trees:**
   - Each node ships only its Guess, its Feedback pattern → child map, and whether its Guess solves an Answer there (a `GGGGG` leaf).
   - The browser derives Candidate lists, sizes, Expected guesses and entropy on load. This is proven in the [Tree exploration UX](0004-tree-exploration-ux.md) prototype; see `prototype/tree-ux/convert.py` for the compact shape `[guess, {pattern: child | 0}]`.
   - SALET is about 72 KB raw, roughly 20 KB compressed.
2. **Comparison strategies as per-Answer counts:**
   - Ship the number of guesses each Strategy (Optimal, Greedy-entropy, Answers-only optimal) takes for each of the 2,315 Answers.
   - This drives the overlaid histograms and the Path-view line.
   - Comparison trees are *not* shipped and cannot be walked on the board.
3. **Alternative-Guess scores:**
   - Per node, the top **K = 10** alternative Guesses with exact Expected guesses, each flagged "also optimal" when it ties the chosen Guess.
   - Skipped for nodes with 2 or fewer candidates.
   - One file per opener tree, about 250 KB uncompressed.
4. **Loading:**
   - **Eager:** the SALET tree, both word lists (needed for What-if Guesses), and the comparison counts.
   - **Lazy:** each curated opener's tree and its alternative-score file, loaded when switched to or first needed.
   - **Precomputed, not computed in the browser:** the opener leaderboard (Selby's top 105 exact totals) plus the entropy of all 12,972 Guesses as an opener (about 100 KB).
5. **Format:** plain JSON, no custom binary encoding.
6. **Provenance header in every file:**
   - word-list hashes
   - source (for example "Alex Selby, MIT")
   - total guesses where relevant
   - generation date
   - The site checks a tree's total against its header on load and shows the source credit.

**Files the offline pipeline must produce:**
- `answers.json` and `guesses.json`
- `tree.<opener>.json`, one per curated opener
- `alts.<opener>.json`, one per curated opener
- `strategies.json` (per-Answer counts × 3)
- `openers.json` (top-105 exact totals + entropy for all Guesses)

Exact field names are left to the implementer.
