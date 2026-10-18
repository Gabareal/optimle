---
title: "Tree exploration UX"
labels: [wayfinder:prototype]
status: closed
parent: "0001"
blocked_by: []
assignee: "gabrielng"
---

## Question

How should a visitor explore a Decision tree with 2,315 leaves, a root fan-out of roughly 150 Feedback patterns, and a depth of up to 6? Prototype and react to:

- the layout: collapsible tree, icicle or sunburst, or drill-down with breadcrumbs
- what a Game state's detail panel shows: Guess, Candidate set, group-size distribution, entropy, Expected guesses
- how entering an Answer highlights its Path

Link the prototype as an asset. Output the chosen interaction model and the data each node view needs.

## Resolution

Resolved with gabrielng, 2026-10-17. **Variant C, "Board walk", wins.** Prototype asset: [prototype/tree-ux/PROTOTYPE-tree-ux.html](../prototype/tree-ux/PROTOTYPE-tree-ux.html). Variants A (Miller columns) and B (zoomable icicle) are kept there for reference; open it with `?variant=A|B|C`. The source is in `template.html` and `convert.py`.

**Interaction model:**
- A Wordle board shows the Path so far, one row per Guess. Clicking an earlier row rewinds to it. The page intro says only "Click a row to rewind."
- **Painting feedback:** the visitor clicks letters on the current row to cycle grey → yellow → green.
  - Live text below the board says how many candidates give this feedback, or "No remaining candidate gives this feedback".
  - **Go →** steps forward.
- **Pattern list on the right:** headed "Tree plays <GUESS>", with a subline "N candidates split into G groups · largest L".
  - Every Feedback pattern is listed with its group size as a bar and the next Guess ("then COURD").
  - Clicking a pattern steps forward. The pattern currently painted on the board is highlighted in the list.
- **Stats under the board:** candidates, Expected guesses, and bits, with a **?** explainer (each bit halves the candidates on average, and how bits differ from Expected guesses). Group count and largest group are *not* shown here, because the list header already has them.
- **Candidates:** a collapsible panel below the board. It opens automatically when there are fewer than 10 candidates, and the visitor can toggle it.
- **Answer search:** a large input. Entering an Answer jumps the board to its full Path, all rows coloured. Animating the Path was not chosen, so it is a polish option. A non-Answer word shows "X is not an Answer"; the fuller behaviour stays in Not yet specified.

**Data each Game state view needs:**
- the Guess
- each Feedback pattern → child size and next Guess
- whether this Guess solves an Answer here
- the Candidate list
- Expected guesses and entropy

The prototype derives all of these in the browser from the bare tree.

**Facts found while building:**
- Selby's tree converts to about 72 KB of compact JSON.
- An independent check confirms all 2,315 Answers appear once, every Feedback pattern recomputes correctly, and the total is 7,920.
