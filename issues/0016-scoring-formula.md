---
title: "Scoring formula"
labels: [wayfinder:grilling]
status: open
parent: "0011"
blocked_by: ["0012"]
assignee: ""
---

## Question

Given exact scores for any Guess (see the research on exact scores), how does a Guess's cost turn into points?
- the per-Round maximum and the Run total (e.g. 100 per Round, 500 per Run)
- the curve from extra Expected guesses (Guess vs optimal, over the state's Candidate set) to points: linear, exponential decay, or tiers such as perfect, great, good, miss
- whether cost is normalised by the state's difficulty, so a 0.05 slip at a 221-Candidate state and at a 3-Candidate state are treated fairly
- whether bonus/flavour labels exist (for example 'found a non-Candidate optimum')
- how it's shown in the end-of-Run breakdown and in the shareable result

Output: the exact formula, with worked examples on real SALET states.
