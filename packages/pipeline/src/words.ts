import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Provenance } from '@wordle/core';
import { ANSWERS_FILE, GUESSES_FILE } from './config.js';

export interface WordLists {
  /** Sorted. */
  answers: string[];
  /** Every allowed Guess, Answers included, sorted. */
  guesses: string[];
  hashes: Provenance['wordLists'];
}

function loadList(file: string): string[] {
  const words = readFileSync(file, 'utf8')
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  for (const w of words) if (!/^[a-z]{5}$/.test(w)) throw new Error(`${file}: "${w}" is not a 5-letter word`);
  return [...new Set(words)].sort();
}

export function sha256File(file: string): string {
  return 'sha256:' + createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function loadWordLists(): WordLists {
  const answers = loadList(ANSWERS_FILE);
  // Selby's solver also treats every Answer as a legal Guess.
  const guesses = [...new Set([...loadList(GUESSES_FILE), ...answers])].sort();
  return { answers, guesses, hashes: { answers: sha256File(ANSWERS_FILE), guesses: sha256File(GUESSES_FILE) } };
}
