/**
 * Independent check of a bare Decision tree against the word lists.
 *
 * Starting from all Answers at the root, every node's Guess is re-scored against its
 * Candidates. The node's edges must be exactly the patterns that occur, each child
 * must be validated against exactly its group, and a GGGGG leaf must appear exactly
 * when the Guess is a Candidate. Together these prove that the groups partition every
 * Candidate set and that every Answer reaches exactly one GGGGG leaf.
 */
import { decodePattern, feedbackCode, SOLVED } from './feedback.js';
import type { RawTree } from './tree.js';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  /** Recomputed total Guesses over all Answers. */
  total: number;
  answersSolved: number;
  nodes: number;
  maxGuesses: number;
}

export interface ValidateOptions {
  answers: readonly string[];
  /** Allowed Guesses; every Guess in the tree must be one of these. */
  guesses: readonly string[];
  /** If given, the recomputed total must equal it (e.g. the provenance header's total). */
  expectedTotal?: number;
  /** Stop collecting after this many errors. */
  maxErrors?: number;
}

export function validateTree(raw: RawTree, opts: ValidateOptions): ValidationResult {
  const allowed = new Set(opts.guesses);
  const maxErrors = opts.maxErrors ?? 50;
  const errors: string[] = [];
  const seen = new Set<string>();
  let total = 0;
  let nodes = 0;
  let maxGuesses = 0;
  const err = (m: string) => {
    if (errors.length < maxErrors) errors.push(m);
  };

  const visit = (node: RawTree, cands: readonly string[], depth: number, where: string) => {
    nodes++;
    if (!Array.isArray(node) || node.length !== 2 || typeof node[0] !== 'string' || typeof node[1] !== 'object') {
      err(`${where}: malformed node`);
      return;
    }
    const [guess, kids] = node;
    if (!allowed.has(guess)) err(`${where}: ${guess} is not an allowed Guess`);
    const groups = new Map<string, string[]>();
    for (const a of cands) {
      const p = decodePattern(feedbackCode(guess, a));
      let g = groups.get(p);
      if (!g) groups.set(p, (g = []));
      g.push(a);
    }
    for (const p of Object.keys(kids)) {
      if (!groups.has(p)) err(`${where}.${guess}: edge ${p} matches no Candidate`);
    }
    for (const [p, g] of groups) {
      const child = kids[p];
      if (p === SOLVED) {
        if (child !== 0) err(`${where}.${guess}: GGGGG must be a leaf (0)`);
        if (seen.has(guess)) err(`Answer ${guess} is solved more than once`);
        seen.add(guess);
        total += depth + 1;
        maxGuesses = Math.max(maxGuesses, depth + 1);
        continue;
      }
      if (child === undefined || child === 0) {
        err(`${where}.${guess}: missing subtree for ${p} (${g.length} Candidates: ${g.slice(0, 5).join(' ')}…)`);
        continue;
      }
      visit(child, g, depth + 1, `${where}.${guess}.${p}`);
    }
  };

  visit(raw, opts.answers, 0, '#');
  for (const a of opts.answers) if (!seen.has(a)) err(`Answer ${a} never reaches GGGGG`);
  if (opts.expectedTotal !== undefined && total !== opts.expectedTotal) {
    err(`total ${total} does not match the expected ${opts.expectedTotal}`);
  }
  return { ok: errors.length === 0, errors, total, answersSolved: seen.size, nodes, maxGuesses };
}
