# Exact scores for every Guess at every Eligible Game state

Research for ticket 0012. Scope: the SALET tree, normal mode, original lists (2,315 Answers, 12,972 Guesses), and the 283 Eligible Game states (not the root, at least 3 Candidates). Researched 2026-10-18 on an Apple M1 (8 cores: 4 performance, 4 efficiency) using the pinned solver binary (`packages/pipeline/.solver/wordle`, commit `8fd3f1b`).

"Total" means what the solver prints: total Guesses from this Game state onward, summed over its Candidate set, counting this Guess. Expected guesses = total ÷ Candidates. "Delta" means a Guess's total minus the optimal total at that state.

## TL;DR

- **Yes, the solver scores every Guess exactly.** Running `wordle -w <state> -s -N 20000` (any `-N` of at least 12,972) printed an exact total for all 12,972 Guesses at every one of the 283 states. No result was a `>=` bound and none was infinite. [measured; source §1]
- **Runtime:**
  - The whole set took **5 min 42 s wall time** with 4 parallel jobs (1,368 CPU-seconds summed, inflated by contention).
  - The biggest state, SALET→BBBBB with 221 Candidates, takes **154 s** on its own.
  - States with 25 or fewer Candidates take under 0.4 s each. That covers 261 of the 283 states.
- **Approximations aren't good enough.** The group-size lower bound is off by up to 0.47 Expected guesses for Guesses within +0.5 of optimal (p90 0.16). The whole scale from best to worst Guess is at most 1.0 Expected guesses. "Exact top-10 plus a heuristic" also fails: at the median state, 206 Guesses are within +0.25 of optimal, so most good Guesses fall outside the top 10. Exact data is cheap, so there is no reason to approximate.
- **Size:**
  - One delta per (state, Guess) fits in a byte, because every delta is between 0 and n ≤ 221.
  - One binary file: **3.5 MB raw, 1.0 MB gzip, 0.95 MB Brotli**.
  - As 283 per-state JSON files: 2.6–16 KB gzipped each, **about 9 KB per Round** at Path-frequency weighting.
  - Either way it loads lazily, because the site already `fetch`es its data at runtime.
- **The browser could compute it.** A plain-JS exact solver of about 100 lines matched Selby on every Guess I checked. Scoring one Guess takes a median of 79 ms at the biggest state, with the slowest seen around 1.5 s, plus about 250 ms of setup. It works as a fallback, but precomputing is simpler and authoritative.
- **Recommendation:** precompute in the pipeline and ship per-state delta files that the Ranked trainer loads lazily. Details at the end.

## 1. Can Selby's solver score all 12,972 Guesses?

Yes, with the same flags the `alts` step uses, but with `-N` set to cover the full Guess list.

How the solver handles it:
- `-N` caps how many Guesses are tried at the top level only. It is applied after the solver sorts every Guess by its heuristic (`thr=n0th` at top level; `wordle.cpp` lines 906–913, option parsing at line 1278). With `-N` ≥ 12,972, every allowed Guess is tried.
- `-s` sets `showtop`, so the top-level call runs with `toplevel = 2` (`wordle.cpp` lines 950 and 968). Under `toplevel = 2`:
  - the "perfect split" and lower-bound early exits are skipped (they are guarded by `toplevel<2`, lines 835–905), and
  - beta is not tightened after each Guess (`if(toplevel<2)beta=tot;`, line 752).
- Each Guess is therefore evaluated with beta = infinity. Its printed total is exact, and the `>` marker never appears (line 742). This matches the comment in `packages/pipeline/src/alts.ts`.
- The default 6-Guess limit (`maxguesses=6`, line 69) never bit:
  - no total was infinite, and
  - the worst delta at every state was exactly n, the cost of a Guess that reveals nothing, such as TESTS after SALET→BBBBB.
- For the non-root states this tree has, the delta of any Guess is therefore in [0, n]. In Expected guesses it is in [0, 1.0].

Checks on the output:
- All 283 × 12,972 = 3,671,076 totals are exact.
- At every state, the best total equals the tree's own Guess's total and the first entry of `alts.salet.json`.

### Measured runtime

| State | Candidates | Time |
|---|---|---|
| salet.YYYBB | 8 | 0.05 s |
| salet.BBBBB | 221 | 154 s on its own (235 s while 3 other jobs ran) |
| salet.BBBYB | 165 | 225 s (4 jobs at once) |
| salet.BBBGB | 107 | 183 s (4 jobs at once) |
| salet.BYBYB | 83 | 151 s (4 jobs at once) |
| 153 states with 3–5 Candidates | | 0.12 s average |
| 108 states with 6–25 Candidates | | 0.35 s average |
| 18 states with 26–100 Candidates | | 33 s average |
| **All 283 states, 4 parallel jobs** | | **342 s wall, 1,368 CPU-s summed** |

