/**
 * The Game state lives in the URL hash, in Selby's notation, so every Game state and
 * Answer Path is a shareable link and the back button rewinds:
 *
 *   #salet.BBBBB.courd                    Explore, after SALET scored BBBBB
 *   #salet.BBBBB.courd.BBBBB.nymph.BBBBY.whiff.GGGGG   a solved Answer
 *   #stats/salet.YBBBB.mucho               the Stats tab, scoped to that Game state
 *   #openers                               the Openers tab
 *   #salet.BBBBB.courd?whatif=nymph        Explore, with the What-if Guess pre-filled
 *                                          (the Ranked trainer's "Open in Visualiser")
 */
import { chain, isPattern, SOLVED, type Pattern, type TreeNode } from '@wordle/core';

export type Tab = 'explore' | 'stats' | 'openers';
export const TABS: { id: Tab; label: string }[] = [
  { id: 'explore', label: 'Explore the tree' },
  { id: 'stats', label: 'Stats' },
  { id: 'openers', label: 'Openers' },
];

export interface Route {
  tab: Tab;
  opener: string;
  /** Feedback patterns from the root. The Guesses in the hash are for readability; the tree fixes them. */
  patterns: Pattern[];
  /** The last Guess was the Answer. */
  solved: boolean;
  /** A What-if Guess to pre-fill, from `?whatif=`. Never written by formatHash. */
  whatIf: string | null;
}

export function parseHash(hash: string, defaultOpener: string): Route {
  let h = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase();
  const q = h.indexOf('?');
  const whatIf = q >= 0 ? (new URLSearchParams(h.slice(q + 1)).get('whatif') ?? '').replace(/[^a-z]/g, '').slice(0, 5) || null : null;
  if (q >= 0) h = h.slice(0, q);
  let tab: Tab = 'explore';
  const m = /^(stats|openers|explore)(?:\/|$)/.exec(h);
  if (m) {
    tab = m[1] as Tab;
    h = h.slice(m[0].length);
  }
  const tokens = h.split('.').filter(Boolean);
  const opener = /^[a-z]{5}$/.test(tokens[0] ?? '') ? tokens[0] : defaultOpener;
  const patterns: Pattern[] = [];
  let solved = false;
  for (let i = 1; i < tokens.length; i += 2) {
    const p = tokens[i].toUpperCase();
    if (!isPattern(p)) break;
    if (p === SOLVED) {
      solved = true;
      break;
    }
    patterns.push(p);
  }
  return { tab, opener, patterns, solved, whatIf };
}

/** The hash for a Game state in a tree. */
export function formatHash(tab: Tab, node: TreeNode | null, solved = false): string {
  const state = node
    ? chain(node)
        .map((n) => (n.pattern ? `${n.pattern}.${n.guess}` : n.guess))
        .join('.') + (solved ? `.${SOLVED}` : '')
    : '';
  if (tab === 'explore') return `#${state}`;
  return state ? `#${tab}/${state}` : `#${tab}`;
}
