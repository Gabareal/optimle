import { createContext, useContext, useEffect, useState } from 'react';
import type { OpenersFile, TreeNode } from '@wordle/core';
import { loadAlts, loadOpeners, type Core, type LoadedAlts, type LoadedTree } from './data';
import type { Tab } from './hash';

export interface AppState {
  core: Core;
  tree: LoadedTree;
  /** The selected Game state. */
  node: TreeNode;
  /** The selected node's Guess was the Answer. */
  solved: boolean;
  tab: Tab;
  /** The Answer whose Path is highlighted, if one was searched or solved. */
  focusAnswer: string | null;
  whatIf: string;
  setWhatIf: (w: string) => void;
  /** Go to a Game state (pushes a history entry). */
  go: (node: TreeNode, opts?: { tab?: Tab; solved?: boolean }) => void;
  /** Jump to an Answer's full Path in the current tree. */
  showAnswer: (answer: string) => void;
  setTab: (tab: Tab) => void;
  switchOpener: (opener: string) => void;
}

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const s = useContext(AppContext);
  if (!s) throw new Error('useApp outside AppContext');
  return s;
}

/** Resolve a lazily loaded file; null until it arrives (or if it fails). */
function useLazy<T>(load: (() => Promise<T>) | null, deps: unknown[]): T | null {
  const [v, setV] = useState<T | null>(null);
  useEffect(() => {
    if (!load) return;
    let live = true;
    setV(null);
    load().then(
      (x) => live && setV(x),
      (e) => console.warn(e),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}

export const useAlts = (opener: string): LoadedAlts | null => useLazy(() => loadAlts(opener), [opener]);
export const useOpeners = (): OpenersFile | null => useLazy(loadOpeners, []);

/** True below the phone breakpoint (700 px). */
export function usePhone(): boolean {
  const q = '(max-width: 700px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}
