/**
 * Feedback-pattern breakdown: how the selected Game state's Guess splits its Candidates,
 * one bar per pattern, largest first. Clicking a bar steps into that group.
 */
import { scaleBand, scaleLinear } from 'd3-scale';
import { patternLabel } from '@wordle/core';
import { useApp } from '../context';
import { plural, upper } from '../../shared/Tiles';
import { SvgButton } from '../ui/svg';

const MAX_BARS = 40;

export function PatternBreakdown() {
  const app = useApp();
  const { node } = app;
  const kids = node.children.slice(0, MAX_BARS);
  const W = 420;
  const H = 170;
  const M = { l: 28, r: 4, t: 8, b: 40 };
  const x = scaleBand<number>()
    .domain(kids.map((_, i) => i))
    .range([M.l, W - M.r])
    .paddingInner(0.15);
  const top = kids[0]?.size ?? 1;
  const y = scaleLinear().domain([0, top]).range([H - M.b, M.t]).nice();
  const ticks = y.ticks(4);

  return (
    <div className="card">
      <h3>How {upper(node.guess)} splits the Candidates</h3>
      <div className="small muted">
        {plural(node.groups.length, 'group')} · largest {Math.max(...node.groups)} · {node.entropy.toFixed(2)} bits
        {node.children.length > MAX_BARS && ` · showing the ${MAX_BARS} largest`}
        {node.solvesHere && ' · plus 1 solved outright'}
      </div>
      {kids.length === 0 ? (
        <p className="small">{upper(node.guess)} is the only Candidate left.</p>
      ) : (
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Group sizes after ${upper(node.guess)}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="axis" x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} strokeDasharray={t ? '2 3' : undefined} />
              <text x={M.l - 4} y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {kids.map((k, i) => (
            <SvgButton
              key={k.pattern}
              label={`${patternLabel(k.pattern!)}: ${plural(k.size, 'candidate')}, then ${upper(k.guess)}`}
              onActivate={() => app.go(k, { tab: 'explore' })}
            >
              <rect className="hit" x={x(i)} y={y(k.size)} width={x.bandwidth()} height={y(0) - y(k.size)} fill="var(--accent)" rx={1} />
              {[...k.pattern!].map((c, j) => (
                <rect
                  key={j}
                  x={x(i)! + (x.bandwidth() - Math.min(6, x.bandwidth())) / 2}
                  y={H - M.b + 4 + j * 6.5}
                  width={Math.min(6, x.bandwidth())}
                  height={5.5}
                  fill={`var(--${c})`}
                  rx={1}
                />
              ))}
            </SvgButton>
          ))}
        </svg>
      )}
    </div>
  );
}
