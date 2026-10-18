/**
 * Parse Selby's plain-text tree format into the bare JSON shape.
 *
 * One line per Answer, the Path as `guess PATTERNn` pairs (n = turn number), e.g.
 *   salet BBBBB1 courd BBBBB2 nymph BBBBY3 whiff GGGGG4
 * In the default "hollow" style, a line only spells out the suffix that differs from
 * the line above; the shared prefix is replaced by spaces.
 */
import { isPattern, SOLVED, type RawTree } from '@wordle/core';

export function parseSelbyTree(text: string): RawTree {
  let root: RawTree | null = null;
  let prev = '';
  let lineNo = 0;
  for (const rawLine of text.split('\n')) {
    lineNo++;
    const line = rawLine.replace(/\s+$/, '');
    if (!line) continue;
    if (line === 'IMPOSSIBLE') throw new Error('Solver reported IMPOSSIBLE');
    const indent = line.length - line.trimStart().length;
    const full = prev.slice(0, indent) + line.slice(indent);
    prev = full;
    const t = full.trim().split(/\s+/);
    if (t.length % 2) throw new Error(`line ${lineNo}: odd number of tokens`);
    let node: RawTree | null = null;
    for (let i = 0; i < t.length; i += 2) {
      const guess = t[i];
      const pat = t[i + 1].slice(0, 5);
      if (!/^[a-z]{5}$/.test(guess) || !isPattern(pat) || Number(t[i + 1].slice(5)) !== i / 2 + 1) {
        throw new Error(`line ${lineNo}: bad pair "${guess} ${t[i + 1]}"`);
      }
      if (node === null) {
        root ??= [guess, {}];
        node = root;
      }
      if (node[0] !== guess) throw new Error(`line ${lineNo}: expected ${node[0]}, got ${guess}`);
      if (pat === SOLVED) {
        if (i + 2 !== t.length) throw new Error(`line ${lineNo}: GGGGG before the end of the line`);
        node[1][SOLVED] = 0;
        break;
      }
      if (i + 2 >= t.length) throw new Error(`line ${lineNo}: Path does not end in GGGGG`);
      let child: RawTree | 0 | undefined = node[1][pat];
      if (child === 0) throw new Error(`line ${lineNo}: ${pat} is already a leaf`);
      if (child === undefined) {
        child = [t[i + 2], {}];
        node[1][pat] = child;
      }
      node = child;
    }
  }
  if (!root) throw new Error('empty tree');
  return root;
}
