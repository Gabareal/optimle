---
title: "Draw weighting and depth schedule feel"
labels: [wayfinder:prototype]
status: closed
parent: "0011"
blocked_by: []
assignee: "gabrielng"
---

## Question

Path frequency is the starting draw weighting, but gabrielng wants to *feel* the alternatives before locking it. Build a throwaway prototype on the real SALET tree with:
- a dial for weight ∝ |Candidates|^α, with α from 0 (uniform over Eligible Game states) to 1 (Path frequency)
- editable turn buckets per Round (default: Rounds 1–2 = turn 2, Rounds 3–5 = turn 3+), plus a 'random depth per Round with set probabilities' mode to compare against
- no-repeat rules within a Run (no repeated state; optionally no repeated turn-2 parent)
- 'draw a Run' and 'draw 1,000 Runs' views, showing which states come up and how often, and how often the big turn-2 states (COURD, DRONE, ROWND) dominate

Output: the chosen weighting, bucket schedule and repeat rules, as an exact sampling procedure that the daily-seed ticket can make deterministic.

## Resolution

Resolved with gabrielng, 2026-10-18. Prototype asset: [prototype/draw-weighting/PROTOTYPE-draw-weighting.html](../prototype/draw-weighting/PROTOTYPE-draw-weighting.html). Rebuild it with `python3 prototype/draw-weighting/build.py`. Its `Draw` module is the pure, liftable logic.

**Decision:** draw by Path frequency, use the fixed turn schedule, and add a no-shared-first-row rule.

**Sampling procedure** (deterministic from a seed):
1. Seed a PRNG. The prototype uses mulberry32 over a string hash; the Daily Run ticket fixes the seed format.
2. For Rounds 1–5 in order, the turn bucket is **turn 2, turn 2, turn 3+, turn 3+, turn 3+**. Turn 3+ means turns 3 and 4.
3. The pool is the Eligible Game states in that bucket, minus any state already drawn in this Run, minus any state whose **first row** (SALET's Feedback pattern) an earlier Round already used. If removing the first rows leaves the pool empty, drop that rule for this Round.
4. Pick one state with weight equal to its Candidate count (Path frequency, α = 1).
5. Optionally draw a uniform Candidate as the dice Answer, for flavour in the end-of-Run breakdown.

**Measured over 1,000 simulated Runs:**
- 282 of the 283 states come up.
- Rounds average 32.9 Candidates.
- Turn 4 is about 1.2% of Rounds.
- SALET → all grey (COURD) appears in 19% of Runs.
- No Run has two Rounds with the same first row; without the rule, 40% of Runs did.

**Rejected:**
- A random turn per Round: with only 6 turn-4 states, a 10% turn-4 chance puts one state in 13% of Runs.
- No buckets: turn 2 becomes 68% of Rounds.
- Uniform weighting: it overtrains rare 3-Candidate states (12.4 Candidates per Round on average).

**Kept as a tuning knob:** weight = Candidates^α, per bucket. Square root (α = 0.5) mostly adds variety at turn 2, where the effective number of states goes from 31 to 69. Retune with the prototype if playtests feel samey.
