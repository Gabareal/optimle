/**
 * The end-of-Run breakdown: the total, the shareable squares, and one card per Round with
 * what the Guess cost, the optimal and Also-optimal Guesses, the top alternatives and a
 * link to that Game state in the Visualiser.
 */
import { useEffect, useState } from 'react';
import {
  chain,
  MAX_POINTS,
  patternLabel,
  scoreRound,
  stateString,
  tierEmoji,
  turnOf,
  ZERO_AT,
  type RoundScore,
  type ScoresFile,
  type TreeNode,
} from '@wordle/core';
import { siteUrl } from '../shared/load';
import { fmt, Tiles, upper } from '../shared/Tiles';
import { loadScores, type Run } from './run';

const TOP = 5;
const ALSO_SHOWN = 8;

interface Scored {
  state: TreeNode;
  guess: string;
  file: ScoresFile;
  score: RoundScore;
}

const signed = (x: number) => (x === 0 ? '±0' : `+${x.toFixed(3)}`);

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

  if (error) return <p className="bad">Could not load the scores: {error}</p>;
  if (!scored) {
    return (
      <p className="muted" aria-live="polite">
        Scoring your Run…
      </p>
    );
  }

  const total = scored.reduce((t, r) => t + r.score.points, 0);
  const max = MAX_POINTS * scored.length;
  const squares = scored.map((r) => tierEmoji(r.score)).join('');
  const share = async () => {
    try {
      await navigator.clipboard.writeText(`Optimal Wordle · Ranked trainer ${total}/${max}\n${squares}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rk-breakdown">
      <div className="rk-total">
        <span className="muted">Run complete</span>
        <b>
          {total} / {max}
        </b>
        <span className="squares" role="img" aria-label={scored.map((r, i) => `Round ${i + 1}: ${r.score.tier}`).join(', ')}>
          {squares}
        </span>
        <div className="rk-actions">
          <button className="go" onClick={onNewRun}>
            New Run
          </button>
          <button className="btn" onClick={share}>
            {copied ? 'Copied' : 'Copy result'}
          </button>
        </div>
        <span className="small muted">Points are provisional: the scoring formula isn't final yet.</span>
      </div>
      {scored.map((r, i) => (
        <RoundCard key={i} n={i + 1} r={r} guesses={guesses} />
      ))}
    </div>
  );
}

function RoundCard({ n, r, guesses }: { n: number; r: Scored; guesses: string[] }) {
  const { state, guess, file, score } = r;
  const rows = chain(state);
  const size = file.size;
  const expected = (d: number) => (file.optimal + d) / size;
  const cands = new Set(state.candidates);

  // Every Guess ranked by cost; ties put the tree's Guess first, then alphabetical.
  const order = guesses
    .map((g, i) => ({ g, d: file.deltas[i] }))
    .sort((a, b) => a.d - b.d || (a.g === state.guess ? -1 : b.g === state.guess ? 1 : a.g < b.g ? -1 : 1));
  const also = order.filter((x) => x.d === 0 && x.g !== state.guess).map((x) => x.g);
  const top = order.slice(0, TOP);
  const rank = order.filter((x) => x.d < score.delta).length + 1;
  const yoursListed = top.some((x) => x.g === guess);
  const link = `${siteUrl('')}#${stateString(state)}?whatif=${guess}`;

  return (
    <section className="rcard card" aria-label={`Round ${n}`}>
      <div className="mini">
        {rows.slice(0, -1).map((row, i) => (
          <div key={i} role="img" aria-label={`${upper(row.guess)}: ${patternLabel(rows[i + 1].pattern!)}`}>
            <Tiles word={row.guess} pattern={rows[i + 1].pattern!} />
          </div>
        ))}
        <div role="img" aria-label={`Your Guess: ${upper(guess)}`}>
          <Tiles word={guess} />
        </div>
      </div>
      <div className="body">
        <h3>
          Round {n}
          <span className="small muted">
            turn {turnOf(state)} · {size} Candidates · Path frequency {((100 * size) / chain(state)[0].size).toFixed(1)}%
          </span>
          <span className="pts">{score.points}</span>
        </h3>
        <div>
          You played <b>{upper(guess)}</b> <span className={`tag ${score.tier === 'Optimal' ? 'opt' : ''}`}>{score.tier}</span>{' '}
          {signed(score.extra)} Expected guesses
          {score.delta > 0 && (
            <span className="muted">
              {' '}
              · #{fmt(rank)} of {fmt(guesses.length)}
            </span>
          )}
        </div>
        <div className="costbar" title={`0 to +${ZERO_AT} Expected guesses`} aria-hidden="true">
          <span style={{ left: `${Math.min(100, (score.extra / ZERO_AT) * 100)}%` }} />
        </div>
        <div className="small muted">
          Optimal: <b>{upper(state.guess)}</b> (the tree's Guess)
          {also.length > 0 && (
            <>
              {' '}
              · Also optimal: {also.slice(0, ALSO_SHOWN).map(upper).join(', ')}
              {also.length > ALSO_SHOWN && ` and ${fmt(also.length - ALSO_SHOWN)} more`}
            </>
          )}
        </div>
        <table className="rk-alts">
          <thead>
            <tr className="muted">
              <td>Top Guesses</td>
              <td></td>
              <td className="n">Exp. guesses</td>
              <td className="n">vs best</td>
            </tr>
          </thead>
          <tbody>
            {top.map((x) => (
              <AltRow key={x.g} g={x.g} d={x.d} size={size} you={x.g === guess} tree={x.g === state.guess} cand={cands.has(x.g)} expected={expected} />
            ))}
            {!yoursListed && (
              <AltRow g={guess} d={score.delta} size={size} you tree={false} cand={cands.has(guess)} expected={expected} rank={rank} />
            )}
          </tbody>
        </table>
        <a className="rk-link" href={link} target="_blank" rel="noopener">
          Open in Visualiser →
        </a>
      </div>
    </section>
  );
}

function AltRow(p: {
  g: string;
  d: number;
  size: number;
  you: boolean;
  tree: boolean;
  cand: boolean;
  expected: (d: number) => number;
  rank?: number;
}) {
  return (
    <tr className={p.you ? 'you' : ''}>
      <td className="w">
        {p.rank ? `#${fmt(p.rank)} ` : ''}
        {upper(p.g)}
      </td>
      <td>
        {p.d === 0 && <span className="tag opt">optimal</span>}
        {p.tree && <span className="small muted"> tree</span>}
        {p.cand && <span className="small muted"> Candidate</span>}
        {p.you && <span className="small muted"> you</span>}
      </td>
      <td className="n">{p.expected(p.d).toFixed(3)}</td>
      <td className="n">{signed(p.d / p.size)}</td>
    </tr>
  );
}
