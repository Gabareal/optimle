/**
 * A Run in progress: its seed, the five Game states drawn from it, and the Guesses locked
 * in so far. It survives a reload through browser storage, never the URL, so the address
 * bar can't leak or edit the Rounds.
 */
import {
  dataFiles,
  drawRun,
  eligibleStates,
  followPatterns,
  patternPath,
  randomSeed,
  RANKED_OPENER,
  ROUNDS,
  type ScoresFile,
  type TreeNode,
} from '@wordle/core';
import { getJson, once } from '../shared/load';

export interface Run {
  seed: string;
  states: TreeNode[];
  /** One per Round; null until locked in. */
  guesses: (string | null)[];
}

const KEY = 'ranked:run';
export const stateKey = (n: TreeNode): string => patternPath(n).join('.');

export function newRun(root: TreeNode, seed = randomSeed()): Run {
  const states = drawRun(eligibleStates(root), seed).map((r) => r.state);
  return { seed, states, guesses: states.map(() => null) };
}

export function saveRun(run: Run): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ seed: run.seed, keys: run.states.map(stateKey), guesses: run.guesses }));
  } catch {
    // Storage can be unavailable (private mode); the Run then lasts until the page closes.
  }
}

/** The stored Run, if it still matches the tree; otherwise null. */
export function restoreRun(root: TreeNode, guessSet: Set<string>): Run | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { seed: string; keys: string[]; guesses: (string | null)[] };
    if (v.keys?.length !== ROUNDS || v.guesses?.length !== ROUNDS) return null;
    const states = v.keys.map((k) => {
      const pats = k.split('.');
      const n = followPatterns(root, pats);
      return n.depth === pats.length ? n : null;
    });
    if (states.some((n) => !n)) return null;
    const guesses = v.guesses.map((g) => (g && guessSet.has(g) ? g : null));
    // Rounds are locked in order, so a gap means the stored Run is damaged.
    if (guesses.some((g, i) => g && i > 0 && !guesses[i - 1])) return null;
    return { seed: v.seed, states: states as TreeNode[], guesses };
  } catch {
    return null;
  }
}

export const currentRound = (run: Run): number => run.guesses.findIndex((g) => g === null);

/** Exact scores for every allowed Guess at a Game state, fetched once. */
export function loadScores(n: TreeNode): Promise<ScoresFile> {
  const key = stateKey(n);
  return once(`scores:${key}`, () => getJson<ScoresFile>(dataFiles.scores(RANKED_OPENER, key)));
}

/** What the player has typed in the current Round. */
export interface Entry {
  typed: string;
  /** A valid Guess is waiting for the second Enter. */
  confirm: boolean;
  msg: string;
  /** Bumped on each invalid Enter, to replay the shake. */
  shake: number;
}

export const EMPTY_ENTRY: Entry = { typed: '', confirm: false, msg: '', shake: 0 };

/**
 * One key ('a'–'z', '⏎' or '⌫') against the Run. Locking a Guess moves to the next Round in
 * the same step, so keys pressed straight after land in the new Round.
 */
export function pressKey(run: Run, e: Entry, k: string, guessSet: Set<string>): { run: Run; entry: Entry } {
  const i = currentRound(run);
  if (i < 0) return { run, entry: e };
  let next: Entry = e;
  if (k === '⌫') next = { ...e, typed: e.typed.slice(0, -1), confirm: false, msg: '' };
  else if (k === '⏎') {
    if (e.confirm) return { run: { ...run, guesses: run.guesses.map((g, j) => (j === i ? e.typed : g)) }, entry: EMPTY_ENTRY };
    if (e.typed.length < 5) next = { ...e, msg: 'Not enough letters', shake: e.shake + 1 };
    else if (!guessSet.has(e.typed)) next = { ...e, msg: `${e.typed.toUpperCase()} is not an allowed Guess`, shake: e.shake + 1 };
    else next = { ...e, confirm: true, msg: `Lock in ${e.typed.toUpperCase()}? Enter again to confirm · ⌫ to edit` };
  } else if (/^[a-z]$/.test(k) && !e.confirm && e.typed.length < 5) next = { ...e, typed: e.typed + k, msg: '' };
  return { run, entry: next };
}
