/** The Ranked trainer page: a Run of five Rounds, then the breakdown. */
import { useCallback, useEffect, useReducer, useState } from 'react';
import { RANKED_OPENER } from '@wordle/core';
import { SitePage } from '../shared/Chrome';
import { loadGuesses, loadTree, type LoadedTree } from '../shared/load';
import { Breakdown } from './Breakdown';
import { Round } from './Round';
import { currentRound, EMPTY_ENTRY, loadScores, newRun, pressKey, restoreRun, saveRun, type Entry, type Run } from './run';

interface Loaded {
  tree: LoadedTree;
  guesses: string[];
  guessSet: Set<string>;
}

interface Play {
  run: Run;
  entry: Entry;
  guessSet: Set<string>;
}

type Action = { type: 'start'; run: Run; guessSet: Set<string> } | { type: 'key'; key: string };

function play(p: Play | null, a: Action): Play | null {
  if (a.type === 'start') return { run: a.run, entry: EMPTY_ENTRY, guessSet: a.guessSet };
  if (!p) return p;
  return { ...p, ...pressKey(p.run, p.entry, a.key, p.guessSet) };
}

export function Ranked() {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, dispatch] = useReducer(play, null);
  const press = useCallback((key: string) => dispatch({ type: 'key', key }), []);

  useEffect(() => {
    Promise.all([loadTree(RANKED_OPENER), loadGuesses()]).then(
      ([tree, guesses]) => {
        const guessSet = new Set(guesses);
        setData({ tree, guesses, guessSet });
        dispatch({ type: 'start', run: restoreRun(tree.root, guessSet) ?? newRun(tree.root), guessSet });
      },
      (e) => setError(String(e)),
    );
  }, []);

  const run = state?.run;
  useEffect(() => {
    if (!run) return;
    saveRun(run);
    // Fetch the current Round's scores while the player thinks, so the breakdown is instant.
    const i = currentRound(run);
    if (i >= 0) loadScores(run.states[i]).catch(() => {});
  }, [run]);

  let body;
  if (error) body = <p className="bad">Could not load the data: {error}</p>;
  else if (!data || !state) {
    body = (
      <p className="muted" aria-live="polite">
        Loading the tree…
      </p>
    );
  } else {
    const i = currentRound(state.run);
    const restart = () => dispatch({ type: 'start', run: newRun(data.tree.root), guessSet: data.guessSet });
    body =
      i >= 0 ? (
        <Round state={state.run.states[i]} index={i} rounds={state.run.states.length} entry={state.entry} press={press} />
      ) : (
        <Breakdown run={state.run} guesses={data.guesses} onNewRun={restart} />
      );
  }

  return (
    <SitePage
      page="ranked"
      tree={data?.tree.file.provenance}
      mainClass={`rk ${state && currentRound(state.run) < 0 ? 'wide' : ''}`}
      footerExtra="Each Round is a Game state from the optimal SALET tree, drawn by how often it occurs. Every Guess is scored exactly by Selby's solver."
    >
      {data?.tree.totalMismatch && (
        <div className="banner bad" role="alert">
          {data.tree.totalMismatch}
        </div>
      )}
      {body}
    </SitePage>
  );
}
