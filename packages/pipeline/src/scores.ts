/**
 * Exact scores for every allowed Guess at every Eligible Game state, for the Ranked trainer.
 *
 * `wordle -w <state> -s -N <all Guesses>` scores every Guess exactly: show-top mode skips
 * the early exits and never tightens the cutoff (see research/exact-scores-for-every-guess.md).
 * Each state's raw output is cached in .solver/runs, so reruns only parse.
 */
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { eligibleStates, deriveTree, patternPath, stateString, type RawTree } from '@wordle/core';
import { SOLVER_DIR } from './config.js';
import { parseFirstGuesses, pool, runSolver, scoresCacheName, type SolverLists } from './solver.js';

export interface StateScores {
  key: string;
  size: number;
  optimal: number;
  /** Aligned with `guesses`. */
  deltas: number[];
}

export interface ScoresOptions {
  opener: string;
  jobs: number;
  lists: SolverLists;
  /** Every allowed Guess, in guesses.json order. */
  guesses: string[];
  /** Where raw solver output is cached. */
  runsDir: string;
  fresh: boolean;
  onProgress?: (done: number, total: number) => void;
}

export async function computeScores(raw: RawTree, opts: ScoresOptions): Promise<StateScores[]> {
  const root = deriveTree(raw);
  // The biggest states take minutes; start them first so the pool stays busy.
  const states = eligibleStates(root).sort((a, b) => b.size - a.size);
  const index = new Map(opts.guesses.map((g, i) => [g, i]));
  const N = String(opts.guesses.length);

  // Share the start-up cache in SOLVER_DIR with a scratch directory per job.
  const cache = path.join(SOLVER_DIR, scoresCacheName(opts.lists));
  if (!existsSync(cache)) throw new Error(`${cache} is missing; run the trees step first, which writes it`);
  const free: string[] = [];
  for (let j = 0; j < opts.jobs; j++) {
    const dir = path.join(SOLVER_DIR, 'work', String(j));
    mkdirSync(dir, { recursive: true });
    const link = path.join(dir, scoresCacheName(opts.lists));
    if (!existsSync(link)) symlinkSync(cache, link);
    free.push(dir);
  }

  let done = 0;
  return pool(states, opts.jobs, async (n) => {
    const key = patternPath(n).join('.');
    const log = path.join(opts.runsDir, `scores.${opts.opener}.${key}.log`);
    if (opts.fresh || !existsSync(log)) {
      const dir = free.pop()!;
      try {
        writeFileSync(log, await runSolver(opts.lists, ['-w', `${stateString(n.parent!)}.${n.pattern}`, '-s', '-N', N], dir));
      } finally {
        free.push(dir);
      }
    }
    const rows = parseFirstGuesses(readFileSync(log, 'utf8'));
    const totals = new Array<number>(opts.guesses.length).fill(-1);
    for (const r of rows) {
      if (!r.exact) throw new Error(`${key}: ${r.guess} has only a bound (${r.total}), not an exact score`);
      const i = index.get(r.guess);
      if (i === undefined) throw new Error(`${key}: the solver scored ${r.guess}, which is not an allowed Guess`);
      totals[i] = r.total;
    }
    const missing = totals.findIndex((t) => t < 0);
    if (missing >= 0) throw new Error(`${key}: no score for ${opts.guesses[missing]} (${rows.length} of ${N} scored)`);
    const best = Math.min(...totals);
    if (best !== n.cost) throw new Error(`${key}: the best Guess scores ${best}, but the tree's ${n.guess} costs ${n.cost}`);
    const deltas = totals.map((t) => t - n.cost);
    const worst = Math.max(...deltas);
    if (worst > n.size) throw new Error(`${key}: a Guess costs ${worst} over optimal, more than the ${n.size} Candidates`);
    opts.onProgress?.(++done, states.length);
    return { key, size: n.size, optimal: n.cost, deltas };
  });
}
