import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { deriveTree, drawRun, eligibleStates, firstRow, scoreRound, turnOf, type TreeFile } from '../src/index.js';

const salet = deriveTree(
  (JSON.parse(readFileSync(fileURLToPath(new URL('../../site/public/data/tree.salet.json', import.meta.url)), 'utf8')) as TreeFile)
    .tree,
);
const states = eligibleStates(salet);

describe('eligibleStates', () => {
  it('finds the 283 SALET states with 3+ Candidates: 96 at turn 2, 181 at turn 3, 6 at turn 4', () => {
    expect(states.length).toBe(283);
    const byTurn = (t: number) => states.filter((n) => turnOf(n) === t).length;
    expect([byTurn(2), byTurn(3), byTurn(4)]).toEqual([96, 181, 6]);
    expect(states.every((n) => n.parent && n.size >= 3)).toBe(true);
  });
});

describe('drawRun', () => {
  it('is deterministic for a seed', () => {
    const a = drawRun(states, 'daily-1').map((r) => r.state);
    const b = drawRun(states, 'daily-1').map((r) => r.state);
    expect(a).toEqual(b);
    expect(drawRun(states, 'daily-2').map((r) => r.state)).not.toEqual(a);
  });

  it('follows the turn schedule, never repeats a state and never shares a First row', () => {
    for (let i = 0; i < 300; i++) {
      const run = drawRun(states, `seed${i}`);
      expect(run.map((r) => (turnOf(r.state) === 2 ? '2' : '3+'))).toEqual(['2', '2', '3+', '3+', '3+']);
      expect(new Set(run.map((r) => r.state)).size).toBe(5);
      expect(new Set(run.map((r) => firstRow(r.state))).size).toBe(5);
    }
  });

  it('weights by Path frequency: the 221-Candidate all-grey state leads turn 2', () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i++) {
      const s = drawRun(states, `f${i}`)[0].state;
      counts.set(s.pattern!, (counts.get(s.pattern!) ?? 0) + 1);
    }
    // 221 / 2,245 of turn-2 weight ≈ 9.8% of first Rounds.
    const share = counts.get('BBBBB')! / 2000;
    expect(share).toBeGreaterThan(0.07);
    expect(share).toBeLessThan(0.13);
    expect([...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]).toBe('BBBBB');
  });
});

describe('scoreRound (provisional formula)', () => {
  it('gives full marks only to optimal Guesses and zero from +0.5 Expected guesses', () => {
    expect(scoreRound(0, 10)).toMatchObject({ points: 100, tier: 'Optimal', extra: 0 });
    expect(scoreRound(1, 100)).toMatchObject({ points: 98, tier: 'Excellent' });
    expect(scoreRound(1, 10)).toMatchObject({ points: 80, tier: 'Good' });
    expect(scoreRound(3, 10)).toMatchObject({ points: 40, tier: 'OK' });
    expect(scoreRound(5, 10)).toMatchObject({ points: 0, tier: 'Miss' });
    expect(scoreRound(10, 10).points).toBe(0);
  });
});
