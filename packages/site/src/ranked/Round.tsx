/**
 * One Round: the tree's earlier Guesses on a Wordle board, one empty row for the player's
 * Guess, and an on-screen keyboard. No Candidate list or count: the board is the puzzle.
 * Enter on an allowed Guess locks it in (see pressKey).
 */
import { useEffect } from 'react';
import { chain, patternLabel, type Colour, type TreeNode } from '@wordle/core';
import { Tiles, upper } from '../shared/Tiles';
import type { Entry } from './run';

const ROWS = 6;
const KEYS = ['qwertyuiop', 'asdfghjkl', '⏎zxcvbnm⌫'];
const RANK: Record<Colour, number> = { B: 0, Y: 1, G: 2 };

/** The strongest colour each letter has had on the board, as on Wordle's keyboard. */
function keyColours(state: TreeNode): Map<string, Colour> {
  const out = new Map<string, Colour>();
  const rows = chain(state);
  for (let i = 0; i + 1 < rows.length; i++) {
    const p = rows[i + 1].pattern!;
    [...rows[i].guess].forEach((ch, j) => {
      const c = p[j] as Colour;
      const was = out.get(ch);
      if (was === undefined || RANK[c] > RANK[was]) out.set(ch, c);
    });
  }
  return out;
}

export function Round({
  state,
  index,
  rounds,
  entry,
  press,
}: {
  state: TreeNode;
  index: number;
  rounds: number;
  entry: Entry;
  /** Send one key: 'a'–'z', '⏎' or '⌫'. */
  press: (k: string) => void;
}) {
  const { typed, msg, shake } = entry;

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter') {
        // Let a focused button (a keyboard key) handle its own Enter.
        if (t.tagName === 'BUTTON') return;
        e.preventDefault();
        press('⏎');
      } else if (e.key === 'Backspace') press('⌫');
      else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [press]);

  const rows = chain(state);
  const colours = keyColours(state);
  const future = Math.max(0, ROWS - rows.length);

  return (
    <div className="rk-round">
      <div className="progress">
        <span className="small muted" aria-hidden="true">
          Round {index + 1}/{rounds}
        </span>
        <div className="pips" role="img" aria-label={`Round ${index + 1} of ${rounds}`}>
          {Array.from({ length: rounds }, (_, j) => (
            <i key={j} className={j <= index ? 'on' : ''} />
          ))}
        </div>
      </div>
      <h2 className="rk-prompt">What is the optimal guess here?</h2>
      <div className="rk-board">
        {rows.slice(0, -1).map((r, i) => {
          const p = rows[i + 1].pattern!;
          return (
            <div key={i} className="brow" role="img" aria-label={`${upper(r.guess)}: ${patternLabel(p)}`}>
              <Tiles word={r.guess} pattern={p} size="lg" />
            </div>
          );
        })}
        <div
          key={`typed${shake}`}
          className={`brow typed ${shake ? 'shake' : ''}`}
          role="img"
          aria-label={typed ? `Your Guess so far: ${upper(typed)}` : 'Your Guess: empty'}
        >
          <Tiles word={typed} size="lg" />
        </div>
        {Array.from({ length: future }, (_, i) => (
          <div key={`f${i}`} className="brow future" aria-hidden="true">
            <Tiles word="" size="lg" />
          </div>
        ))}
      </div>
      <div className="rk-msg" role="status" aria-live="polite">
        {msg}
      </div>
      <div className="kb" aria-label="Keyboard">
        {KEYS.map((row) => (
          <div key={row}>
            {[...row].map((k) => {
              const wide = k === '⏎' || k === '⌫';
              return (
                <button
                  key={k}
                  className={wide ? 'wide' : (colours.get(k) ?? '')}
                  aria-label={k === '⏎' ? 'Enter' : k === '⌫' ? 'Backspace' : upper(k)}
                  // Clicks don't take focus, so a physical Enter afterwards means "Enter", not "this key again".
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => press(k)}
                >
                  {k === '⏎' ? 'Enter' : k}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
