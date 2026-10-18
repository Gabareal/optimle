/**
 * Hardest Answers: those with the longest Paths in scope, grouped by the Game state
 * after two Guesses that leaves them hard (e.g. SALET › COURD › GIMPY). Each group gets
 * its letter family, like _IGHT, when its Answers share letters in place.
 */
import { useMemo } from 'react';
import { chain, findAnswer, stateString, type TreeNode } from '@wordle/core';
import { useApp } from '../context';
import { PatternSquares, plural, upper } from '../../shared/Tiles';

/** "_IGHT": letters every word shares in place, "_" elsewhere. */
export function family(words: string[]): string {
  return [...words[0]].map((ch, i) => (words.every((w) => w[i] === ch) ? ch.toUpperCase() : '_')).join('');
}

export function Hardest() {
  const app = useApp();
  const { node, tree } = app;

  const { worst, groups } = useMemo(() => {
    const ends = node.candidates.map((a) => findAnswer(tree.root, a)!);
    const worst = Math.max(...ends.map((e) => e.depth + 1));
    const byState = new Map<TreeNode, string[]>();
    for (const e of ends) {
      if (e.depth + 1 !== worst) continue;
      const c = chain(e);
      // After two Guesses, or deeper when the scope itself is deeper.
      const key = c[Math.min(Math.max(2, node.depth), c.length - 1)];
      byState.set(key, [...(byState.get(key) ?? []), e.guess]);
    }
    const groups = [...byState].sort((a, b) => b[1].length - a[1].length || a[0].guess.localeCompare(b[0].guess));
    return { worst, groups };
  }, [node, tree]);

  const count = groups.reduce((s, [, ws]) => s + ws.length, 0);
  return (
    <div className="card hard">
      <h3>Hardest Answers</h3>
      <div className="small muted">
        {plural(count, 'Answer')} here {count === 1 ? 'needs' : 'need'} {worst} guesses, grouped by the Game state after
        two guesses that leaves them hard. Answers that share four letters (like _IGHT or _ATCH) can only be told apart a
        few at a time, however well you guess.
      </div>
      <div style={{ maxHeight: 360, overflow: 'auto' }}>
        {groups.map(([state, words]) => {
          const fam = words.length > 1 ? family(words) : null;
          return (
            <div className="grp" key={stateString(state)}>
              {fam && fam.replace(/_/g, '').length >= 3 && <span className="fam">{fam}</span>}
              <button
                className="linkish small"
                onClick={() => app.go(state, { tab: 'explore' })}
                aria-label={`Open ${stateString(state)}`}
              >
                {chain(state).map((n) => (
                  <span key={n.depth}>
                    {n.pattern && (
                      <>
                        {' '}
                        <PatternSquares pattern={n.pattern} />{' '}
                      </>
                    )}
                    {upper(n.guess)}
                  </span>
                ))}
              </button>{' '}
              <span className="small muted">· {plural(state.size, 'candidate')}</span>
              <div>
                {words.map((w) => (
                  <button key={w} className="chip" onClick={() => app.showAnswer(w)}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
