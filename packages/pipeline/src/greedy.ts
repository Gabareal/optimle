/**
 * Greedy-entropy: at every Game state, play the Guess whose split of the Candidate set
 * has the highest entropy. Ties go first to a Guess that is a Candidate, then
 * alphabetically. The opener is chosen the same way.
 */
import { decodePattern, feedbackCode, SOLVED_CODE, type RawTree } from '@wordle/core';

/** Two entropies closer than this count as a tie (summation order can differ in the last bits). */
const TIE = 1e-9;

/** feedback codes, indexed [guess * answers + answer]. */
export class FeedbackMatrix {
  readonly codes: Uint8Array;
  constructor(
    readonly guesses: readonly string[],
    readonly answers: readonly string[],
  ) {
    const na = answers.length;
    this.codes = new Uint8Array(guesses.length * na);
    for (let g = 0; g < guesses.length; g++) {
      const gw = guesses[g];
      const row = g * na;
      for (let a = 0; a < na; a++) this.codes[row + a] = feedbackCode(gw, answers[a]);
    }
  }
}

const xlogx = (() => {
  const t = new Float64Array(4096);
  for (let c = 1; c < t.length; c++) t[c] = c * Math.log2(c);
  return t;
})();

/** Entropy of every Guess over the Candidates (indexes into `answers`). */
export function entropies(m: FeedbackMatrix, cands: readonly number[]): Float64Array {
  const na = m.answers.length;
  const n = cands.length;
  const out = new Float64Array(m.guesses.length);
  const counts = new Int32Array(243);
  for (let g = 0; g < m.guesses.length; g++) {
    const row = g * na;
    for (const a of cands) counts[m.codes[row + a]]++;
    let s = 0;
    for (const a of cands) {
      const c = counts[m.codes[row + a]];
      if (c) {
        s += xlogx[c];
        counts[m.codes[row + a]] = 0;
      }
    }
    out[g] = Math.log2(n) - s / n;
  }
  return out;
}

export function greedyEntropyTree(m: FeedbackMatrix): RawTree {
  const guessIndex = new Map(m.guesses.map((w, i) => [w, i]));
  const answerIndexOfGuess = m.guesses.map((w) => m.answers.indexOf(w));
  const na = m.answers.length;

  const solve = (cands: number[]): RawTree => {
    let best: number;
    if (cands.length === 1) {
      best = guessIndex.get(m.answers[cands[0]])!;
    } else {
      const h = entropies(m, cands);
      const isCand = new Set(cands);
      best = 0;
      for (let g = 1; g < h.length; g++) {
        const d = h[g] - h[best];
        if (d > TIE) best = g;
        else if (d > -TIE && isCand.has(answerIndexOfGuess[g]) && !isCand.has(answerIndexOfGuess[best])) best = g;
      }
    }
    const groups = new Map<number, number[]>();
    const row = best * na;
    for (const a of cands) {
      const c = m.codes[row + a];
      let g = groups.get(c);
      if (!g) groups.set(c, (g = []));
      g.push(a);
    }
    const kids: RawTree[1] = {};
    for (const [c, g] of [...groups].sort((x, y) => x[0] - y[0])) {
      kids[decodePattern(c)] = c === SOLVED_CODE ? 0 : solve(g);
    }
    return [m.guesses[best], kids];
  };

  return solve(m.answers.map((_, i) => i));
}
