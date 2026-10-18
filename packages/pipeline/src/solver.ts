/**
 * Driving Alex Selby's C++ solver (the pinned `vendor/wordle` submodule).
 *
 * Every run uses SOLVER_DIR as its working directory, where the solver keeps its
 * start-up cache of scores (written once with -e).
 */
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { ANSWERS_FILE, GUESSES_FILE, PIPELINE_DIR, SOLVER_BIN, SOLVER_DIR, VENDOR_DIR } from './config.js';

const run = promisify(execFile);

export function solverCommit(): string {
  return execFileSync('git', ['-C', VENDOR_DIR, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

/** Compile wordle.cpp if the binary is missing or older than the source. */
export function buildSolver(force = false): string {
  const src = path.join(VENDOR_DIR, 'wordle.cpp');
  if (!existsSync(src)) {
    throw new Error(`${src} is missing. Run: git submodule update --init`);
  }
  mkdirSync(SOLVER_DIR, { recursive: true });
  if (!force && existsSync(SOLVER_BIN) && statSync(SOLVER_BIN).mtimeMs > statSync(src).mtimeMs) return SOLVER_BIN;
  const desc = execFileSync('git', ['-C', VENDOR_DIR, 'log', '-1', '--pretty=format:%h %ad', '--date=iso', '--abbrev=12'], {
    encoding: 'utf8',
  });
  const args = ['-std=c++17', '-O3', `-DCOMMITDESC="${desc}"`, '-o', SOLVER_BIN, src];
  // glibc's <error.h> doesn't exist on macOS; a small shim stands in for it.
  if (process.platform !== 'linux') args.unshift('-I', path.join(PIPELINE_DIR, 'solver-shim'));
  const cxx = process.env.CXX ?? 'c++';
  console.log(`Building solver: ${cxx} ${args.join(' ')}`);
  execFileSync(cxx, args, { stdio: 'inherit' });
  return SOLVER_BIN;
}

export interface SolverLists {
  /** Allowed Guesses file (-a). */
  guesses: string;
  /** Answers file (-h). */
  answers: string;
}

export const ORIGINAL_LISTS: SolverLists = { guesses: GUESSES_FILE, answers: ANSWERS_FILE };
/** Answers-only optimal: the allowed Guesses are restricted to the Answers. */
export const ANSWERS_ONLY_LISTS: SolverLists = { guesses: ANSWERS_FILE, answers: ANSWERS_FILE };

/** The solver's start-up cache file for a pair of lists. */
export const scoresCacheName = (lists: SolverLists) => `standardscores__${path.basename(lists.guesses)}__${path.basename(lists.answers)}`;

/**
 * Run the solver. `cwd` defaults to SOLVER_DIR; parallel `-w <state>` runs need a directory
 * each, because the solver writes scratch word files into its working directory.
 */
export async function runSolver(lists: SolverLists, args: string[], cwd = SOLVER_DIR): Promise<string> {
  const writeCache = existsSync(path.join(cwd, scoresCacheName(lists))) ? [] : ['-e'];
  const { stdout } = await run(SOLVER_BIN, ['-a', lists.guesses, '-h', lists.answers, ...writeCache, ...args], {
    cwd,
    maxBuffer: 256 * 1024 * 1024,
  });
  return stdout;
}

/** The "Best first guess score = N" line every run prints. */
export function parseBestScore(stdout: string): number {
  const m = /Best first guess score = (\d+)/.exec(stdout);
  if (!m) throw new Error(`No score in solver output:\n${stdout.slice(-2000)}`);
  return Number(m[1]);
}

/** Lines printed in "show top" (-s) mode: `First guess round  =  612 ...`; ">" marks a bound. */
export function parseFirstGuesses(stdout: string): { guess: string; total: number; exact: boolean }[] {
  const out = [];
  for (const m of stdout.matchAll(/^First guess (\w{5}) (.)= +(\d+)/gm)) {
    out.push({ guess: m[1], total: Number(m[3]), exact: m[2] !== '>' });
  }
  return out;
}

/** Run `fn` over `items` with at most `jobs` in flight. */
export async function pool<T, R>(items: T[], jobs: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(jobs, items.length) }, worker));
  return out;
}
