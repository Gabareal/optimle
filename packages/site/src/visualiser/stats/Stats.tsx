import { chain } from '@wordle/core';
import { useApp } from '../context';
import { fmt, upper } from '../../shared/Tiles';
import { Hardest } from './Hardest';
import { Heatmap } from './Heatmap';
import { Histogram } from './Histogram';
import { PatternBreakdown } from './PatternBreakdown';

/** Every graph follows the Game state selected in Explore. */
function Scope() {
  const app = useApp();
  const c = chain(app.node);
  return (
    <div className="scope" aria-live="polite">
      Showing{' '}
      {c.length === 1 ? (
        <b>all {fmt(app.node.size)} Answers</b>
      ) : (
        <>
          <b>{c.map((n) => upper(n.guess)).join(' › ')}</b> ({fmt(app.node.size)} candidates) ·{' '}
          <button className="linkish" onClick={() => app.go(app.tree.root, { tab: 'stats' })}>
            reset
          </button>
        </>
      )}
    </div>
  );
}

export function Stats() {
  return (
    <>
      <Scope />
      <div className="grid2">
        <Histogram />
        <PatternBreakdown />
        <Hardest />
        <Heatmap />
      </div>
    </>
  );
}
