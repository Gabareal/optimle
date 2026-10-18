/** How a Guess splits a Candidate set into groups, one per Feedback pattern. */
import { decodePattern, feedbackCode, PATTERN_COUNT, type Pattern } from './feedback.js';

/** Entropy in bits of a split with these group sizes over `total` Candidates. */
export function entropy(groups: readonly number[], total: number): number {
  let h = 0;
  // Sorting makes equal splits give bit-identical results, so ties compare equal.
  for (const g of [...groups].sort((a, b) => a - b)) {
    if (g > 0) h -= (g / total) * Math.log2(g / total);
  }
  return h === 0 ? 0 : h;
}

/** The Candidates grouped by the pattern `guess` would get against each one. */
export function splitCandidates(guess: string, candidates: readonly string[]): Map<Pattern, string[]> {
  const byCode = new Map<number, string[]>();
  for (const a of candidates) {
    const c = feedbackCode(guess, a);
    let g = byCode.get(c);
    if (!g) byCode.set(c, (g = []));
    g.push(a);
  }
  const out = new Map<Pattern, string[]>();
  for (const [c, g] of byCode) out.set(decodePattern(c), g);
  return out;
}

export interface SplitSummary {
  guess: string;
  /** Group sizes, largest first. */
  groups: number[];
  largest: number;
  entropy: number;
  /** True when the Guess is one of the Candidates (it can win this turn). */
  canWin: boolean;
}

export function summariseSplit(guess: string, candidates: readonly string[]): SplitSummary {
  const counts = new Int32Array(PATTERN_COUNT);
  let canWin = false;
  for (const a of candidates) {
    counts[feedbackCode(guess, a)]++;
    if (a === guess) canWin = true;
  }
  const groups = [...counts].filter((c) => c > 0).sort((a, b) => b - a);
  return { guess, groups, largest: groups[0] ?? 0, entropy: entropy(groups, candidates.length), canWin };
}
