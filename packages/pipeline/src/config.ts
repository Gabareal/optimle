import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

export const PIPELINE_DIR = path.resolve(here, '..');
export const REPO_ROOT = path.resolve(PIPELINE_DIR, '../..');
export const VENDOR_DIR = path.join(PIPELINE_DIR, 'vendor/wordle');
/** Solver binary, standard-score cache and per-run scratch. Git-ignored. */
export const SOLVER_DIR = path.join(PIPELINE_DIR, '.solver');
export const SOLVER_BIN = path.join(SOLVER_DIR, 'wordle');
/** Files the site serves. Committed. */
export const DATA_DIR = path.join(REPO_ROOT, 'packages/site/public/data');
/** Comparison-Strategy trees: not shipped to the site, but committed so CI can validate them. */
export const ARTIFACTS_DIR = path.join(PIPELINE_DIR, 'artifacts');

/**
 * The word lists. Swap them by setting WORDLE_ANSWERS / WORDLE_GUESSES to other files
 * (one word per line); then rerun `pnpm data`.
 */
export const ANSWERS_FILE = process.env.WORDLE_ANSWERS ?? path.join(VENDOR_DIR, 'wordlist_orig_hidden');
export const GUESSES_FILE = process.env.WORDLE_GUESSES ?? path.join(VENDOR_DIR, 'wordlist_orig_all');

/** Selby's published optimal SALET tree, used only as an independent cross-check. */
export const PUBLISHED_SALET_TREE = path.join(VENDOR_DIR, 'optimaltree.normalmode.txt');
/** Selby's proven exact totals for the 105 best openers. */
export const PUBLISHED_TOP105 = path.join(VENDOR_DIR, 'normal.top105.proven');

export const SELBY_SOURCE = 'Alex Selby, MIT licence (github.com/alex1770/wordle)';
