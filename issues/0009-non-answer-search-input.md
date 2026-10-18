---
title: "Non-Answer search input"
labels: [wayfinder:grilling]
status: closed
parent: "0001"
blocked_by: []
assignee: "gabrielng"
---

## Question

What does the header Answer search do with each kind of input?
- A valid Guess that isn't an Answer (for example SALET itself): should it explain "never the Answer", or offer to show it as a What-if Guess?
- A non-word, or fewer than 5 letters.
- Autocomplete over the 2,315 Answers, and typo tolerance.
- Whether search results ever lead into the Stats or Openers tabs.

Layout context: [Page layout: Board walk plus stats](0008-page-layout-board-walk-plus-stats.md).

## Resolution

Resolved with gabrielng, 2026-10-17.

1. **A valid Guess that isn't an Answer** (for example SALET or ADIEU):
   - Show "SALET is a valid guess but never the Answer in the original 2,315-word list, so it has no Path."
   - Offer **"Compare it as a What-if Guess here"**, which fills the What-if box at the current Game state on Explore.
   - If the word is on the opener leaderboard, add a line such as "#1 opener · 7,920 total" linking to the Openers tab.
2. **Partial input and non-words:**
   - Fewer than 5 letters: no error, only suggestions.
   - 5 letters that aren't a word: "Not in the word list".
3. **Autocomplete and typos:**
   - Autocomplete: after 2 letters, a dropdown of up to 8 Answers matching the prefix, navigable with the arrow keys and Enter.
   - Typos: for a non-word, "Did you mean …?" with up to 3 Answers one letter away.
4. **Later NYT answers:** no extra word list ships.
   - A later NYT answer that is an allowed Guess is handled as in point 1. The "original 2,315-word list" wording covers the confusion.
   - Otherwise it is "Not in the word list".
5. **Where search lands:** a successful search always switches to **Explore the tree** and updates the URL hash. Stats follows the selected Game state.

**Data:** everything above uses only `answers.json`, `guesses.json` and `openers.json` from [Tree data contract](0005-tree-data-contract.md). No new files.
