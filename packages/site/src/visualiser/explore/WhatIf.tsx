/**
 * "What if you guessed ___ instead?": how any allowed Guess would split this Game
 * state's Candidates, next to the tree's Guess. The split and bits are computed here;
 * exact Expected guesses come only from the precomputed top-K alternatives.
 */
import { useMemo } from 'react';
import { patternPath, summariseSplit, type Alternative, type SplitSummary } from '@wordle/core';
import { useAlts, useApp } from '../context';
import { plural, upper } from '../../shared/Tiles';

function Strip({ s, alt }: { s: SplitSummary; alt?: boolean }) {
  return (
    <div className={`strip ${alt ? 'alt' : ''}`} aria-hidden="true">
      {s.groups.map((g, i) => (
        <div key={i} style={{ flex: g }} title={String(g)} />
      ))}
    </div>
  );
}

function Line({ label, s }: { label: string; s: SplitSummary }) {
  return (
    <div>
      <b>{label}</b>: {plural(s.groups.length, 'group')} · largest {s.largest} · {s.entropy.toFixed(2)} bits
    </div>
  );
}

export function WhatIf() {
  const app = useApp();
  const { node, core, whatIf, setWhatIf } = app;
  const alts = useAlts(app.tree.opener);
  const altList: Alternative[] | undefined = alts?.nodes[patternPath(node).join('.')];
  const w = whatIf.toLowerCase();

  type Result = { kind: 'error'; error: string } | { kind: 'split'; mine: SplitSummary; theirs: SplitSummary };
  const result = useMemo((): Result | null => {
    if (w.length < 5) return null;
    if (!core.guessSet.has(w)) return { kind: 'error', error: `${upper(w)} is not in the word list` };
    return { kind: 'split', mine: summariseSplit(node.guess, node.candidates), theirs: summariseSplit(w, node.candidates) };
  }, [w, node, core.guessSet]);

  const exact = altList?.find(([g]) => g === w);
  const expected = (total: number) => (total / node.size).toFixed(3);

  return (
    <div className="whatif">
      <label>
        What if you guessed
        <input
          value={whatIf}
          maxLength={5}
          placeholder="adieu"
          spellCheck={false}
          autoComplete="off"
          aria-label="What-if Guess"
          onChange={(e) => setWhatIf(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
        />
        instead?
      </label>
      <div className="wires" aria-live="polite">
        {result?.kind === 'error' && <span className="muted">{result.error}</span>}
        {result?.kind === 'split' && (
          <>
            <Line label={`${upper(node.guess)} (tree)`} s={result.mine} />
            <Strip s={result.mine} />
            <Line label={upper(w)} s={result.theirs} />
            <Strip s={result.theirs} alt />
            {w === node.guess ? (
              <div className="muted">That is the tree's own Guess.</div>
            ) : exact ? (
              <div>
                Exact: {expected(exact[1])} expected guesses against the tree's {node.expected.toFixed(3)}
                {exact[2] ? <span className="tag opt">also optimal</span> : ` (+${((exact[1] - node.cost) / node.size).toFixed(3)})`}
              </div>
            ) : (
              <div className="muted">
                {result.theirs.largest === node.size
                  ? 'It does not split the Candidates at all.'
                  : `Exact Expected guesses are only precomputed for the top ${alts?.k ?? 10} Guesses here.`}
              </div>
            )}
          </>
        )}
      </div>
      {altList && altList.length > 0 && (
        <details className="alts">
          <summary>Best Guesses here, scored exactly</summary>
          <table>
            <tbody>
              {altList.map(([g, total, also]) => (
                <tr key={g}>
                  <td className="w">
                    <button className="linkish" onClick={() => setWhatIf(g)} aria-label={`Compare ${upper(g)}`}>
                      {upper(g)}
                    </button>
                  </td>
                  <td>{expected(total)} exp.</td>
                  <td>
                    {g === node.guess ? (
                      <span className="tag">tree's Guess</span>
                    ) : also ? (
                      <span className="tag opt">also optimal</span>
                    ) : (
                      <span className="muted">+{((total - node.cost) / node.size).toFixed(3)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted">
            The {altList.length} most promising Guesses by Selby's solver, each scored exactly
            {node.parent ? '' : ' (at the root: the best openers)'}.
          </div>
        </details>
      )}
    </div>
  );
}
