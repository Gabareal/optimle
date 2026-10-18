---
title: "Page layout: Board walk plus stats"
labels: [wayfinder:prototype]
status: closed
parent: "0001"
blocked_by: []
assignee: "gabrielng"
---

## Question

How do the Board walk (see [Tree exploration UX](0004-tree-exploration-ux.md)) and the stats graphs (see [Which stats graphs ship](0003-which-stats-graphs-ship.md)) share the site? Decide:

- one page or tabs or routes, and where each graph sits relative to the board
- how graphs re-scope as the board moves
- where the What-if Guess input lives
- where the opener switcher lives (curated opener trees)
- where the strategy comparisons appear in the Path view

Extend the existing prototype.

## Resolution

Resolved with gabrielng, 2026-10-17. **Variant B, "Tabs", wins, with the tabs moved into the header's top nav bar.** Prototype asset: [prototype/page-layout/PROTOTYPE-page-layout.html](../prototype/page-layout/PROTOTYPE-page-layout.html). It opens on B; A (long scroll) and C (dashboard rail) are kept for reference via `?variant=`. The source is `layout.html`; placeholder data comes from `stats.py`.

**Header:** title and credit, then the top nav tabs **Explore the tree · Stats · Openers**, then the large Answer search.

**Explore the tree:**
- The Board walk exactly as in [Tree exploration UX](0004-tree-exploration-ux.md): the board with collapsible Candidates on the left, the pattern list on the right.
- The **What-if Guess** box sits at the top of the pattern list. It reads "What if you guessed ___ instead?" and compares the group sizes (as a strip), group count, largest group and bits against the tree's Guess.
- **Strategy comparison:** once an Answer is solved, a line under the board reads "Optimal N · Greedy-entropy N · Answers-only N".

**Stats:**
- Contains the guesses-needed histogram (Optimal against Greedy-entropy; clicking a bar lists its Answers), the hardest Answers, and the letter frequency heatmap.
- A scope line at the top ("Showing SALET › MUCHO (42 candidates) · reset") makes every graph follow the Game state selected in Explore.
- **Hardest Answers** are grouped by the Game state after two guesses that leaves them hard, for example SALET › COURD › GIMPY.

**Openers:**
- Contains the opener switcher (the curated chips) and the leaderboard.
- Switching opener loads that opener's tree and returns to Explore.

**Cross-tab jumps:** clicking any Answer or Game state on Stats, or using the header search, switches to Explore. The tab could also go into the URL alongside the Game state hash; that is left to the implementer.

**Fact found while building:** a placeholder greedy-entropy that only guesses Answers averages 3.599 guesses (8,332 total), against 3.421 for the Optimal strategy.
