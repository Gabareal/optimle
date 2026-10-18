# Computing the provably optimal Wordle Decision tree

Research for ticket 0002. Scope: normal mode, original lists (2,315 Answers, 12,972 Guesses), minimising average Guesses. Researched 2026-10-17.

## TL;DR

- Several independent exact solvers agree. With SALET first, the minimum total is **7,920 Guesses** over the 2,315 Answers, an average of **3.42117**, and no Answer needs more than 5 Guesses. SALET is also the proven best first Guess. [S1][S3][S4][S5]
- Alex Selby's optimal SALET tree is a **downloadable plain-text file** in an MIT-licensed repo, along with the C++ solver. I downloaded it and checked it locally (details below). [S1][S2]
- The optimal tree is **not unique**. Equal-cost choices exist at many nodes, and no source publishes a count of optimal trees or a canonical tie-break.
- Exact scores for alternative Guesses at a node are cheap for good alternatives (seconds) but can be expensive for bad ones. A bounded search gives a cheap proven lower bound such as ">= x" instead. [S2][S3]
- **Recommendation: validate the published tree, and adopt Selby's solver offline to generate alternative-Guess scores.** Don't reimplement the proof search. Details at the end.

## 1. Algorithms, pruning, compute

### Alex Selby (sonorouschocolate.com, `alex1770/wordle`)
- **Recurrence:** f(H) is the minimum total Guesses to solve Candidate set H. f(H) = |H| + min over Guesses t of the sum of f(H_p) over the non-GGGGG Feedback-pattern groups H_p. [S1]
- **Pruning:** a "beta cutoff" (alpha-beta adapted to min-sum). The partial sum is abandoned as soon as it exceeds the best value so far. Fast lower bounds are computed for each summand first, and the most promising ones are refined first. [S1][S3]
- **Other techniques:** caching f(H) by Candidate set, direct logic when H is solvable within two Guesses, endgame analysis, and monotonicity and subadditivity bounds. [S1][S3]
- **Heuristic mode:** `-n N` restricts each node to the N most promising Guesses. This gives an upper bound and is very fast. `-n10` already finds SALET = 7920, but does not prove it. [S2]
- **Times:**
  - Part 1 (Jan 2022): `-n50` took about 40 s and found 7920. Proving 7920 is the best first-Guess value took about 2 days on 6 cores. [S1]
  - Part 2 (Mar 2022), on one core of an i7-4930K (circa 2013, 48 GiB RAM), with an improved algorithm:
    - finding SALET without proof: 0.83 s
    - proving SALET's exact value: 1.19 s
    - proving SALET is the best first Guess: about 15 h
    - exact values for all 12,972 first Guesses: 6 days [S3]
  - The README says a full proof run takes "maybe a day or two on single core". Work can be split across cores with `-t file,start,step`. [S2]

### Bertsimas and Paskov (MIT), "An Exact Solution to Wordle"
- Published in *Operations Research* 73(3):1384–1394, 2025, doi:10.1287/opre.2022.0434. The 2022 preprint was titled "An Exact and Interpretable Solution to Wordle". [S6][S7]
- **Method:** Wordle modelled as an MDP, solved with an exact dynamic programming / Bellman equation, plus "optimizations that make the approach tractable". The framework is extended to hard mode, worst-case objectives and non-uniform word priors. [S6]
- **Result:** best start SALET, average 3.421, every Answer found within 5 Guesses. [S6]
- **Policy:** served at wordleopt.com. [S6][S8]
- **Not confirmed:**
  - I could not retrieve compute time or hardware. The journal full text returned 403, and the preprint PDF's text layer uses CID fonts I couldn't extract. Press coverage mentions only "MIT computing resources".
  - No code or tree download was found.

### Peter Tseng (`petertseng/wordle-rs`, Rust)
- Two phases:
  1. Approximate every first Guess with a greedy rule (minimise mean bucket size).
  2. Search the chosen words exhaustively with "can't beat current best" pruning and caching by Candidate set. [S5]
- **Result:** SALET 7920, max 5 Guesses. It also proves that no tree solves all 2,315 Answers within 4. Hard mode: SALET 8122. [S5]
- **Runtime:** some subproblems take a long time, e.g. TRACE/CRATE's yellow-E/yellow-R bucket takes over 30 minutes. [S5]
- **Licence:** the GitHub API reports none (no SPDX).