- The four states with over 100 Candidates take up most of the time.
- With `--jobs 4` the run finishes in about the time of its slowest state plus some. More jobs won't help much because the slowest state is a single process.
- Why it's fast: per-Guess work is cheap once the solver's in-process cache of sub-state values is warm. Scoring one Guess cold at SALET→BBBBB (`-w salet.BBBBB.<guess>`) takes 0.07–0.21 s for COURD, ZYMES, FUZZY, QAJAQ and TESTS.

### Beta cutoff (`-b`) isn't worth it

I ran SALET→BBBBB with a fixed cutoff `-b`, which gives exact totals below the cutoff and `>=` above it:
- `-b 664` (best + 0.25 × n) took 44.5 s, with 12,070 of 12,972 Guesses bounded.
- `-b 720` (best + 0.5 × n) took 181.6 s, with 6,224 bounded.

Both ran alongside the 4-job batch, so the times are only rough. Either way, the saving is small next to a 6-minute full run, and the result is less useful.

## 2. Is an exact score needed for poor Guesses?

What a graded score needs: ticket 0011 says points shrink with the extra Expected guesses over optimal, down to a floor of 0. So the score needs the delta accurately wherever points are above 0, plus a reliable "past the floor" signal everywhere else.

### Lower bound from group sizes

This is the bound the solver uses itself (`wordle.cpp` lines 863–886):

> total ≥ n + Σ over non-GGGGG groups of (2·|group| − 1)

Each Candidate costs 1 for this Guess. Then each Candidate in a group needs at least 2 more Guesses, except one per group, which might be found with the next Guess.

How the bound compares with the exact totals, in Expected guesses:

| Guesses compared | Count | Bound exact | p50 error | p90 | p99 | max |
|---|---|---|---|---|---|---|
| within +0.25 of optimal | 116,117 | 83% | 0 | 0.082 | 0.184 | 0.318 |
| within +0.5 of optimal | 911,001 | 70% | 0 | 0.163 | 0.333 | 0.467 |
| all | 3,671,076 | 61% | 0 | 0.286 | 0.449 | 0.832 |

- The bound is only ever too low, so it makes Guesses look better than they are.
- The bound is exact mostly at small states, where exact totals are cheap anyway. Its large errors are at the big, frequently drawn states. At SALET→BBBBB it is never exact: median error 0.32, max 0.76.
- Example: with a linear curve from 100 points at +0 to 0 points at +0.5, a 0.16 error (p90 inside the scoring band) is about 33 points out of 100 for a Round. That is not acceptable for a "ranked" score.

### Exact top-N plus a heuristic

- The solver's heuristic order puts the best Guesses first, but the band of good Guesses is wide:
  - The number of Guesses within +0.25 Expected guesses of optimal is 2 at the smallest state, 206 at the median, and 4,220 at the largest.
  - At SALET→BBBBB, 972 Guesses are within +0.25 and 6,748 within +0.5.
