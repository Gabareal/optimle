---
title: "Scoring formula"
labels: [wayfinder:grilling]
status: closed
parent: "0011"
blocked_by: ["0012"]
assignee: "gabrielng"
---

## Question

Given exact scores for any Guess (see the research on exact scores), how does a Guess's cost turn into points?
- the per-Round maximum and the Run total (e.g. 100 per Round, 500 per Run)
- the curve from extra Expected guesses (Guess vs optimal, over the state's Candidate set) to points: linear, exponential decay, or tiers such as perfect, great, good, miss
- whether cost is normalised by the state's difficulty, so a 0.05 slip at a 221-Candidate state and at a 3-Candidate state are treated fairly
- whether bonus/flavour labels exist (for example 'found a non-Candidate optimum')
- how it's shown in the end-of-Run breakdown and in the shareable result

Output: the exact formula, with worked examples on real SALET states.

## Resolution

Resolved with gabrielng, 2026-10-18. **Linear points on the absolute extra Expected guesses, with tiers derived from the points.**

**Formula.** A Guess's extra is (its total − the optimal total) ÷ Candidates. It always lies between 0 and 1.0, and every Also-optimal Guess has an extra of 0.

- **points = round(100 × max(0, 1 − extra / 0.5))** per Round. Each 0.005 Expected guesses lost costs 1 point, and +0.5 or worse scores 0.
- A Run is **5 × 100 = 500**. Every Round is worth the same, whatever its turn or Candidate count.
- There are no bonus points. A "found a non-Candidate optimum" label could come later as flavour.

**Tiers** (from the points), with share squares:

| Tier | Points | Extra | Square |
|---|---|---|---|
| Optimal | 100 (extra 0 only) | ±0 | 🟩 |
| Excellent | ≥ 90 | ≤ +0.05 | 🟨 |
| Good | ≥ 70 | ≤ +0.15 | 🟨 |
| OK | ≥ 40 | ≤ +0.30 | ⬛ |
| Miss | < 40 | > +0.30 | ⬛ |

The smallest possible non-zero extra is 1/221 ≈ 0.0045, which scores 99. So 100 always means optimal.

**Worked examples on SALET states** (path-weighted medians from the score files):
- **SALET → all grey** (221 Candidates): the optimal Guess COURD scores 100. The second-best is +0.009 → 98 (Excellent). The best Candidate is +0.014 → 97. A typical Candidate is +0.181 → 64 (Good). A typical random word is +0.489 → 2 (Miss).
- **A 3-Candidate state** (98 of the 283): every Guess is either optimal (100) or at least +0.333 (33, Miss). There's nothing in between, so these Rounds are all or nothing.
- **Across all drawn states:**

| Guess | Turn 2 extra | Points | Turn 3+ extra | Points |
|---|---|---|---|---|
| Best Candidate | +0.047 | ≈ 91 | ±0 | 100 |
| Typical Candidate | +0.24 | ≈ 52 | +0.14 | ≈ 72 |
| Random word | — | ≈ 0 | — | ≈ 0 |

**Rejected:**
- **A steep curve** (exponential, k = 0.15): it punishes near-optimal play too hard. +0.05 would score 72.
- **A gentle curve** (quadratic): +0.15 would score 91, which barely separates good play from great.
- **A zero point of +0.33:** too harsh on reasonable Candidates.
- **Rank or percentile scoring:** too generous at big states, where rank 132 is still within +0.1.
- **Normalising against a Candidate:** undefined wherever every Candidate is optimal.
- **Weighting Rounds by turn or size.**

**Display:** each Round card shows the extra Expected guesses and the Guess's rank among all 12,972. The share text is the total out of 500 plus the five squares.
