import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveTree, validateTree } from '@wordle/core';
import { PUBLISHED_SALET_TREE } from '../src/config.js';
import { FeedbackMatrix, greedyEntropyTree } from '../src/greedy.js';
import { parseSelbyTree } from '../src/selby-tree.js';
import { parseFirstGuesses } from '../src/solver.js';
import { loadWordLists } from '../src/words.js';

describe('parseSelbyTree', () => {
  it('reads hollow-style lines', () => {
    const raw = parseSelbyTree(
      ['salet BBBBB1 courd BBBBB2 nymph BBBBY3 whiff GGGGG4', '                                BGYYB3 pygmy GGGGG4', ''].join('\n'),
    );
    expect(raw).toEqual(['salet', { BBBBB: ['courd', { BBBBB: ['nymph', { BBBBY: ['whiff', { GGGGG: 0 }], BGYYB: ['pygmy', { GGGGG: 0 }] }] }] }]);
  });

  it("reads Selby's published SALET tree: 2,315 Answers, 7,920 Guesses", () => {
    const lists = loadWordLists();
    const raw = parseSelbyTree(readFileSync(PUBLISHED_SALET_TREE, 'utf8'));
    const r = validateTree(raw, { answers: lists.answers, guesses: lists.guesses, expectedTotal: 7920 });
    expect(r.errors).toEqual([]);
    expect(r.maxGuesses).toBe(5);
  });

  it('rejects a Path that skips a turn number', () => {
    expect(() => parseSelbyTree('salet BBBBB1 courd GGGGG3')).toThrow(/bad pair/);
  });
});

describe('greedyEntropyTree', () => {
  it('builds a valid tree and prefers Candidates on ties', () => {
    const answers = ['cigar', 'rebut', 'sissy', 'humph', 'awake', 'blush'];
    const guesses = [...answers, 'zzzzz'].sort();
    const raw = greedyEntropyTree(new FeedbackMatrix(guesses, answers));
    expect(validateTree(raw, { answers, guesses }).errors).toEqual([]);
    // With two Candidates left every splitting Guess gets 1 bit, so a Candidate is played.
    const root = deriveTree(raw);
    for (const k of root.children) if (k.size === 2) expect(k.candidates).toContain(k.guess);
  });
});

describe('parseFirstGuesses', () => {
  it('reads exact scores and bounds', () => {
    const out = 'First guess round  =        612         0 /    10\nFirst guess qajaq >=       7920   1 / 2';
    expect(parseFirstGuesses(out)).toEqual([
      { guess: 'round', total: 612, exact: true },
      { guess: 'qajaq', total: 7920, exact: false },
    ]);
  });
});
