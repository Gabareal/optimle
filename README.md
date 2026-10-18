# Optimal Wordle tree

A static website that shows the provably optimal Wordle strategy as an explorable
Decision tree: open with **SALET**, and the 2,315 original Answers take **7,920**
Guesses in total, **3.4212** on average (normal mode). Visitors walk the tree on a
Wordle board, look up any Answer's Path, compare What-if Guesses, and explore stats
graphs and other openers' optimal trees.

The site has two pages: the **Visualiser** at `/` and the **Ranked trainer** at `/ranked/`.
A Run in the trainer puts five Game states from the SALET tree to the player, drawn by how
often they occur. The player gets one Guess at each, and every allowed Guess is scored
exactly against the optimum (the trainer's map:
[issues/0011](issues/0011-map-wordle-ranked-trainer.md)).

The trees come from Alex Selby's exact solver ([alex1770/wordle](https://github.com/alex1770/wordle),
MIT licence). The design decisions are recorded in [`issues/`](issues/) (start with the
[map](issues/0001-map-wordle-optimal-strategy-visualiser.md)); the vocabulary is in
[CONTEXT.md](CONTEXT.md).

## Layout

| Package | What it is |
|---|---|
| [`packages/core`](packages/core) | Feedback patterns and tree derivation (Candidates, Expected guesses, entropy), the tree validator, the data-contract types, and the Ranked trainer's draw and scoring (`ranked.ts`). Shared by the other two. Vitest tests. |
| [`packages/pipeline`](packages/pipeline) | TypeScript on Node. Builds and drives Selby's C++ solver (a pinned git submodule in `vendor/wordle`), computes Greedy-entropy itself, and writes and validates the data files. |
| [`packages/site`](packages/site) | React + Vite + TypeScript, built as two pages: `src/visualiser/` (`index.html`) and `src/ranked/` (`ranked/index.html`), with the header, footer, tiles and data loader in `src/shared/`. Hand-drawn SVG charts (`d3-scale`/`d3-array` for maths only), plain CSS tokens with dark mode, Game state in the URL hash. |

The generated data is committed in [`packages/site/public/data`](packages/site/public/data).
The two comparison trees that the site doesn't walk (Greedy-entropy and Answers-only) are
committed in [`packages/pipeline/artifacts`](packages/pipeline/artifacts) so CI can validate them.

## Quick start

Needs Node 22+, pnpm (see `packageManager` in `package.json`; `corepack enable` gets it) and git.

```bash
git clone --recurse-submodules <this repo>
```

```bash
pnpm install
```

```bash
pnpm dev
```

Then open the URL Vite prints. Other commands:

| Command | Does |
|---|---|
| `pnpm test` | Vitest in `core` and `pipeline` (repeated-letter Feedback, the validator, and the SALET tree reproducing 7,920) |
| `pnpm validate` | Validates every committed data file (what CI runs) |
| `pnpm build` | Static build in `packages/site/dist` |
| `pnpm data` | Regenerates the data (below) |

## Regenerating the data

The data only changes when the word lists, the solver pin, or the pipeline change. Run it
by hand, commit the JSON, and let CI validate it.

You need a C++17 compiler (`c++`, or set `CXX`). On macOS a small shim
(`packages/pipeline/solver-shim/error.h`) stands in for glibc's `<error.h>`; the vendored
source is not modified.

```bash
pnpm data
```

```bash
pnpm validate
```

`pnpm data` builds the solver into `packages/pipeline/.solver/` (git-ignored) and runs these
steps; choose some with `--steps words,trees,answers-only,greedy,strategies,openers,alts,scores`:

| Step | Output | How |
|---|---|---|
| `words` | `answers.json`, `guesses.json` | The original lists from the submodule |
| `trees` | `tree.<opener>.json` for SALET, CRANE, SLATE, TRACE, CRATE, ADIEU, AUDIO, ROATE | `wordle -w <opener> -p` (exact). Each is validated, and SALET is cross-checked against Selby's published `optimaltree.normalmode.txt` (both total 7,920) |
| `answers-only` | `artifacts/tree.answers-only.json` | `wordle -a <answers> -h <answers>`: an exhaustive search for the best opener (≈15 min), then its tree |
| `greedy` | `artifacts/tree.greedy-entropy.json` | Our TypeScript Greedy-entropy |
| `strategies` | `strategies.json` | Per-Answer guess counts for Optimal, Greedy-entropy, Answers-only |
| `openers` | `openers.json` | Selby's proven top-105 totals, plus the entropy of all 12,972 Guesses as openers |
| `alts` | `alts.<opener>.json` | `wordle -w <state> -s -N K` at every Game state with more than 2 Candidates |
| `scores` | `scores.salet/<patterns>.json` | `wordle -w <state> -s -N 12972` at each of SALET's 283 Eligible Game states: every allowed Guess's exact total, stored as its difference from the optimum. Each job gets its own working directory. About 6 minutes with `--jobs 4`; runs are cached |

