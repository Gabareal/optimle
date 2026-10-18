/** Letter frequency by position over the Answers in scope. */
import { useMemo } from 'react';
import { max } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { useApp } from '../context';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export function Heatmap() {
  const { node } = useApp();
  const counts = useMemo(() => {
    const c = [...LETTERS].map(() => [0, 0, 0, 0, 0]);
    for (const w of node.candidates) for (let i = 0; i < 5; i++) c[w.charCodeAt(i) - 97][i]++;
    return c;
  }, [node]);
  const rows = [...LETTERS].map((l, r) => ({ l, c: counts[r] })).filter((r) => r.c.some(Boolean));
  const top = max(rows.flatMap((r) => r.c)) ?? 1;
  const shade = scaleLinear().domain([0, top]).range([0, 1]);

  const cw = 52;
  const ch = 16;
  const W = 24 + cw * 5;
  const H = 18 + ch * rows.length;
  const busiest = [0, 1, 2, 3, 4].map((i) => {
    const best = rows.reduce((b, r) => (r.c[i] > b.c[i] ? r : b), rows[0]);
    return `position ${i + 1}: ${best.l.toUpperCase()} (${best.c[i]})`;
  });

  return (
    <div className="card">
      <h3>Letter frequency by position</h3>
      <div className="small muted">Over the {node.size.toLocaleString('en-GB')} Answers in scope.</div>
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        style={{ maxWidth: 420 }}
        role="img"
        aria-label={`Letter frequency heatmap. Most common letter at ${busiest.join(', ')}.`}
      >
        {[1, 2, 3, 4, 5].map((p, i) => (
          <text key={p} x={24 + i * cw + cw / 2} y={11} textAnchor="middle" style={{ fontWeight: 600 }}>
            {p}
          </text>
        ))}
        {rows.map((r, j) => (
          <g key={r.l} transform={`translate(0,${18 + j * ch})`}>
            <text x={8} y={ch - 4} style={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {r.l.toUpperCase()}
            </text>
            {r.c.map((v, i) => (
              <g key={i}>
                <rect x={24 + i * cw} y={0} width={cw - 2} height={ch - 2} rx={2} fill="var(--G)" fillOpacity={shade(v)}>
                  <title>{`${r.l.toUpperCase()} in position ${i + 1}: ${v}`}</title>
                </rect>
                {v > 0 && (
                  <text
                    x={24 + i * cw + cw / 2 - 1}
                    y={ch - 5}
                    textAnchor="middle"
                    style={{ fill: shade(v) > 0.55 ? '#fff' : undefined, fontSize: 10 }}
                  >
                    {v}
                  </text>
                )}
              </g>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