### Jonathan Olson (jonathanolson.net)
- Heuristic-guided recursive tree search, using largest-bucket size and average bucket size to order candidates. [S4]
- Reports SALET 3.42117, with REAST, CRATE, TRACE and SLATE close behind. [S4]
- Serialises the explored search tree (about 6 GB on disk), then extracts the best strategy per metric. [S4]
- Interactive explorer at jonathanolson.net/wordle-solver. The code is described as "rough". [S4]

### Independent agreement
- Laurent Poirrier counts **fourteen distinct people** who have submitted 3.4212-average, 5-worst-case trees to Cyrus Freshman's standardised bot leaderboard, including Olson, Tseng and Selby. [S9]
- He suspects they all use recursive enumeration with backtracking, pruning and caching. Finding good trees is quick; proving optimality is the expensive part. [S9]

## 2. Published optimal values (normal mode, original lists)

Selby's proven ranking, as totals over 2,315 Answers [S1]:

| First Guess | Total | Average |
|---|---|---|
| SALET | 7920 | 3.4212 |
| REAST | 7923 | 3.4225 |
| CRATE / TRACE | 7926 | 3.4238 |
| SLATE | 7928 | 3.4246 |
| CRANE | 7930 | 3.4255 |
| CARLE | 7937 | 3.4285 |
| SLANE | 7943 | 3.4311 |
| CARTE | 7949 | 3.4337 |
| TORSE | 7950 | 3.4341 |

- Worst first Guess: QAJAQ, 9496. [S1]
- The repo includes `normal.top105.proven` (the top 105, proven exactly) and `normal.n100`. [S1][S2]
- Hard mode, for reference: SALET 8122 (3.5084). [S1][S5]

**Word-list caveat:** the NYT later removed 6 Answers (2,309 list). Values on that list differ, e.g. 7899 for CRATE/SLATE/TRACE. [S3][S9] Selby's repo now defaults to the 3,158-word "extended" list. Pass `-a wordlist_orig_all -h wordlist_orig_hidden` to reproduce the original-list figures. [S2]

## 3. Downloadable optimal trees

- **File:** `optimaltree.normalmode.txt` in `github.com/alex1770/wordle` (MIT licence, © 2022 Alex Selby). The same file is linked from the write-up at `sonorouschocolate.com/notes/images/c/c4/Optimaltree.normalmode.txt`. [S1][S2]
  - The two copies are byte-identical: SHA-256 `32a86634…5853259`, 102,960 bytes.
  - Hard-mode trees and other start words (`*.tree`) are in the same repo.
- **Format:** plain text, **one line per Answer** (2,315 lines). Each line is the Path written as `guess PATTERNn` pairs, where n is the turn number. A line repeats only the suffix that differs from the line above; shared prefixes are indented with spaces. Example:
  `salet BBBBB1 courd BBBBB2 nymph BBBBY3 whiff GGGGG4` [S1]
- **Local check (done for this research):**
  - 2,315 lines, each ending in `GGGGGn`.
  - The sum of n is **7,920** (average 3.42117).
  - Depth distribution: 2 Guesses: 78; 3: 1,225; 4: 971; 5: 41.
  - About 2,448 Guess placements in total.
  - Not yet checked: that every Feedback pattern in the file is correct and every leaf is a real Answer. A ~50-line validator would do this (see recommendation).
- **Other sources:**
  - Tseng's repo has results, but no licence. [S5]
  - Olson's trees are browsable in his web app. [S4]
  - Bertsimas–Paskov: interactive policy only (wordleopt.com). [S6]

## 4. Uniqueness and ties

- The optimal tree is **not unique**. This follows from the scoring alone: at any node whose Candidate set has two Answers {a, b}, guessing a or guessing b both cost 1 + 2 = 3. Larger sets often have several equal-cost Guesses too, and Poirrier's fourteen 3.4212 submissions are almost certainly different trees. [S9]
- No source counts the optimal trees or defines a canonical tie-break. Selby keeps whichever equal-best Guess his heuristic ordering reaches first.
- Ties are reported only at the first-Guess level, as equal totals (e.g. CRATE = TRACE = 7926). [S1][S3]
- **Implication for the visualiser:** when it shows "SALET's subtree chose X", it should label equal-cost alternatives as ties ("also optimal"), not as worse.

