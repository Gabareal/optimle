import { useEffect, useState } from 'react';
import type { Pattern } from '@wordle/core';
import { useApp } from '../context';
import { Board } from './Board';
import { PatternList } from './PatternList';

const AUTO_OPEN_BELOW = 10;

function Candidates() {
  const { node, focusAnswer, showAnswer } = useApp();
  const [open, setOpen] = useState(node.size < AUTO_OPEN_BELOW);
  useEffect(() => setOpen(node.size < AUTO_OPEN_BELOW), [node]);
  return (
    <details className="cands card" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>Candidates ({node.size})</summary>
      <div>
        {node.candidates.map((w) => (
          <button key={w} className={`chip ${w === focusAnswer ? 'on' : ''}`} onClick={() => showAnswer(w)}>
            {w}
          </button>
        ))}
      </div>
    </details>
  );
}

export function Explore() {
  const { node } = useApp();
  // The feedback being painted on the current row; reset when the Game state changes.
  const [draft, setDraft] = useState<Pattern>('BBBBB');
  useEffect(() => setDraft('BBBBB'), [node]);
  return (
    <>
      <p className="intro muted">Click a row to rewind.</p>
      <div className="explore">
        <div className="left">
          <div className="card">
            <Board draft={draft} setDraft={setDraft} />
          </div>
          <Candidates />
        </div>
        <PatternList draft={draft} />
      </div>
    </>
  );
}
