/**
 * Top-K alternative Guesses per Game state, scored exactly by Selby's solver.
 *
 * For each node with more than 2 Candidates, `wordle -w <state> -s -N K` evaluates the
 * K most promising Guesses by the solver's own heuristic ordering, exactly (show-top
 * mode disables the beta cutoff). A Guess whose total equals the node's cost is
 * "also optimal". The root's alternatives are other openers, taken from Selby's
 * proven top-105 table.
 */
import { allNodes, deriveTree, patternPath, stateString, type Alternative, type RawTree } from '@wordle/core';
import { parseFirstGuesses, pool, runSolver, type SolverLists } from './solver.js';

export interface AltsOptions {
  k: number;
  jobs: number;
  lists: SolverLists;
  /** Proven opener totals, best first. */
  leaderboard: [string, number][];
  onProgress?: (done: number, total: number) => void;
}

export async function computeAlternatives(raw: RawTree, opts: AltsOptions): Promise<Record<string, Alternative[]>> {
  const root = deriveTree(raw);
  const nodes = allNodes(root).filter((n) => n.parent && n.size > 2);
  const out: Record<string, Alternative[]> = {};
  out[''] = opts.leaderboard.slice(0, opts.k).map(([g, t]) => [g, t, t === root.cost ? 1 : 0]);
  let done = 0;
  await pool(nodes, opts.jobs, async (n) => {
    const state = `${stateString(n.parent!)}.${n.pattern}`;
    const stdout = await runSolver(opts.lists, ['-w', state, '-s', '-N', String(opts.k)]);
    const alts = parseFirstGuesses(stdout)
      .filter((a) => a.exact)
      .sort((a, b) => a.total - b.total || (a.guess < b.guess ? -1 : 1));
    for (const a of alts) {
      if (a.total < n.cost) {
        throw new Error(`${state}: ${a.guess} scores ${a.total}, below the tree's ${n.cost}. The tree is not optimal here.`);
      }
    }
    out[patternPath(n).join('.')] = alts.map((a) => [a.guess, a.total, a.total === n.cost ? 1 : 0]);
    opts.onProgress?.(++done, nodes.length);
  });
  return out;
}