## 5. Scoring alternative Guesses per node

Selby's solver does this directly:
- `wordle -w salet.BBBBB.courd` (state followed by a candidate Guess) evaluates a specific Guess at any Game state exactly. `-w salet.BBBBB -p tree` gives the best Guess and the optimal subtree. [S2]
- `wordle -A` analysis mode rates each Guess actually played against the best one. [S3]

Costs:
- Exact values for good Guesses are fast: SALET's whole tree is proven in about 1.2 s. [S3]
- Exact values for bad Guesses can take hours. QAJAQ as a first Guess takes several hours. [S2]
- With a cutoff `-b <best>`, a bad Guess quickly returns ">= best", a proven bound rather than an exact value. [S2]

Rough budget for precomputing alternatives:
- About 2,450 nodes, with up to 12,972 Guesses each, is too many to evaluate exactly.
- At each node, compute exact values for the top K (say 10–50) Guesses by the heuristic ordering, and a cheap proven lower bound for the rest.
- Deep nodes have tiny Candidate sets, so they are near-instant. Only the root and depth-2 nodes are expensive.
- This is a one-off offline job, plausibly hours on a desktop. That is an estimate extrapolated from [S3]'s timings, not measured.

## Recommendation

**Validate the published tree; adopt Selby's solver offline for alternative-Guess scores; do not reimplement the proof search.**

1. **Use Selby's tree as data.**
   - Take `optimaltree.normalmode.txt` from the MIT-licensed repo, and credit "Alex Selby, MIT licence" in the site.
   - Its 7920 total is independently matched by Tseng, Olson, Bertsimas–Paskov and about 14 leaderboard entrants.
2. **Write a small independent validator** (part of our build):
   - Recompute every Feedback pattern from the word lists.
   - Check that each node's branches partition its Candidate set, and that all 2,315 Answers appear exactly once.
   - Recompute the total of 7,920.
   - This proves the file is a correct tree with that cost. Optimality is borrowed from the published proofs; re-proving it would cost about 15 CPU-hours with Selby's code, which is optional.
3. **For "why this Guess" explanations,** run Selby's `wordle.cpp` offline (original lists, `-w <state>.<guess>` with `-b` cutoffs) and store per-node scores:
   - exact values for the top-K alternatives
   - ">= bound" for the rest
   - an "also optimal" flag for ties

Reimplementing the exact solver is only worth it if the project later needs variants Selby's code doesn't support.

## Sources

- [S1] Alex Selby, "The best strategies for Wordle" (Jan 2022). http://sonorouschocolate.com/notes/index.php?title=The_best_strategies_for_Wordle
- [S2] Alex Selby, `alex1770/wordle`: README, LICENSE (MIT), repo file listing. https://github.com/alex1770/wordle
- [S3] Alex Selby, "The best strategies for Wordle, part 2" (Mar 2022). https://sonorouschocolate.com/notes/index.php/The_best_strategies_for_Wordle,_part_2
- [S4] Jonathan Olson, "Optimal Wordle Solutions" (2022-01-17). https://jonathanolson.net/experiments/optimal-wordle-solutions
- [S5] Peter Tseng, `wordle-rs` README. https://github.com/petertseng/wordle-rs
- [S6] Bertsimas & Paskov, "An Exact Solution to Wordle", *Operations Research* 73(3), 2025, abstract via RePEc. https://ideas.repec.org/a/inm/oropre/v73y2025i3p1384-1394.html (doi:10.1287/opre.2022.0434)
- [S7] Preprint PDF (text not extractable here). https://auction-upload-files.s3.amazonaws.com/Wordle_Paper_Final.pdf
- [S8] MIT Sloan, "How an algorithm solves Wordle". https://mitsloan.mit.edu/ideas-made-to-matter/how-algorithm-solves-wordle
- [S9] Laurent Poirrier, "Wordle-solving state of the art". https://www.poirrier.ca/notes/wordle-optimal/