- With top-10 (today's `alts.salet.json`), most reasonable Guesses a player types would get the heuristic value. The errors above would apply to exactly the Guesses where grading matters most.
- Raising N until the band is covered costs nearly the same as scoring all 12,972, since the expensive part is the large states either way.

**Conclusion:** score everything exactly. It is cheap (§1), and both approximations introduce errors as large as the grading scale.

## 3. Data file size and lazy loading

Facts that shape the format:
- Every delta is an integer in [0, n], and n ≤ 221, so one unsigned byte per (state, Guess) is lossless.
- The optimal total per state is already in `alts.salet.json` and the tree, so storing deltas is enough. Total = optimal + delta.
- Index Guesses in the order of `guesses.json`, which is the solver's `wordlist_orig_all` order and already shipped.
- 25.7% of all entries equal n exactly. These are Guesses that reveal nothing at that state.

Sizes, measured on the full output:

| Format | Raw | gzip -9 | Brotli 11 |
|---|---|---|---|
| JSON `{path: [total, …]}` | 9.65 MB | 1.27 MB | 1.12 MB |
| JSON `{path: [best, [delta, …]]}` | 7.69 MB | 1.20 MB | 1.07 MB |
| Binary Uint8 deltas, state-major (283 × 12,972) | 3.59 MB | 1.03 MB | 0.95 MB |
| Binary Uint8 deltas, Guess-major | 3.59 MB | 1.38 MB | 0.90 MB |
| 283 per-state JSON files `[best, [delta, …]]` | 26–47 KB each | **2.6–16 KB each (1.27 MB total)** | |
| Sparse JSON, only Guesses within +0.25 (rest "≥ cap") | 1.04 MB | 0.28 MB | |
| Sparse JSON, within +0.5 | 8.2 MB | 2.3 MB | |

- Sparse storage only pays off with a tight cap (+0.25 or less). It also fixes the scoring floor into the data, so the scoring-formula ticket couldn't move it later. Dense storage is simpler and leaves the curve open.
- With per-state files, a Round fetches only its own state. At Path-frequency weighting the mean is **8.7 KB gzipped per Round**, so about 45 KB for a 5-Round Run. The largest file (SALET→BBBBB) is 16 KB gzipped.
- Lazy loading already works:
  - `packages/site/src/data.ts` loads everything via `fetch(`${BASE_URL}data/<file>`)` at runtime from `public/data/`.
  - A trainer-only file under `public/data/` is never bundled and is only requested when the trainer asks for it.
  - The Visualiser is unaffected.
- The same per-state row also yields the end-of-Run reveal's "top alternatives" by sorting the row, so no separate alts file is needed for the trainer.

## 4. Could the browser compute it instead?

I wrote a minimal exact solver in plain JavaScript (scratch only, about 100 lines). It is the same recurrence as Selby's: memoised by Candidate subset, Guesses ordered by the group-size bound, and partial sums cut off at beta. I ran it under Node 22, which uses V8, the same engine as Chrome.

The browser only needs **the one Guess the player typed** per Round, not all 12,972. Cost per Round:
- Building the feedback table for the state's Candidates against all 12,972 Guesses takes 250 ms at 221 Candidates and 3 ms at 5 Candidates.
- Then it scores the one Guess.

| State | Candidates | Table | Scoring one Guess, cold (30–40 random Guesses) | Matches Selby |
|---|---|---|---|---|
| salet.BBBBB | 221 | 244 ms | p50 79 ms, p90 177 ms, max 611 ms | 40/40 |
| salet.BBBYB | 165 | 110 ms | p50 35 ms, p90 63 ms, max 167 ms | 40/40 |
| salet.BYBYB | 83 | 56 ms | p50 19 ms, max 66 ms | 40/40 |
| salet.YYYBB | 8 | 8 ms | ≤ 4 ms | 40/40 |
| a turn-4 state | 5 | 3 ms | ≤ 1 ms | 30/30 |

- Hand-picked bad Guesses at SALET→BBBBB were the slowest: QAJAQ took 1.5 s and TESTS 1.1 s.
- Proving the optimum itself took 1.6 s.
- Expect phones to be roughly 3–5× slower. That is a few seconds in the worst case, which is acceptable at the end of a Run but needs a Web Worker.

It's feasible, but it means maintaining a second solver whose correctness rests on spot checks. It also has a few edge cases to get right: the 6-Guess limit, and the GGGGG group. Precomputing with the solver that already proved the tree costs about 6 minutes per pipeline run and about 9 KB per Round. Keep the JS solver as an option only if per-Guess data ever becomes too large, for example if trees for several openers were added to the trainer.

## Recommendation

Add an exact-scores step to the pipeline:
- **Command:** for each Eligible Game state, run `wordle -w <state> -s -N 12972`. This is the existing `alts` invocation with K = the full Guess list.
- **Runtime:** about 6 minutes wall time on an M1 with 4 jobs. SALET→BBBBB alone takes 154 s.
- **Output:** for each state, its optimal total and a Uint8 delta per Guess in `guesses.json` order.
- **Packaging:** ship as 283 per-state files in `public/data/` that the Ranked trainer fetches when a Round needs them:
  - 2.6–16 KB gzipped each, about 9 KB per Round on average, 1.27 MB total;
  - or a single 1.0 MB (gzip) binary if one request is preferred.
- **Checks:** assert every row is exact, every delta is between 0 and n, and the minimum equals the tree's cost (as `alts.ts` already does).
- **Approximations:** don't use bounds or top-N approximations. Their errors are 0.16–0.47 Expected guesses inside the scoring band, on a scale whose whole range is 1.0.

## Reproducing

All scratch scripts lived outside the repo. Nothing in the repo was changed apart from this note and the ticket's Research section.

```sh
# copy the solver, its score cache and the two word lists into a scratch dir, then per state:
./wordle -a wordlist_orig_all -h wordlist_orig_hidden -w salet.BBBBB -s -N 20000 > out
grep -c '^First guess' out          # 12972
grep '^First guess.*>=' out | wc -l # 0 (all exact)
```

The solver writes `hiddenwords_afterinitial` and `testwords_afterinitial` into its working directory on every run (`wordle.cpp` lines 942–943). Give each parallel job its own working directory.

## Sources

- `packages/pipeline/vendor/wordle/wordle.cpp` at the pinned commit:
  - option parsing: lines 1267–1290;
  - `-N` top-level cap: lines 906–913;
  - show-top (`toplevel=2`) path: lines 950 and 968;
  - beta handling and the `>` marker: lines 742 and 752;
  - group-size lower bound: lines 863–886;
  - `maxguesses=6`: line 69.
- `packages/pipeline/vendor/wordle/README`: usage of `-s`, `-N`, `-b` and `-w state.guess`.
- `packages/pipeline/src/alts.ts` and `solver.ts`: how the pipeline invokes the solver today.
- `packages/site/src/data.ts`: runtime `fetch` of `public/data/*`.
- Issues 0011 and 0016 for the grading requirements.
- Everything else is local measurement as described above.
