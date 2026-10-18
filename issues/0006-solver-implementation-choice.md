---
title: "Solver implementation choice"
labels: [wayfinder:grilling]
status: closed
parent: "0001"
blocked_by: ["0002"]
assignee: "gabrielng"
---

## Question

Given what the optimal-tree research recommends, how is the solver built? Decide:

- reimplement, wrap an existing solver, or ingest a published tree
- the language and runtime, and the compute budget
- how optimality is verified (match 7,920 for SALET, plus an independent re-score of the tree over all 2,315 Answers)
- how the solver is rerun when the word lists are swapped
- what the offline pipeline must also produce: the curated opener trees, a Greedy-entropy tree, an Answers-only optimal tree, top-K exact alternative scores per node, and the top-105 opener leaderboard (see [Which stats graphs ship](0003-which-stats-graphs-ship.md))
- how equal-cost ties are chosen and flagged as "also optimal"
- the pipeline's output files and their shapes are fixed by [Tree data contract](0005-tree-data-contract.md): word lists, opener trees, alternative scores (K = 10), per-Answer Strategy counts, and the openers table, each with a provenance header

## Resolution

Resolved with gabrielng, 2026-10-17.

1. **Every opener tree is generated with Selby's solver,** SALET included, on the original lists (`-a wordlist_orig_all -h wordlist_orig_hidden`).
   - Using one source and one tie-break rule keeps the trees consistent.
   - Selby's published `optimaltree.normalmode.txt` is used only as an independent cross-check: our SALET must total 7,920.
2. **The pipeline glue is TypeScript on Node.**
   - The Feedback-pattern function and the tree-derivation code (Candidates, Expected guesses, entropy) live in **one module shared with the site**.
   - This commits the frontend to TypeScript.
3. **Selby's `alex1770/wordle` is a git submodule pinned to an exact commit,** built by a script.
   - The commit hash goes into each file's provenance header.
   - His MIT licence and credit are kept in the repo and on the site.
4. **Verification:**
   - Every pipeline run and every CI run validates every tree:
     - Feedback patterns recomputed
     - each node's groups partition its Candidate set
     - every Answer appears exactly once
     - the total matches the header
   - Optimality of SALET as opener is **cited**, not re-proven (Selby, Tseng, Olson, Bertsimas–Paskov; see [How to compute the provably optimal tree](0002-how-to-compute-the-provably-optimal-tree.md)).
5. **Comparison Strategies:**
   - **Answers-only optimal:** Selby's solver with the allowed-Guess list set to the 2,315 Answers. *Assumption to verify while building:* that his list flags allow this.
   - **Greedy-entropy:** our own TypeScript implementation. It takes the highest-entropy Guess at each Game state; ties go first to Candidates, then alphabetically.
6. **When it runs:** by hand, with the generated JSON committed to the repo. CI runs only the validator, so the site build stays fast and deterministic.
7. **Compute budget:**
   - K = 10 alternative scores per node across about 8 opener trees, in one overnight local run with the solver's `-b` cutoffs.
   - Fallback if it's too slow: K = 10 at depth 1–2 and K = 5 deeper.
   - The pipeline reruns when the word lists are swapped.

**Verified while building (2026-10-17):**
- The Answers-only assumption holds. `wordle -a wordlist_orig_hidden -h wordlist_orig_hidden` runs, because the solver builds its Guess list as the Answers plus `-a`. An exhaustive, proven search over all 2,315 first Guesses took about 15 minutes on one core and found SLATE, 7,973 total (3.4441 average).
- This restricts Guesses to the Answers, not to the current Candidates as CONTEXT.md's definition of Answers-only optimal says. The site follows this ticket; the glossary wording still needs a decision.
- K = 10 alternatives for all eight curated openers took under a minute, not a night, so no fallback was needed.
