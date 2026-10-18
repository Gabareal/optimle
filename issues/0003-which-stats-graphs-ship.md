---
title: "Which stats graphs ship"
labels: [wayfinder:grilling]
status: closed
parent: "0001"
blocked_by: []
assignee: "gabrielng"
---

## Question

Besides the Decision tree, which interactive Wordle stats graphs does the site ship, and what can a visitor do with each? Candidates to grill:

- the distribution of guess counts under the Optimal strategy
- best openers ranked by Expected guesses or entropy
- letter frequency by position across Answers
- Feedback pattern distribution for any chosen Guess
- the hardest Answers (longest Paths)

For each graph that ships, decide what it shows, how it is interacted with, and whether it needs data beyond the optimal tree.

## Resolution

Resolved with gabrielng, 2026-10-17.

1. **The graphs that ship:**
   - guess-count distribution
   - opener leaderboard
   - Feedback-pattern breakdown
   - hardest Answers
   - letter frequency by position, as an extra

   Candidate-set shrinkage is dropped, because the pattern breakdown already shows it.
2. **Placement:** global by default. Every graph re-scopes to the selected Game state, for example the subtree's guess-count distribution or that node's Guess in the pattern breakdown. Clicking a bar or an Answer jumps into the tree.
3. **What-if Guess:**
   - At any node, the visitor can type any allowed Guess and see how it splits the Candidate set, with its entropy, next to the tree's choice. This is computed in the browser, which is cheap.
   - Exact Expected guesses are shown only for the top-K alternatives precomputed offline per node. The rest get proven lower bounds or nothing.
   - Ties with the chosen Guess are labelled "also optimal".
4. **Opener leaderboard:** Selby's top 105 proven-exact totals, plus an entropy-sorted view for any word, labelled as a heuristic.
5. **Other openers' trees:** the tree explorer can switch between the optimal trees of a curated set. The default set is SALET, CRANE, SLATE, TRACE, CRATE, ADIEU, AUDIO and ROATE.
6. **Strategy comparisons:**
   - Three strategies are compared: the Optimal strategy, Greedy-entropy, and Answers-only optimal (the optimal tree when only Candidates may be guessed).
   - They are shown as overlaid guess-count histograms with averages, plus per-Answer guess counts in the Path view.
7. **Hardest Answers:** the 41 Answers that take 5 guesses, ranked by Path length and grouped into families (_IGHT, _ATCH and so on) with an explanation.

**Data implications for the tree data contract and the solver:**
- curated opener trees
- a Greedy-entropy tree
- an Answers-only optimal tree
- top-K exact alternative scores per node
- the opener leaderboard table
