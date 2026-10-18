---
title: "Mobile and accessibility"
labels: [wayfinder:prototype]
status: closed
parent: "0001"
blocked_by: []
assignee: "gabrielng"
---

## Question

How does the chosen layout ([Page layout: Board walk plus stats](0008-page-layout-board-walk-plus-stats.md)) work at phone width (360–430 px) and for keyboard and screen-reader users? Prototype and decide:

- **Header:** the top-nav tabs and search on a phone (collapse, bottom tab bar, or scroll).
- **Board walk:** the board stacked above a long pattern list; painting feedback by tap; tile size.
- **Colour-blind support:** whether yellow and green tiles also get a shape or letter, or a high-contrast palette.
- **Keyboard and screen reader:** painting feedback with the keyboard, and screen-reader text for Feedback patterns and graphs.

Extend the existing page-layout prototype.

## Resolution

Resolved with gabrielng, 2026-10-17. **M3, "Menu button", wins.** Prototype asset: [prototype/mobile/PROTOTYPE-mobile.html](../prototype/mobile/PROTOTYPE-mobile.html), opened at phone width with `?variant=M1|M2|M3`. It is generated from the page-layout prototype by `mkmobile.py`.

**Phone layout** (below about 700 px):
- **Header:** a ☰ menu button sits directly beside the "Optimal Wordle tree" title. It opens a dropdown with Explore the tree · Stats · Openers. The tagline is hidden.
- **Search:** the Answer search drops to its own full-width row under the title, at a 16 px font so phones don't zoom in.
- **Explore:**
  - The board stacks above Candidates, which sits above the pattern list. Tiles scale to `min(52px, 15vw)`.
  - The pattern list shows the top 8 patterns with a "Show all N patterns" button. Rows get larger tap targets.
- **Stats and Openers:** the cards stack in one column.
- **Rejected:** M1 (bottom tab bar) and M2 (pattern list as a pull-up sheet).

**Accessibility:**
- **High-contrast palette: not shipped.** The user ruled it out, and the standard green, yellow and grey palette stays.
- **Keyboard painting ships:**
  - Letter tiles on the current row are focusable.
  - G, Y or B sets a colour, Space cycles, ←/→ moves between letters, and Enter applies.
  - Pattern rows and other clickable elements activate with Enter or Space.
  - Focus is visible.
- **Screen-reader labels ship:**
  - Each tile reads as "Letter 1, S, grey…".
  - Each pattern row reads as "yellow, grey, grey, grey, grey: 42 candidates, then MUCHO".
  - The Sections nav marks the current tab with `aria-current`.
