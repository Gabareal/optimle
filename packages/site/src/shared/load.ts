/**
 * Fetching the data files, shared by both pages. Data lives at the site root's `data/`,
 * so each page says where the root is relative to itself: `./` for the Visualiser at `/`,
 * `../` for the Ranked trainer at `/ranked/`.
 */
import { dataFiles, deriveTree, type TreeFile, type TreeNode, type WordListFile } from '@wordle/core';

let siteRoot = './';

/** Call once from each page's entry, before anything loads. */
export function setSiteRoot(root: string): void {
  siteRoot = root;
}

/** A path relative to the site root, e.g. `siteUrl('ranked/')`. */
export const siteUrl = (path: string): string => siteRoot + path;

export async function getJson<T>(file: string): Promise<T> {
  const r = await fetch(siteUrl(`data/${file}`));
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

const memo = new Map<string, Promise<unknown>>();
/** Load once per page; a failed load is forgotten so it can be retried. */
export function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  let p = memo.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load();
    memo.set(key, p);
    p.catch(() => memo.delete(key));
  }
  return p;
}

export interface LoadedTree {
  opener: string;
  file: TreeFile;
  root: TreeNode;
  /** Set when the derived total disagrees with the file's provenance header. */
  totalMismatch: string | null;
}

export function loadTree(opener: string): Promise<LoadedTree> {
  return once(`tree:${opener}`, async () => {
    const file = await getJson<TreeFile>(dataFiles.tree(opener));
    const root = deriveTree(file.tree);
    const header = file.provenance.total;
    const totalMismatch =
      header !== undefined && header !== root.cost
        ? `This tree totals ${root.cost} guesses but its header says ${header}. The data may be corrupt.`
        : null;
    return { opener, file, root, totalMismatch };
  });
}

/** The allowed Guesses, in guesses.json order (the order score files are aligned with). */
export function loadGuesses(): Promise<string[]> {
  return once('guesses', async () => (await getJson<WordListFile>(dataFiles.guesses)).words);
}
