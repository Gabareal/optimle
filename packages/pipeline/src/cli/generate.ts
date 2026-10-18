/**
 * Regenerate every data file the site loads (see the Tree data contract).
 *
 *   pnpm data                       # everything, K = 10 alternatives
 *   pnpm data --steps trees,alts    # only some steps
 *   pnpm data --k 3                 # fewer alternatives per node (faster)
 *   pnpm data --openers salet,crane # only some opener trees / alternative files
 *   pnpm data --fresh               # ignore cached solver runs in .solver/runs
 *
 * Steps: words, trees, answers-only, greedy, strategies, openers, alts, scores.
 *
 * `scores` (exact scores for every Guess at every Eligible Game state of the Ranked
 * trainer's tree) takes about 6 minutes with 4 jobs the first time; runs are cached.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  CURATED_OPENERS,
  dataFiles,
  RANKED_OPENER,
  deriveTree,
  guessCounts,
  validateTree,
  type AltsFile,
  type OpenersFile,
  type RawTree,
  type ScoresFile,
  type StrategiesFile,
  type TreeFile,
} from '@wordle/core';
import { computeAlternatives } from '../alts.js';
import { computeScores } from '../scores.js';
import { ARTIFACTS_DIR, DATA_DIR, PUBLISHED_SALET_TREE, PUBLISHED_TOP105, SELBY_SOURCE, SOLVER_DIR } from '../config.js';
import { entropies, FeedbackMatrix, greedyEntropyTree } from '../greedy.js';
import { provenance, readJson, writeData } from '../io.js';
import { parseSelbyTree } from '../selby-tree.js';
import {
  ANSWERS_ONLY_LISTS,
  buildSolver,
  ORIGINAL_LISTS,
  parseBestScore,
  pool,
  runSolver,
  solverCommit,
  type SolverLists,
} from '../solver.js';
import { loadWordLists } from '../words.js';

const STEPS = ['words', 'trees', 'answers-only', 'greedy', 'strategies', 'openers', 'alts', 'scores'] as const;

const { values: flags } = parseArgs({
  options: {
    steps: { type: 'string', default: STEPS.join(',') },
    k: { type: 'string', default: '10' },
    openers: { type: 'string', default: CURATED_OPENERS.join(',') },
    jobs: { type: 'string', default: String(os.availableParallelism()) },
    'answers-only-opener': { type: 'string' },
    fresh: { type: 'boolean', default: false },
  },
});
const steps = new Set(flags.steps!.split(','));
for (const s of steps) if (!(STEPS as readonly string[]).includes(s)) throw new Error(`Unknown step ${s}`);
const K = Number(flags.k);
const JOBS = Number(flags.jobs);
const openers = flags.openers!.split(',').map((w) => w.trim().toLowerCase());
const RUNS = path.join(SOLVER_DIR, 'runs');
mkdirSync(RUNS, { recursive: true });

const lists = loadWordLists();
const commit = solverCommit();
const dataPath = (f: string) => path.join(DATA_DIR, f);
const ANSWERS_ONLY_FILE = path.join(ARTIFACTS_DIR, 'tree.answers-only.json');
const GREEDY_FILE = path.join(ARTIFACTS_DIR, 'tree.greedy-entropy.json');

console.log(`Answers ${lists.answers.length}, Guesses ${lists.guesses.length}; solver ${commit.slice(0, 12)}; steps: ${[...steps].join(', ')}`);

function check(raw: RawTree, guesses: string[], expectedTotal: number, what: string): number {
  const r = validateTree(raw, { answers: lists.answers, guesses, expectedTotal });
  if (!r.ok) throw new Error(`${what} failed validation:\n  ${r.errors.join('\n  ')}`);
  console.log(`  ${what}: valid, total ${r.total}, max ${r.maxGuesses} guesses`);
  return r.total;
}

/** Run the solver for one opener's optimal tree, reusing a cached run unless --fresh. */
async function solveTree(opener: string, solverLists: SolverLists, tag: string): Promise<{ raw: RawTree; total: number }> {
  const treeFile = path.join(RUNS, `${tag}.${opener}.tree`);
  const logFile = `${treeFile}.log`;
  if (flags.fresh || !existsSync(logFile)) {
    const t0 = Date.now();
    const stdout = await runSolver(solverLists, ['-w', opener, '-p', treeFile]);
    writeFileSync(logFile, stdout);
    console.log(`  solved ${tag} ${opener} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  return { raw: parseSelbyTree(readFileSync(treeFile, 'utf8')), total: parseBestScore(readFileSync(logFile, 'utf8')) };
}

function readTop105(): [string, number][] {
  return readFileSync(PUBLISHED_TOP105, 'utf8')
    .trim()
    .split('\n')
    .map((l) => l.trim().split(/\s+/))
    .map(([w, t]) => [w, Number(t)] as [string, number]);
}

// ---------------------------------------------------------------------------

if (steps.has('words')) {
  console.log('Word lists');
  writeData(dataPath(dataFiles.answers), {
    provenance: provenance(lists, { title: 'Answers: the original 2,315-word answer list', source: SELBY_SOURCE }),
    words: lists.answers,
  });
  writeData(dataPath(dataFiles.guesses), {
    provenance: provenance(lists, { title: 'Allowed Guesses: the original 12,972-word list', source: SELBY_SOURCE }),
    words: lists.guesses,
  });
}

if (steps.has('trees') || steps.has('alts') || steps.has('answers-only') || steps.has('scores')) buildSolver();

if (steps.has('trees')) {
  console.log('Opener trees');
  // Warm the solver's score cache with one run before going parallel.
  await solveTree(openers[0], ORIGINAL_LISTS, 'optimal');
  await pool(openers, JOBS, async (opener) => {
    const { raw, total } = await solveTree(opener, ORIGINAL_LISTS, 'optimal');
    check(raw, lists.guesses, total, `tree.${opener}`);
    const file: TreeFile = {
      provenance: provenance(lists, {
        title: `Optimal tree for ${opener.toUpperCase()}`,
        source: SELBY_SOURCE,
        solverCommit: commit,
        total,
        notes: 'Generated by wordle -w <opener> -p on the original lists. Ties are broken by the solver.',
      }),
      opener,
      tree: raw,
    };
    writeData(dataPath(dataFiles.tree(opener)), file);
  });
  if (openers.includes('salet')) {
    const published = parseSelbyTree(readFileSync(PUBLISHED_SALET_TREE, 'utf8'));
    check(published, lists.guesses, 7920, "Selby's published optimaltree.normalmode.txt");
    const ours = readJson<TreeFile>(dataPath(dataFiles.tree('salet')));
    if (ours.provenance.total !== 7920) throw new Error(`Our SALET tree totals ${ours.provenance.total}, not 7,920`);
    console.log('  cross-check: our SALET tree and the published one both total 7,920');
  }
}

if (steps.has('answers-only')) {
  console.log('Answers-only optimal (allowed Guesses restricted to the Answers)');
  let opener = flags['answers-only-opener'];
  if (!opener) {
    // Exhaustive search over all 2,315 first Guesses, with proof. About 30 min on one core.
    const log = path.join(RUNS, 'answers-only.search.log');
    if (flags.fresh || !existsSync(log)) {
      console.log('  searching all first Guesses (slow, ~30 min)…');
      writeFileSync(log, await runSolver(ANSWERS_ONLY_LISTS, []));
    }
    opener = /Best first guess = (\w{5})/.exec(readFileSync(log, 'utf8'))![1];
    console.log(`  best Answers-only opener: ${opener.toUpperCase()} (${parseBestScore(readFileSync(log, 'utf8'))})`);
  }
  const { raw, total } = await solveTree(opener, ANSWERS_ONLY_LISTS, 'answers-only');
  check(raw, lists.answers, total, 'Answers-only tree');
  writeData(ANSWERS_ONLY_FILE, {
    provenance: provenance(lists, {
      title: `Answers-only optimal tree (${opener.toUpperCase()})`,
      source: SELBY_SOURCE,
      solverCommit: commit,
      total,
      notes:
        'wordle -a <answers> -h <answers>: only the 2,315 Answers may be guessed (not only the current Candidates). ' +
        (flags['answers-only-opener'] ? 'Opener given on the command line.' : 'Opener proven best by an exhaustive search.'),
    }),
    opener,
    tree: raw,
  });
}

if (steps.has('greedy') || steps.has('openers')) {
  console.log('Feedback matrix');
  const t0 = Date.now();
  const m = new FeedbackMatrix(lists.guesses, lists.answers);
  console.log(`  ${lists.guesses.length} × ${lists.answers.length} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  if (steps.has('greedy')) {
    console.log('Greedy-entropy tree');
    const raw = greedyEntropyTree(m);
    const total = deriveTree(raw).cost;
    check(raw, lists.guesses, total, 'Greedy-entropy tree');
    writeData(GREEDY_FILE, {
      provenance: provenance(lists, {
        title: `Greedy-entropy tree (${raw[0].toUpperCase()})`,
        source: 'This project (packages/pipeline/src/greedy.ts)',
        total,
        notes: 'Highest-entropy Guess from all allowed Guesses at every Game state; ties go to Candidates, then alphabetically.',
      }),
      opener: raw[0],
      tree: raw,
    });
  }

  if (steps.has('openers')) {
    console.log('Openers table');
    const h = entropies(m, lists.answers.map((_, i) => i));
    const file: OpenersFile = {
      provenance: provenance(lists, {
        title: 'Opener leaderboard (proven exact totals) and the entropy of every Guess as an opener',
        source: `${SELBY_SOURCE}: normal.top105.proven. Entropy computed by this project.`,
        solverCommit: commit,
      }),
      leaderboard: readTop105(),
      entropy: [...h].map((x) => Math.round(x * 1000) / 1000),
    };
    writeData(dataPath(dataFiles.openers), file);
  }
}

if (steps.has('strategies')) {
  console.log('Strategy comparison');
  const counts = (raw: RawTree) => {
    const c = guessCounts(deriveTree(raw));
    return lists.answers.map((a) => c.get(a)!);
  };
  const optimal = readJson<TreeFile>(dataPath(dataFiles.tree('salet')));
  const greedy = readJson<TreeFile>(GREEDY_FILE);
  const ao = readJson<TreeFile>(ANSWERS_ONLY_FILE);
  const entry = (label: string, f: TreeFile, notes?: string) => ({
    label,
    opener: f.opener,
    total: f.provenance.total!,
    counts: counts(f.tree),
    ...(notes ? { notes } : {}),
  });
  const file: StrategiesFile = {
    provenance: provenance(lists, {
      title: 'Guesses each Strategy needs for each Answer',
      source: `Optimal and Answers-only: ${SELBY_SOURCE}. Greedy-entropy: this project.`,
      solverCommit: commit,
    }),
    answers: lists.answers,
    strategies: {
      optimal: entry('Optimal', optimal),
      greedy: entry('Greedy-entropy', greedy),
      answersOnly: entry('Answers-only', ao, 'Optimal when only the 2,315 Answers may be guessed.'),
    },
  };
  writeData(dataPath(dataFiles.strategies), file);
}

if (steps.has('alts')) {
  console.log(`Alternative Guesses, K = ${K}`);
  const leaderboard = readTop105();
  for (const opener of openers) {
    const tree = readJson<TreeFile>(dataPath(dataFiles.tree(opener)));
    const t0 = Date.now();
    let last = 0;
    const nodes = await computeAlternatives(tree.tree, {
      k: K,
      jobs: JOBS,
      lists: ORIGINAL_LISTS,
      leaderboard,
      onProgress: (d, n) => {
        if (Date.now() - last > 15000 || d === n) {
          last = Date.now();
          console.log(`  ${opener}: ${d}/${n} nodes, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
        }
      },
    });
    const file: AltsFile = {
      provenance: {
        ...provenance(lists, {
          title: `Top-${K} alternative Guesses per Game state for ${opener.toUpperCase()}`,
          source: SELBY_SOURCE,
          solverCommit: commit,
          total: tree.provenance.total,
          notes:
            'wordle -w <state> -s -N K: the K Guesses ranked best by the solver heuristic, each scored exactly. ' +
            'Nodes with 2 or fewer Candidates are skipped. The root lists the best openers from normal.top105.proven.',
        }),
        k: K,
      },
      opener,
      nodes,
    };
    writeData(dataPath(dataFiles.alts(opener)), file);
  }
}

if (steps.has('scores')) {
  console.log(`Exact scores for every Guess at every Eligible Game state of ${RANKED_OPENER.toUpperCase()}`);
  const tree = readJson<TreeFile>(dataPath(dataFiles.tree(RANKED_OPENER)));
  const t0 = Date.now();
  let last = 0;
  const states = await computeScores(tree.tree, {
    opener: RANKED_OPENER,
    jobs: JOBS,
    lists: ORIGINAL_LISTS,
    guesses: lists.guesses,
    runsDir: RUNS,
    fresh: !!flags.fresh,
    onProgress: (d, n) => {
      if (Date.now() - last > 15000 || d === n) {
        last = Date.now();
        console.log(`  ${d}/${n} Game states, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
    },
  });
  const header = provenance(lists, {
    title: `Exact scores for every Guess at one Eligible Game state of ${RANKED_OPENER.toUpperCase()}`,
    source: SELBY_SOURCE,
    solverCommit: commit,
    notes: 'wordle -w <state> -s -N <all Guesses>: every allowed Guess scored exactly. deltas[i] = total for guesses.json[i] minus the optimal total.',
  });
  for (const s of states) {
    const file: ScoresFile = { provenance: header, opener: RANKED_OPENER, ...s };
    writeData(dataPath(dataFiles.scores(RANKED_OPENER, s.key)), file);
  }
  console.log(`  ${states.length} files in ${path.dirname(dataFiles.scores(RANKED_OPENER, 'x'))}/`);
}

console.log('Done. Now run: pnpm validate');
