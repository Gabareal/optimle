/**
 * The Ranked trainer's pure logic: which Game states can be drawn, how a Run draws its
 * five, and how a Guess is scored. No DOM; the site and the pipeline both use it.
 *
 * The draw follows the "Draw weighting and depth schedule feel" decision: Rounds come
 * from turns 2, 2, 3+, 3+, 3+; within a turn bucket each state is weighted by its
 * Candidate count (Path frequency); no state repeats, and no two Rounds share a First
 * row unless every First row in the bucket is used up.
 */
import { chain, type TreeNode } from './tree.js';
import type { Pattern } from './feedback.js';

/** An Eligible Game state has at least this many Candidates (and isn't the root). */
export const MIN_ELIGIBLE_CANDIDATES = 3;
export const ROUNDS = 5;

export function isEligible(n: TreeNode): boolean {
  return n.parent !== null && n.size >= MIN_ELIGIBLE_CANDIDATES;
}

/** Every Eligible Game state, depth-first from the root. */
export function eligibleStates(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const visit = (n: TreeNode) => {
    if (isEligible(n)) out.push(n);
    for (const k of n.children) visit(k);
  };
  visit(root);
  return out;
}

/** The turn about to be played at a Game state: 2 after the opener. */
export const turnOf = (n: TreeNode): number => n.depth + 1;

/** The opener's Feedback pattern: the First row of the board at this Game state. */
export const firstRow = (n: TreeNode): Pattern => chain(n)[1].pattern!;

export type TurnBucket = '2' | '3+';
export const SCHEDULE: readonly TurnBucket[] = ['2', '2', '3+', '3+', '3+'];
const inBucket = (n: TreeNode, b: TurnBucket) => (b === '2' ? turnOf(n) === 2 : turnOf(n) >= 3);

/** A seeded PRNG in [0, 1): a string hash feeding mulberry32. The same seed gives the same Run. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DrawOptions {
  /** Weight = Candidates^alpha. 1 is Path frequency (the decision); 0 is uniform. */
  alpha?: number;
  schedule?: readonly TurnBucket[];
}

export interface DrawnRound {
  state: TreeNode;
  bucket: TurnBucket;
  /** The chance this state had of being drawn, given the Rounds before it. */
  chance: number;
}

/** Draw a Run's Game states from `states` (the Eligible ones), deterministically from `seed`. */
export function drawRun(states: readonly TreeNode[], seed: string, opts: DrawOptions = {}): DrawnRound[] {
  const alpha = opts.alpha ?? 1;
  const schedule = opts.schedule ?? SCHEDULE;
  const rand = seededRandom(seed);
  const weight = (n: TreeNode) => Math.pow(n.size, alpha);
  const used = new Set<TreeNode>();
  const usedRows = new Set<Pattern>();
  return schedule.map((bucket) => {
    let pool = states.filter((n) => inBucket(n, bucket) && !used.has(n));
    const fresh = pool.filter((n) => !usedRows.has(firstRow(n)));
    if (fresh.length) pool = fresh;
    if (!pool.length) throw new Error(`No Eligible Game state left for turn ${bucket}`);
    const total = pool.reduce((t, n) => t + weight(n), 0);
    let x = rand() * total;
    let state = pool[pool.length - 1];
    for (const n of pool) {
      x -= weight(n);
      if (x < 0) {
        state = n;
        break;
      }
    }
    used.add(state);
    usedRows.add(firstRow(state));
    return { state, bucket, chance: weight(state) / total };
  });
}

/** A fresh random seed for free play. */
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Scoring. PROVISIONAL: the "Scoring formula" ticket is still open; everything that
// depends on the formula goes through scoreRound so it can be swapped in one place.

export const MAX_POINTS = 100;
/** Extra Expected guesses at which a Round scores 0. */
export const ZERO_AT = 0.5;

export type Tier = 'Optimal' | 'Excellent' | 'Good' | 'OK' | 'Miss';

export interface RoundScore {
  /** Extra total Guesses over optimal, summed over the Candidates. */
  delta: number;
  /** Extra Expected guesses over optimal: delta / Candidates. 0..1. */
  extra: number;
  points: number;
  tier: Tier;
}

export function scoreRound(delta: number, size: number): RoundScore {
  const extra = delta / size;
  const points = Math.round(MAX_POINTS * Math.max(0, 1 - extra / ZERO_AT));
  const tier: Tier = delta === 0 ? 'Optimal' : extra <= 0.05 ? 'Excellent' : extra <= 0.15 ? 'Good' : extra <= 0.3 ? 'OK' : 'Miss';
  return { delta, extra, points, tier };
}

/** The shareable square for a Round. */
export function tierEmoji(s: RoundScore): string {
  return s.tier === 'Optimal' ? '🟩' : s.points >= 50 ? '🟨' : '⬛';
}
