---
title: "Daily Run and sharing"
labels: [wayfinder:grilling]
status: open
parent: "0011"
blocked_by: ["0013", "0016"]
assignee: ""
---

## Question

How do the Daily Run and free play work, and what gets shared and remembered?
- the daily seed: derive the 5 states deterministically from the date using the sampling procedure from the draw-weighting prototype; when the day starts (UTC or local midnight); and whether Daily Runs are numbered like Wordle's
- one attempt per Daily Run; free play is unlimited
- the shareable result text: a score plus a per-Round emoji or grid, with no spoilers
- what the browser keeps: personal best, history, streaks, and whether today's Daily Run is done
- what happens when the data changes (e.g. a regenerated tree) to past seeds and history

Output: the Daily Run spec, the share format and the stored-data shape.
