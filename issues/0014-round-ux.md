---
title: "Round UX and end-of-Run breakdown"
labels: [wayfinder:prototype]
status: closed
parent: "0011"
blocked_by: []
assignee: "gabrielng"
---

## Question

What does a Round look like, and what does the end of a Run show? Prototype and react to:
- what the player sees at a Round: the board with the tree's earlier Guesses and their Feedback patterns; whether the Candidate list, the Candidate count, or neither is shown
- the Guess input: on-screen keyboard and/or typing, rejecting words that aren't allowed Guesses, confirming before locking in
- Round progress (1/5 …) and whether a running score shows during the Run (reveals only come at the end)
- the end-of-Run breakdown: per Round, the Game state, your Guess, the optimal Guess(es) and Also-optimal ones, what your Guess cost, the top alternatives, points, and an 'Open in Visualiser' link to that Game state

Use placeholder points where the scoring formula isn't settled. Link the prototype as an asset.

## Resolution

Resolved with gabrielng, 2026-10-18. **Variant A, "Wordle board + keyboard", wins for both the Round and the breakdown.** Prototype asset: [prototype/round-ux/PROTOTYPE-round-ux.html](../prototype/round-ux/PROTOTYPE-round-ux.html), opened with `?variant=A|B|C`, `?cands=none|count|list` and `?seed=…`. Rebuild it with `python3 prototype/round-ux/build.py`. It runs on the real SALET states and the draw procedure from the draw-weighting ticket. Scores are exact only for the solver's top 10; other Guesses get an estimate marked ≈, and points use a placeholder formula.

**A Round:**
- **Layout:** a Wordle-style board. The tree's earlier Guesses are coloured with their Feedback patterns, there is one empty row for the player's Guess, and the remaining rows (up to 6) are faint.
- **Progress:** five pips plus "Round n of 5 · turn t".
- **Candidates:** neither the list nor the count is shown. The player reads the state from the board alone.
- **Input:** an on-screen keyboard and physical typing both work. Keyboard letters take the strongest colour from the earlier rows, as in Wordle.
- **Confirming:** pressing Enter with fewer than 5 letters, or with a word that isn't one of the 12,972 allowed Guesses, shows a message and shakes the row. A valid word asks "Lock in X? Enter again to confirm · ⌫ to edit". The second Enter locks the Guess and moves to the next Round. Locked Guesses can't be changed.
- **During the Run:** progress only. There is no running score, no recap of earlier Guesses and no feedback until the end.

**The end-of-Run breakdown** is a stack of Round cards. A header shows the total (n / 500) and the per-Round emoji grid. Each card has:
- a mini board: the state's rows plus your Guess, uncoloured
- Round number, turn, Candidate count and Path frequency
- the points and a tier label (Optimal, Excellent, Good, OK or Miss: placeholders for the scoring-formula ticket)
- your Guess's cost in Expected guesses, with a cost bar
- the tree's optimal Guess and any Also-optimal Guesses
- a top-5 alternatives table with Expected guesses and the gap to the best, highlighting your Guess if it is listed and tagging Candidates
- "Open in Visualiser →", which links to that Game state's hash (`#salet.P1.g2…`)

**Rejected:**
- **B (worksheet):** all 5 Rounds on one page, editable until you submit. It loses the one-Round-at-a-time feel, and its expandable table is too dense on a phone.
- **C (focus card with a staged reveal):** too bare during the Round, and revealing one Round at a time slows the review.
- Showing the Candidate list (it turns the test into picking the best splitter) or the Candidate count.

**Mobile and accessibility (graduated from fog):** the [Visualiser's Mobile and accessibility decisions](0010-mobile-and-accessibility.md) carry over, with the standard palette and no high-contrast mode. Variant A was checked at 375 px with no horizontal scroll:
- tiles are `min(56px, 14vw)`
- the keyboard is full width, with 54 px keys
- the breakdown cards stack to one column below 560 px

Board rows have screen-reader labels ("CRANE: grey, yellow, …"). Validation and lock-in messages are announced with `aria-live`. Focus stays visible. The keyboard keys are real buttons, so typing, Enter and Backspace work without a mouse.
