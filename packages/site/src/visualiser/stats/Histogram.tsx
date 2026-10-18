/**
 * Guesses needed: overlaid (grouped) histograms of how many Guesses each Strategy needs
 * for the Answers in scope. Clicking a bar lists its Answers.
 */
import { useEffect, useMemo, useState } from 'react';
import { max, range } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import { guessCounts, STRATEGIES, type StrategyId } from '@wordle/core';
import { useApp } from '../context';
import { plural, upper } from '../../shared/Tiles';
import { SvgButton } from '../ui/svg';

const COLOUR: Record<StrategyId | 'tree', string> = {
  tree: 'var(--accent)',
  optimal: 'var(--accent)',
  greedy: 'var(--alt)',
  answersOnly: 'var(--alt2)',
};

type Series = { id: StrategyId | 'tree'; label: string; counts: Map<string, number> };

export function Histogram() {
  const app = useApp();
  const { node, core, tree } = app;
  const [pick, setPick] = useState<{ id: Series['id']; n: number } | null>(null);
  const scope = node.candidates;
  useEffect(() => setPick(null), [node]);

  const series: Series[] = useMemo(() => {
    const s: Series[] = STRATEGIES.map((id) => ({ id, label: core.strategies.strategies[id].label, counts: core.counts[id] }));
    // On another opener's tree, the explored tree is the first series.
    if (tree.opener !== 'salet') s.unshift({ id: 'tree', label: `${upper(tree.opener)} tree`, counts: guessCounts(tree.root) });
    return s;
  }, [core, tree]);

  const bins = useMemo(() => {
    const top = max(series.flatMap((s) => scope.map((a) => s.counts.get(a)!))) ?? 1;
    return range(1, top + 1);
  }, [series, scope]);

  const hist = series.map((s) => bins.map((b) => scope.filter((a) => s.counts.get(a) === b).length));
  const avg = (s: Series) => scope.reduce((t, a) => t + s.counts.get(a)!, 0) / scope.length;

  const W = 420;
  const H = 190;
  const M = { l: 8, r: 8, t: 16, b: 22 };
  const x = scaleBand<number>().domain(bins).range([M.l, W - M.r]).paddingInner(0.2);
  const inner = scaleBand<number>().domain(range(series.length)).range([0, x.bandwidth()]).paddingInner(0.08);
  const y = scaleLinear().domain([0, max(hist.flat()) ?? 1]).range([H - M.b, M.t]);

  const picked = pick ? scope.filter((a) => series.find((s) => s.id === pick.id)!.counts.get(a) === pick.n) : null;
  const summary = series
    .map((s, i) => `${s.label}: ${bins.map((b, j) => `${hist[i][j]} in ${b}`).join(', ')}; average ${avg(s).toFixed(3)}`)
    .join('. ');

  return (
    <div className="card">
      <h3>Guesses needed</h3>
      <div className="legend">
        {series.map((s) => (
          <span key={s.id}>
            <i style={{ background: COLOUR[s.id] }} />
            {s.label} · avg {avg(s).toFixed(3)}
          </span>
        ))}
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Histogram of guesses needed. ${summary}`}>
        <line className="axis" x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} />
        {bins.map((b, j) => (
          <g key={b} transform={`translate(${x(b)},0)`}>
            {series.map((s, i) => {
              const v = hist[i][j];
              const bx = inner(i)!;
              return (
                <SvgButton
                  key={s.id}
                  label={`${s.label}: ${plural(v, 'Answer')} in ${b}. Click to list them.`}
                  onActivate={() => setPick({ id: s.id, n: b })}
                >
                  <rect
                    className="hit"
                    x={bx}
                    y={y(v)}
                    width={inner.bandwidth()}
                    height={Math.max(0, y(0) - y(v))}
                    fill={COLOUR[s.id]}
                    opacity={pick && (pick.id !== s.id || pick.n !== b) ? 0.45 : 1}
                  />
                  {v > 0 && (
                    <text x={bx + inner.bandwidth() / 2} y={y(v) - 3} textAnchor="middle" style={{ fontSize: 9 }}>
                      {v}
                    </text>
                  )}
                </SvgButton>
              );
            })}
            <text x={x.bandwidth() / 2} y={H - 6} textAnchor="middle">
              {b}
            </text>
          </g>
        ))}
      </svg>
      {picked ? (
        <div className="small">
          <b>{plural(picked.length, 'Answer')}</b> take {pick!.n} under {series.find((s) => s.id === pick!.id)!.label}:
          <div className="pick">
            {picked.map((w) => (
              <button key={w} className="chip" onClick={() => app.showAnswer(w)}>
                {w}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="small muted">Click a bar to list its Answers</div>
      )}
    </div>
  );
}
