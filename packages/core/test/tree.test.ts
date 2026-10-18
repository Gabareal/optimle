import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  deriveTree,
  feedback,
  findAnswer,
  followPatterns,
  guessCounts,
  pathOf,
  stateString,
  summariseSplit,
  validateTree,
  type RawTree,
  type TreeFile,
  type WordListFile,
} from '../src/index.js';

const data = (f: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../../site/public/data/${f}`, import.meta.url)), 'utf8'));

// A tiny hand-made tree over four Answers. CIGAR gives each of the others its own pattern:
// REBUT BBBBY, HUMPH BBBBB, SISSY BGBBB.
const ANSWERS = ['cigar', 'rebut', 'sissy', 'humph'];
const raw: RawTree = [
  'cigar',
  { GGGGG: 0, BBBBY: ['rebut', { GGGGG: 0 }], BBBBB: ['humph', { GGGGG: 0 }], BGBBB: ['sissy', { GGGGG: 0 }] },
];

describe('deriveTree on a small tree', () => {
  it('derives Candidates, cost, Expected guesses and entropy', () => {
    const root = deriveTree(raw);
    expect(root.candidates).toEqual([...ANSWERS].sort());
    expect(root.size).toBe(4);
    expect(root.cost).toBe(1 + 2 + 2 + 2);
    expect(root.expected).toBeCloseTo(7 / 4);
    expect(root.entropy).toBeCloseTo(2);
    expect(guessCounts(root).get('sissy')).toBe(2);
    expect(validateTree(raw, { answers: ANSWERS, guesses: ANSWERS, expectedTotal: 7 }).errors).toEqual([]);
  });

  it('rejects a tree whose patterns are wrong', () => {
    const bad: RawTree = ['cigar', { GGGGG: 0, BBBBB: ['rebut', { GGGGG: 0, BBBBB: ['humph', { GGGGG: 0 }] }], BGBBB: ['sissy', { GGGGG: 0 }] }];
    const r = validateTree(bad, { answers: ANSWERS, guesses: ANSWERS });
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toMatch(/missing subtree for BBBBY/);
  });

  it('rejects a missing Answer and a wrong total', () => {
    const r = validateTree(['cigar', { GGGGG: 0 }], { answers: ['cigar', 'rebut'], guesses: ANSWERS, expectedTotal: 2 });
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toMatch(/missing subtree/);
    expect(r.errors.join('\n')).toMatch(/does not match the expected 2/);
  });

  it('rejects a Guess outside the allowed list', () => {
    const r = validateTree(raw, { answers: ANSWERS, guesses: ['rebut', 'sissy', 'humph'] });
    expect(r.errors).toEqual(['#: cigar is not an allowed Guess']);
  });
});

describe('the SALET tree', () => {
  const answers: string[] = (data('answers.json') as WordListFile).words;
  const guesses: string[] = (data('guesses.json') as WordListFile).words;
  const file = data('tree.salet.json') as TreeFile;
  const root = deriveTree(file.tree);

  it('has the published lists', () => {
    expect(answers).toHaveLength(2315);
    expect(guesses).toHaveLength(12972);
  });

  it('reproduces the 7,920 total from derived stats', () => {
    expect(root.size).toBe(2315);
    expect(root.cost).toBe(7920);
    expect(root.expected.toFixed(4)).toBe('3.4212');
    const counts = guessCounts(root);
    expect(counts.size).toBe(2315);
    expect([...counts.values()].reduce((s, n) => s + n, 0)).toBe(7920);
    expect(file.provenance.total).toBe(7920);
  });

  it('passes the validator', () => {
    const r = validateTree(file.tree, { answers, guesses, expectedTotal: 7920 });
    expect(r.errors).toEqual([]);
    expect(r.answersSolved).toBe(2315);
  });

  it('matches the stats shown at the root', () => {
    const s = summariseSplit('salet', answers);
    expect(root.groups.length).toBe(s.groups.length);
    expect(root.entropy).toBeCloseTo(s.entropy, 10);
    expect(Math.max(...root.groups)).toBe(s.largest);
  });

  it('walks Paths and Game states', () => {
    const path = pathOf(root, 'whiff')!;
    expect(path[0].guess).toBe('salet');
    expect(path[path.length - 1].guess).toBe('whiff');
    for (let i = 1; i < path.length; i++) expect(path[i].pattern).toBe(feedback(path[i - 1].guess, 'whiff'));
    expect(findAnswer(root, 'salet')).toBeNull(); // a Guess, never an Answer
    const n = followPatterns(root, ['BBBBB']);
    expect(stateString(n)).toBe(`salet.BBBBB.${n.guess}`);
  });
});
