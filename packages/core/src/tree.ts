/**
 * Decision trees: the bare shape shipped as JSON, and the Game-state view derived from it.
 *
 * A bare node is `[guess, { pattern: child | 0 }]`. The value 0 marks a GGGGG leaf: the
 * node's Guess is the Answer. Everything else (Candidate sets, sizes, Expected guesses,
 * entropy) is derived here, so the shipped files stay small (see the Tree data contract).
 */
import { SOLVED, type Pattern } from './feedback.js';
import { entropy } from './split.js';

export type RawTree = [guess: string, children: Record<Pattern, RawTree | 0>];

export interface TreeNode {
  /** The Guess the tree plays at this Game state. */
  guess: string;
  /** The Feedback pattern on the edge from the parent; null at the root. */
  pattern: Pattern | null;
  parent: TreeNode | null;
  /** 0 at the root: the number of Guesses already played. */
  depth: number;
  /** Patterns leading on from here, largest group first. GGGGG is not a child. */
  children: TreeNode[];
  childByPattern: Map<Pattern, TreeNode>;
  /** True when the Guess is itself a Candidate (the tree has a GGGGG leaf here). */
  solvesHere: boolean;
  /** The Candidate set, alphabetical. */
  candidates: string[];
  size: number;
  /** Total Guesses from here (this one included) summed over the Candidates. */
  cost: number;
  /** Expected guesses from this Game state: cost / size. */
  expected: number;
  /** Sizes of the groups the Guess splits the Candidates into, GGGGG included. */
  groups: number[];
  /** Entropy of that split, in bits. */
  entropy: number;
}

export function deriveTree(raw: RawTree): TreeNode {
  const root = build(raw, null, null, 0);
  return root;
}

function build(raw: RawTree, parent: TreeNode | null, pattern: Pattern | null, depth: number): TreeNode {
  const node: TreeNode = {
    guess: raw[0],
    pattern,
    parent,
    depth,
    children: [],
    childByPattern: new Map(),
    solvesHere: false,
    candidates: [],
    size: 0,
    cost: 0,
    expected: 0,
    groups: [],
    entropy: 0,
  };
  const cands: string[] = [];
  let below = 0;
  for (const [p, child] of Object.entries(raw[1])) {
    if (child === 0) {
      if (p !== SOLVED) throw new Error(`Leaf under non-GGGGG pattern ${p} at ${raw[0]}`);
      node.solvesHere = true;
      cands.push(node.guess);
      continue;
    }
    const k = build(child, node, p, depth + 1);
    node.children.push(k);
    node.childByPattern.set(p, k);
    for (const c of k.candidates) cands.push(c);
    below += k.cost;
  }
  node.children.sort((a, b) => b.size - a.size || (a.pattern! < b.pattern! ? -1 : 1));
  node.candidates = cands.sort();
  node.size = cands.length;
  // Every Candidate pays for this Guess; those not solved here also pay for their subtree.
  node.cost = node.size + below;
  node.expected = node.cost / node.size;
  node.groups = node.children.map((k) => k.size);
  if (node.solvesHere) node.groups.push(1);
  node.entropy = entropy(node.groups, node.size);
  return node;
}

/** Root first, `node` last. */
export function chain(node: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  for (let n: TreeNode | null = node; n; n = n.parent) out.unshift(n);
  return out;
}

/** The node whose Guess is `answer`, i.e. the end of that Answer's Path; null if not an Answer. */
export function findAnswer(root: TreeNode, answer: string): TreeNode | null {
  let n = root;
  for (;;) {
    if (n.guess === answer && n.solvesHere) return n;
    const next = n.children.find((k) => binaryIncludes(k.candidates, answer));
    if (!next) return null;
    n = next;
  }
}

/** The Path for `answer`: every Game state it passes through, root first. */
export function pathOf(root: TreeNode, answer: string): TreeNode[] | null {
  const end = findAnswer(root, answer);
  return end ? chain(end) : null;
}

/** Number of Guesses the tree needs for each Answer. */
export function guessCounts(root: TreeNode): Map<string, number> {
  const out = new Map<string, number>();
  walk(root, (n) => {
    if (n.solvesHere) out.set(n.guess, n.depth + 1);
  });
  return out;
}

export function totalGuesses(root: TreeNode): number {
  return root.cost;
}

export function walk(root: TreeNode, visit: (n: TreeNode) => void): void {
  visit(root);
  for (const k of root.children) walk(k, visit);
}

/** Every node, root first, depth-first. */
export function allNodes(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  walk(root, (n) => out.push(n));
  return out;
}

/** Patterns from the root to `node`, e.g. ["BBBBB", "BBBBY"]; [] for the root. */
export function patternPath(node: TreeNode): Pattern[] {
  return chain(node)
    .slice(1)
    .map((n) => n.pattern!);
}

/** Selby-style Game-state string: "salet.BBBBB.courd". */
export function stateString(node: TreeNode): string {
  return chain(node)
    .map((n) => (n.pattern ? `${n.pattern}.${n.guess}` : n.guess))
    .join('.');
}

/** Follow a list of patterns from the root; stops early at the first that isn't an edge. */
export function followPatterns(root: TreeNode, patterns: Pattern[]): TreeNode {
  let n = root;
  for (const p of patterns) {
    const k = n.childByPattern.get(p);
    if (!k) break;
    n = k;
  }
  return n;
}

function binaryIncludes(sorted: string[], w: string): boolean {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === w) return true;
    if (sorted[mid] < w) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}
