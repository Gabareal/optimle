/**
 * The end-of-Run breakdown: the total ticking up, the shareable squares, and one card per
 * Round with what the Guess cost, the top Guesses and a link to that Game state in the
 * Visualiser. The cards' boards are padded to the same height so their rows line up.
 */
import { useEffect, useState } from 'react';
import { CountUp } from './CountUp';
import {
  chain,
  MAX_POINTS,
  patternLabel,
  scoreRound,
  stateString,
  tierEmoji,
  ZERO_AT,
  type RoundScore,
  type ScoresFile,
  type TreeNode,
} from '@wordle/core';
import { siteUrl } from '../shared/load';
import { fmt, Tiles, upper } from '../shared/Tiles';
import { loadScores, type Run } from './run';

const TOP = 5;

interface Scored {
  state: TreeNode;
  guess: string;
  file: ScoresFile;
  score: RoundScore;
}

const signed = (x: number) => (x === 0 ? '±0' : `+${x.toFixed(3)}`);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

const OpenIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 4h6v6" />
    <path d="M20 4 10 14" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export function Breakdown({ run, guesses, onNewRun }: { run: Run; guesses: string[]; onNewRun: () => void }) {
  const [scored, setScored] = useState<Scored[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    const index = new Map(guesses.map((g, i) => [g, i]));
    Promise.all(run.states.map(loadScores)).then(
      (files) => {
        if (!live) return;
        setScored(
          files.map((file, i) => {
            const guess = run.guesses[i]!;
            return { state: run.states[i], guess, file, score: scoreRound(file.deltas[index.get(guess)!], file.size) };
          }),
        );
      },
      (e) => live && setError(String(e)),
    );
    return () => {
      live = false;
    };
  }, [run, guesses]);

  // Enter starts the next Run, once the results are showing. A held key, or an Enter
  // straight after the last Round's, doesn't skip past them.
  const ready = scored !== null;
  useEffect(() => {
    if (!ready) return;
    const since = Date.now();
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || Date.now() - since < 400) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'BUTTON' || t.tagName === 'A' || t.tagName === 'INPUT') return;
      e.preventDefault();
      onNewRun();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [ready, onNewRun]);

  if (error) return <p className="bad">Could not load the scores: {error}</p>;
  if (!scored) {
    return (
      <p className="muted" aria-live="polite">
        Scoring your Run…
      </p>
    );
  }

  const total = scored.reduce((t, r) => t + r.score.points, 0);
  // Every card's board gets the same number of rows, so the cards line up.
  const boardRows = Math.max(...scored.map((r) => r.state.depth + 1));
  const max = MAX_POINTS * scored.length;
  const squares = scored.map((r) => tierEmoji(r.score)).join('');
  const share = async () => {
    try {
      await navigator.clipboard.writeText(`Optimle · Ranked trainer ${total}/${max}\n${squares}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rk-breakdown">
      <div className="rk-total">
        <span className="muted">Run results</span>
        <b>
          <span className="sr-only">
            {total} / {max}
          </span>
          <span aria-hidden="true">
            <CountUp to={total} duration={1400} /> / {max}
          </span>
        </b>
        <span className="squares" role="img" aria-label={scored.map((r, i) => `Round ${i + 1}: ${r.score.tier}`).join(', ')}>
          {squares}
        </span>
        <div className="rk-actions">
          <button className="go" onClick={onNewRun}>
            New Run
          </button>
          <button className="icon tip" data-tip={copied ? 'Copied' : 'Copy result'} aria-label={copied ? 'Copied' : 'Copy result'} onClick={share}>
            <CopyIcon />
          </button>
        </div>
        <span className="small muted">Enter starts a new Run.</span>
      </div>
      <div className="rk-cards">
        {scored.map((r, i) => (
          <RoundCard key={i} n={i + 1} r={r} guesses={guesses} boardRows={boardRows} />
        ))}
      </div>
    </div>
  );
}

function RoundCard({ n, r, guesses, boardRows }: { n: number; r: Scored; guesses: string[]; boardRows: number }) {
  const { state, guess, file, score } = r;
  const rows = chain(state);
  const size = file.size;
  const expected = (d: number) => (file.optimal + d) / size;

  // Every Guess ranked by cost; ties put the tree's Guess first, then alphabetical.
  const order = guesses
    .map((g, i) => ({ g, d: file.deltas[i] }))
    .sort((a, b) => a.d - b.d || (a.g === state.guess ? -1 : b.g === state.guess ? 1 : a.g < b.g ? -1 : 1));
  const top = order.slice(0, TOP);
  const rank = order.filter((x) => x.d < score.delta).length + 1;
  const yoursListed = top.some((x) => x.g === guess);
  const link = `${siteUrl('')}#${stateString(state)}?whatif=${guess}`;

  return (
    <section className="rcard card" aria-label={`Round ${n}`}>
      <h3>
        <a className="icon tip" href={link} target="_blank" rel="noopener" data-tip="Open in Visualiser" aria-label="Open in Visualiser">
          <OpenIcon />
        </a>
        Round {n}
        <span className="pts">
          <span className="sr-only">{score.points} points</span>
          <span aria-hidden="true">
            <CountUp to={score.points} duration={900} delay={250 + n * 150} />
          </span>
        </span>
      </h3>
      <div className="mini">
        {rows.slice(0, -1).map((row, i) => (
          <div key={i} role="img" aria-label={`${upper(row.guess)}: ${patternLabel(rows[i + 1].pattern!)}`}>
            <Tiles word={row.guess} pattern={rows[i + 1].pattern!} />
          </div>
        ))}
        <div role="img" aria-label={`Your Guess: ${upper(guess)}`}>
          <Tiles word={guess} />
        </div>
        {Array.from({ length: boardRows - rows.length }, (_, i) => (
          <div key={`pad${i}`} className="pad" aria-hidden="true">
            <Tiles word="" />
          </div>
        ))}
      </div>
      <div>
        You played <b>{upper(guess)}</b> <span className={`tag ${score.tier === 'Optimal' ? 'opt' : ''}`}>{score.tier}</span>
      </div>
      <div className="small muted">
        {signed(score.extra)} Expected guesses
        {/* Always shown (#1 when optimal), so every card's rows stay aligned. */}
        <div>
          #{fmt(rank)} of {fmt(guesses.length)}
        </div>
      </div>
      <div className="costbar" title={`0 to +${ZERO_AT} Expected guesses`} aria-hidden="true">
        <span style={{ left: `${Math.min(100, (score.extra / ZERO_AT) * 100)}%` }} />
      </div>
      <table className="rk-alts">
        <tbody>
          {top.map((x) => (
            <AltRow key={x.g} g={x.g} d={x.d} size={size} you={x.g === guess} expected={expected} />
          ))}
          {!yoursListed && (
            <AltRow g={guess} d={score.delta} size={size} you expected={expected} rank={rank} />
          )}
        </tbody>
      </table>
    </section>
  );
}

function AltRow(p: {
  g: string;
  d: number;
  size: number;
  you: boolean;
  expected: (d: number) => number;
  rank?: number;
}) {
  return (
    <tr className={p.you ? 'you' : ''}>
      <td className="w">
        {p.rank ? `#${fmt(p.rank)} ` : ''}
        {upper(p.g)}
      </td>
      <td className="marks">
        {p.d === 0 && <span className="tag opt">optimal</span>}
      </td>
      <td className="n" title="Expected guesses">
        {p.expected(p.d).toFixed(2)}
      </td>
      <td className="n" title="Compared with the best">
        {signed(p.d / p.size)}
      </td>
    </tr>
  );
}