Other flags: `--k 10` (alternatives per Game state), `--openers salet,crane`, `--jobs 8`,
`--answers-only-opener slate` (skip the exhaustive search), `--fresh` (ignore cached solver
runs in `.solver/runs`). Pass them through pnpm, e.g. `pnpm data --steps alts --k 5`.

A full run takes about 5 minutes on an 8-core laptop, plus about 15 minutes the first time
for the Answers-only search (cached after that).

**About K.** The plan budgeted an overnight run for K = 10 alternative scores per Game state,
with permission to stub it with a smaller K at first. That turned out unnecessary: only about
290 Game states per tree have more than 2 Candidates, and Selby's solver scores ten Guesses at
each in well under a second, so the full **K = 10** run takes about 40 seconds for all eight
openers. The committed files are the full K = 10 run. Use `--k` for a quicker run if a word-list
swap makes it slower.

**Swapping word lists.** Point `WORDLE_ANSWERS` and `WORDLE_GUESSES` at other one-word-per-line
files and rerun `pnpm data`. The hashes in every provenance header change, and `pnpm validate`
fails until everything is regenerated. (The SALET 7,920 checks and Selby's top-105 leaderboard
are specific to the original lists.)

### Provenance headers

Every JSON file starts with a `provenance` object: title, source, SHA-256 of both word lists,
the solver commit, the total Guesses where it applies, and the generation date. The site
checks each tree's derived total against its header on load and credits the source in the footer.

## What the validator checks

- Every tree: each node's Guess is an allowed Guess; Feedback patterns are recomputed from the
  word lists; each node's edges are exactly the patterns its Candidates produce, so the groups
  partition the Candidate set; every Answer reaches exactly one GGGGG leaf; the total matches the header.
- SALET totals 7,920, and so does Selby's published tree.
- `strategies.json` counts are exactly what the trees give.
- Every alternative is an allowed Guess, never beats the tree's own Guess, and is flagged
  "also optimal" exactly when it ties it.
- Every Eligible Game state has a score file. It has one delta per allowed Guess, each
  within 0..Candidates, the tree's Guess at 0, and each alternative's delta matching its
  exact total.

## Findings while building

- **Answers-only via the allowed-Guess list: verified.** Selby's solver accepts
  `-a wordlist_orig_hidden -h wordlist_orig_hidden` (it builds its Guess list as the Answers
  plus `-a`). An exhaustive, proven search over all 2,315 first Guesses finds **SLATE, 7,973
  total (3.4441)**. Note that this restricts Guesses to the 2,315 *Answers*, as the Solver
  implementation choice ticket says. CONTEXT.md describes Answers-only as "only Candidates may
  be guessed", which is a stricter rule (closer to the solver's `-U` mode); the two disagree.
- **Greedy-entropy** (all 12,972 Guesses allowed) opens with SOARE and totals 8,020 (3.4644).
- **Tie-breaking matters for the shape, not the total.** Our solver-generated SALET tree totals
  7,920 like Selby's published file, but breaks ties differently: 79 Answers need 5 Guesses
  (the published file has 41). The Hardest Answers graph uses the shipped tree.
- The solver-generated totals for every curated opener match Selby's proven leaderboard.

## Deploying

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs typecheck, tests, the
validator and the build on every push and pull request, and deploys `main` to GitHub Pages.
In the repository settings, set Pages → Source to "GitHub Actions". The site uses a relative
base path, so it works at `https://<user>.github.io/<repo>/`.

## Credits

- Optimal trees, the solver and the top-105 leaderboard: Alex Selby, MIT licence
  ([licence](packages/pipeline/vendor/wordle/LICENSE)).
- SALET's optimality: Selby; Peter Tseng; Jonathan Olson; Bertsimas & Paskov, *Operations
  Research* 73(3), 2025. See [research/optimal-tree.md](research/optimal-tree.md).
