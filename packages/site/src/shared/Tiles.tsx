import { patternLabel, type Pattern } from '@wordle/core';

/** A word as Wordle tiles, coloured by `pattern` (or empty outlines without one). */
export function Tiles({ word, pattern, size = '' }: { word: string; pattern?: Pattern | null; size?: '' | 'lg' }) {
  return (
    <span className="tiles" aria-hidden="true">
      {[...word.padEnd(5, ' ')].map((ch, i) => (
        <span key={i} className={`t ${pattern ? pattern[i] : 'N'} ${size}`}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** Five small squares for a pattern, read out as its colours. */
export function PatternSquares({ pattern }: { pattern: Pattern }) {
  return (
    <span className="tiles" role="img" aria-label={patternLabel(pattern)}>
      {[...pattern].map((c, i) => (
        <span key={i} className={`t sm ${c}`} />
      ))}
    </span>
  );
}

export const upper = (w: string) => w.toUpperCase();
export const fmt = (n: number) => n.toLocaleString('en-GB');
export const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;
