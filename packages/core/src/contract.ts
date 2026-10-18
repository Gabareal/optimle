/**
 * The Tree data contract: the JSON files the pipeline writes and the site loads.
 * Every file is `{ provenance, ...payload }`.
 */
import type { RawTree } from './tree.js';

export interface Provenance {
  /** What this file is, e.g. "Optimal tree for SALET". */
  title: string;
  /** Who produced the data, e.g. "Alex Selby, MIT licence (alex1770/wordle)". */
  source: string;
  /** SHA-256 of the word-list files, as `sha256:<hex>`. */
  wordLists: { answers: string; guesses: string };
  /** Pinned commit of the vendored solver, when it was used. */
  solverCommit?: string;
  /** Total Guesses over all Answers, for files that describe one tree. */
  total?: number;
  /** ISO date the file was generated. */
  generated: string;
  /** Free-form notes, e.g. how a stand-in was produced. */
  notes?: string;
}

export interface WordListFile {
  provenance: Provenance;
  words: string[];
}

export interface TreeFile {
  provenance: Provenance;
  opener: string;
  tree: RawTree;
}

/** One alternative Guess at a Game state: its exact total, and whether it ties the tree's Guess. */
export type Alternative = [guess: string, total: number, alsoOptimal: 0 | 1];

export interface AltsFile {
  provenance: Provenance & { k: number };
  opener: string;
  /**
   * Keyed by the patterns from the root joined with ".", "" for the root itself.
   * Each list is sorted by total (best first), at most K long, and includes the
   * tree's own Guess when the solver ranked it within the top K.
   */
  nodes: Record<string, Alternative[]>;
}

export const STRATEGIES = ['optimal', 'greedy', 'answersOnly'] as const;
export type StrategyId = (typeof STRATEGIES)[number];

export interface StrategiesFile {
  provenance: Provenance;
  /** Aligned with answers.json. */
  answers: string[];
  strategies: Record<StrategyId, { label: string; opener: string; total: number; counts: number[]; notes?: string }>;
}

export interface OpenersFile {
  provenance: Provenance;
  /** Selby's proven exact totals, best first. */
  leaderboard: [guess: string, total: number][];
  /** Entropy (bits) of every Guess as an opener over all Answers, aligned with guesses.json. A heuristic. */
  entropy: number[];
}

/**
 * Exact scores for every allowed Guess at one Eligible Game state, for the Ranked trainer.
 * One file per state, fetched only when a Round needs it.
 */
export interface ScoresFile {
  provenance: Provenance;
  opener: string;
  /** The patterns from the root joined with ".", as in AltsFile. */
  key: string;
  /** Candidates at this Game state. */
  size: number;
  /** The optimal total from here (the tree's own cost). */
  optimal: number;
  /**
   * Aligned with guesses.json: each Guess's total minus `optimal`. Always 0..size, since the
   * worst Guess reveals nothing and costs every Candidate one extra Guess.
   */
  deltas: number[];
}

/** The curated openers whose trees ship (SALET first; it loads eagerly). */
export const CURATED_OPENERS = ['salet', 'crane', 'slate', 'trace', 'crate', 'adieu', 'audio', 'roate'] as const;

export const dataFiles = {
  answers: 'answers.json',
  guesses: 'guesses.json',
  strategies: 'strategies.json',
  openers: 'openers.json',
  tree: (opener: string) => `tree.${opener}.json`,
  alts: (opener: string) => `alts.${opener}.json`,
  scores: (opener: string, key: string) => `scores.${opener}/${key}.json`,
};

/** The tree the Ranked trainer draws from and scores against. */
export const RANKED_OPENER = 'salet';
