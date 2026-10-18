/**
 * Openers: switch the explored tree between the curated openers, and the leaderboard
 * of Selby's proven exact totals, with an entropy view labelled as a heuristic.
 */
import { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { CURATED_OPENERS } from '@wordle/core';
import { useApp, useOpeners } from '../context';
import { fmt, upper } from '../../shared/Tiles';

const curated = new Set<string>(CURATED_OPENERS);

function Switcher() {
  const app = useApp();
  return (
    <div className="card">
      <h3>Explore another opener's tree</h3>
      <div className="openers" role="group" aria-label="Opener">
        {CURATED_OPENERS.map((w) => (
          <button key={w} className="opener" aria-pressed={app.tree.opener === w} onClick={() => app.switchOpener(w)}>
            {w}
          </button>
        ))}
      </div>
      <p className="small muted">
        Each is that opener's own optimal tree, solved exactly by Selby's solver. Switching loads it and returns to
        Explore. SALET is the proven best first guess; ADIEU and AUDIO show what a vowel-heavy start costs.
      </p>
    </div>
  );
}

function Leaderboard() {
  const app = useApp();
  const openers = useOpeners();
  const [view, setView] = useState<'exact' | 'entropy'>('exact');
  const [lookup, setLookup] = useState('');

  const byEntropy = useMemo(() => {
    if (!openers) return [];
    return app.core.guesses.map((w, i) => [w, openers.entropy[i]] as [string, number]).sort((a, b) => b[1] - a[1]);
  }, [openers, app.core.guesses]);

  if (!openers) return <div className="card">Loading the leaderboard…</div>;
  const n = app.core.answers.length;
  const rows: [string, number][] = view === 'exact' ? openers.leaderboard : byEntropy.slice(0, 105);
  const vals = rows.map((r) => r[1]);
  // Exact: lower is better, so the bar shows how close each total is to the best.
  const bar =
    view === 'exact'
      ? scaleLinear().domain([Math.max(...vals) + 5, Math.min(...vals)]).range([4, 100])
      : scaleLinear().domain([Math.min(...vals) - 0.05, Math.max(...vals)]).range([4, 100]);

  const lw = lookup.toLowerCase();
  const li = lw.length === 5 ? app.core.guesses.indexOf(lw) : -1;
  const exactRank = openers.leaderboard.findIndex(([g]) => g === lw);
  const entropyRank = li >= 0 ? byEntropy.findIndex(([g]) => g === lw) : -1;

  const choose = (w: string) => {
    if (curated.has(w)) return app.switchOpener(w);
    app.setWhatIf(w);
    app.go(app.tree.root, { tab: 'explore' });
  };

  return (
    <div className="card">
      <h3>Best openers</h3>
      <div className="seg" role="group" aria-label="Rank by">
        <button aria-pressed={view === 'exact'} onClick={() => setView('exact')}>
          Exact total (proven)
        </button>
        <button aria-pressed={view === 'entropy'} onClick={() => setView('entropy')}>
          Entropy (heuristic)
        </button>
      </div>
      <p className="small muted" style={{ marginTop: 0 }}>
        {view === 'exact'
          ? "Selby's top 105 openers, each with the proven minimum total guesses over all 2,315 Answers."
          : 'Entropy of each opener over the Answers: how much it narrows things down on average. A heuristic: the highest-entropy word is not the best opener.'}{' '}
        Curated openers open their tree; others open as a What-if Guess at the root.
      </p>
      <label className="small">
        Look up any word:{' '}
        <input
          value={lookup}
          maxLength={5}
          onChange={(e) => setLookup(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
          style={{ textTransform: 'uppercase', width: 90 }}
          aria-label="Look up an opener"
        />
      </label>
      {lw.length === 5 && (
        <div className="small" aria-live="polite" style={{ margin: '4px 0 8px' }}>
          {li < 0 ? (
            'Not in the word list'
          ) : (
            <>
              {upper(lw)}: {openers.entropy[li].toFixed(3)} bits (#{entropyRank + 1} of {fmt(app.core.guesses.length)} by entropy)
              {exactRank >= 0
                ? ` · #${exactRank + 1} by exact total, ${fmt(openers.leaderboard[exactRank][1])}`
                : ' · not in the proven top 105'}
            </>
          )}
        </div>
      )}
      <div className="lb head">
        <span>#</span>
        <span>Opener</span>
        <span />
        <span className="num">{view === 'exact' ? 'Total' : 'Bits'}</span>
        <span className="num">{view === 'exact' ? 'Avg' : ''}</span>
      </div>
      <div className="lbwrap" role="list">
        {rows.map(([w, v], i) => (
          <div className="lb" key={w} role="listitem">
            <span className="muted">{i + 1}</span>
            <button className="linkish w" onClick={() => choose(w)} aria-label={`${upper(w)}, rank ${i + 1}`}>
              {w}
              {curated.has(w) && <span className="tag">tree</span>}
            </button>
            <span className="bar" style={{ width: `${bar(v)}%` }} />
            <span className="num">{view === 'exact' ? fmt(v) : v.toFixed(3)}</span>
            <span className="num muted">{view === 'exact' ? (v / n).toFixed(4) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Openers() {
  return (
    <div className="grid2">
      <Switcher />
      <Leaderboard />
    </div>
  );
}
