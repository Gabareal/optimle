/**
 * "Tree plays SALET": every Feedback pattern the Guess can get, with its group size and
 * the next Guess. Clicking a row steps forward. The What-if box sits on top.
 */
import { useEffect, useState } from 'react';
import { patternLabel, SOLVED, type Pattern, type TreeNode } from '@wordle/core';
import { useApp, usePhone } from '../context';
import { PatternSquares, plural, upper } from '../../shared/Tiles';
import { WhatIf } from './WhatIf';

const PHONE_ROWS = 8;

export function PatternList({ draft }: { draft: Pattern }) {
  const app = useApp();
  const { node, solved, focusAnswer } = app;
  const phone = usePhone();
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [node]);

  const max = node.children[0]?.size ?? 1;
  // The next step on the highlighted Answer's Path, if it passes through here.
  const pathKid: TreeNode | 'solved' | null =
    focusAnswer && node.candidates.includes(focusAnswer)
      ? node.guess === focusAnswer
        ? 'solved'
        : (node.children.find((k) => k.candidates.includes(focusAnswer)) ?? null)
      : null;
  const kids = phone && !showAll ? node.children.slice(0, PHONE_ROWS) : node.children;
  const largest = Math.max(...node.groups);

  return (
    <div className="card">
      <h3>Tree plays {upper(node.guess)}</h3>
      <div className="muted small">
        {plural(node.size, 'candidate')} split into {plural(node.groups.length, 'group')} · largest {largest}
      </div>
      <WhatIf />
      <div className="plist" role="list" aria-label={`Feedback patterns for ${upper(node.guess)}`}>
        {node.solvesHere && (
          <div role="listitem">
            <button
              className={`prow ${pathKid === 'solved' || solved ? 'path' : draft === SOLVED ? 'on' : ''}`}
              aria-label={`${patternLabel(SOLVED)}: solved, ${upper(node.guess)} is the Answer`}
              onClick={() => app.go(node, { solved: true })}
            >
              <PatternSquares pattern={SOLVED} />
              <span className="cnt">1</span>
              <span className="muted">solved!</span>
              <span />
            </button>
          </div>
        )}
        {kids.map((k) => (
          <div role="listitem" key={k.pattern}>
            <button
              className={`prow ${k === pathKid ? 'path' : k.pattern === draft && !solved ? 'on' : ''}`}
              aria-label={`${patternLabel(k.pattern!)}: ${plural(k.size, 'candidate')}, then ${upper(k.guess)}`}
              onClick={() => app.go(k)}
            >
              <PatternSquares pattern={k.pattern!} />
              <span className="cnt">{k.size}</span>
              <span className="bar" style={{ width: `${Math.max(3, (100 * k.size) / max)}%` }} />
              <span className="nx">then {k.guess}</span>
            </button>
          </div>
        ))}
        {kids.length < node.children.length && (
          <button className="more" onClick={() => setShowAll(true)}>
            Show all {node.children.length} patterns
          </button>
        )}
      </div>
    </div>
  );
}
