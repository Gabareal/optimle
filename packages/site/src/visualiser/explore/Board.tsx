/**
 * The Board walk: one row per Guess along the Path so far. Earlier rows rewind; the
 * current row is painted with the feedback the visitor got (click or keyboard), and
 * Go → steps forward.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { chain, colourName, patternLabel, SOLVED, type Colour, type Pattern, type TreeNode } from '@wordle/core';
import { useApp } from '../context';
import { plural, Tiles, upper } from '../../shared/Tiles';
import { NodeStats } from './NodeStats';
import { Comparison } from './Comparison';

const CYCLE: Record<Colour, Colour> = { B: 'Y', Y: 'G', G: 'B' };
const ROWS = 6;

/** What the painted pattern leads to: a child Game state, the win, or nothing. */
export function matchDraft(node: TreeNode, draft: Pattern): TreeNode | 'solved' | null {
  if (draft === SOLVED) return node.solvesHere ? 'solved' : null;
  return node.childByPattern.get(draft) ?? null;
}

export function Board({ draft, setDraft }: { draft: Pattern; setDraft: (p: Pattern) => void }) {
  const app = useApp();
  const { node, solved } = app;
  const rows = chain(node);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusTile, setFocusTile] = useState<number | null>(null);

  // Keep keyboard focus on the painted row, including after Go → moves to the next Game state.
  useEffect(() => {
    if (focusTile !== null) tileRefs.current[focusTile]?.focus();
  }, [focusTile, draft, node]);

  const match = matchDraft(node, draft);
  const apply = () => {
    if (match === 'solved') app.go(node, { solved: true });
    else if (match) app.go(match);
    setFocusTile(match && match !== 'solved' ? 0 : null);
  };

  const setColour = (j: number, c: Colour) => setDraft(draft.slice(0, j) + c + draft.slice(j + 1));

  const onTileKey = (j: number) => (e: KeyboardEvent) => {
    const k = e.key.toUpperCase();
    if (k === 'G' || k === 'Y' || k === 'B') {
      e.preventDefault();
      setColour(j, k);
      setFocusTile(j);
    } else if (e.key === ' ') {
      e.preventDefault();
      setColour(j, CYCLE[draft[j] as Colour]);
      setFocusTile(j);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusTile(Math.max(0, Math.min(4, j + (e.key === 'ArrowRight' ? 1 : -1))));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (match) apply();
    }
  };

  const message =
    match === 'solved' ? (
      <>
        <b>{upper(node.guess)}</b> is the Answer
      </>
    ) : match ? (
      <>
        <b>{match.size}</b> {match.size === 1 ? 'candidate gives' : 'candidates give'} this feedback
      </>
    ) : (
      <span className="bad">No remaining candidate gives this feedback</span>
    );

  return (
    <div className="board">
      <div role="group" aria-label="Board" style={{ display: 'contents' }}>
        {rows.map((r, i) => {
          if (i < rows.length - 1) {
            const p = rows[i + 1].pattern!;
            return (
              <button
                key={i}
                className="brow"
                title="Rewind to here"
                aria-label={`Guess ${i + 1}, ${upper(r.guess)}, got ${patternLabel(p)}. Rewind to here.`}
                onClick={() => app.go(r)}
              >
                <Tiles word={r.guess} pattern={p} size="lg" />
              </button>
            );
          }
          if (solved) {
            return (
              <div key={i} className="brow" aria-label={`Guess ${i + 1}, ${upper(r.guess)}, all green: solved.`} role="img">
                <Tiles word={r.guess} pattern={SOLVED} size="lg" />
              </div>
            );
          }
          return (
            <div key={i} className="brow cur paint" role="group" aria-label={`Guess ${i + 1}, ${upper(r.guess)}: paint your feedback`}>
              {[...r.guess].map((ch, j) => (
                <button
                  key={j}
                  ref={(el) => {
                    tileRefs.current[j] = el;
                  }}
                  className={`t lg ${draft[j]}`}
                  aria-label={`Letter ${j + 1}, ${upper(ch)}, ${colourName(draft[j] as Colour)}. Press G, Y or B to set, Space to cycle, Enter to apply.`}
                  onClick={() => setColour(j, CYCLE[draft[j] as Colour])}
                  onKeyDown={onTileKey(j)}
                >
                  {ch}
                </button>
              ))}
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, ROWS - rows.length) }, (_, i) => (
          <div key={`e${i}`} className="brow" aria-hidden="true">
            <Tiles word="     " size="lg" />
          </div>
        ))}
      </div>
      {solved ? (
        <>
          <div className="solved" aria-live="polite">
            Solved in {plural(rows.length, 'guess', 'guesses')}
          </div>
          <Comparison answer={node.guess} />
        </>
      ) : (
        <div className="paintbar">
          <span className="muted small">Click the letters to colour in your feedback</span>
          <span aria-live="polite">{message}</span>
          <button className="go" disabled={!match} onClick={apply}>
            Go →
          </button>
        </div>
      )}
      <NodeStats node={node} />
    </div>
  );
}
