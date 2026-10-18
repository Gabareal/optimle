/**
 * The header Answer search (see the "Non-Answer search input" ticket).
 *
 * - Fewer than 5 letters: suggestions only (after 2 letters, up to 8 Answers by prefix).
 * - An Answer: jump to its Path on Explore.
 * - A valid Guess that isn't an Answer: explain, offer it as a What-if Guess, and give
 *   its leaderboard rank if it has one.
 * - Anything else: "Not in the word list", with up to 3 Answers one letter away.
 */
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useApp, useOpeners } from './context';
import { fmt, upper } from '../shared/Tiles';

const MAX_SUGGESTIONS = 8;

function oneLetterAway(word: string, answers: string[]): string[] {
  const out: string[] = [];
  for (const a of answers) {
    let d = 0;
    for (let i = 0; i < 5 && d < 2; i++) if (a[i] !== word[i]) d++;
    if (d === 1) out.push(a);
    if (out.length === 3) break;
  }
  return out;
}

export function Search() {
  const app = useApp();
  const openers = useOpeners();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const w = q.toLowerCase();

  const suggestions = useMemo(() => {
    if (w.length < 2 || w.length >= 5) return [];
    return app.core.answers.filter((a) => a.startsWith(w)).slice(0, MAX_SUGGESTIONS);
  }, [w, app.core.answers]);

  const choose = (answer: string) => {
    setQ(answer);
    setOpen(false);
    app.showAnswer(answer);
  };

  const onInput = (v: string) => {
    const clean = v.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5);
    setQ(clean);
    setActive(0);
    setOpen(true);
    if (clean.length === 5 && app.core.answerSet.has(clean)) app.showAnswer(clean);
  };

  const onKey = (e: KeyboardEvent) => {
    if (!suggestions.length || !open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let message: React.ReactNode = "Type an Answer to see its Path";
  if (w.length === 5) {
    if (app.core.answerSet.has(w)) {
      const n = app.core.counts.optimal.get(w);
      message = app.tree.opener === 'salet' && n ? `Solved in ${n}` : `Showing its Path from ${upper(app.tree.opener)}`;
    } else if (app.core.guessSet.has(w)) {
      const rank = openers?.leaderboard.findIndex(([g]) => g === w) ?? -1;
      message = (
        <>
          {upper(w)} is a valid guess but never the Answer in the original 2,315-word list, so it has no Path.{' '}
          <button
            className="linkish"
            onClick={() => {
              app.setWhatIf(w);
              app.setTab('explore');
            }}
          >
            Compare it as a What-if Guess here
          </button>
          {rank >= 0 && (
            <>
              <br />
              <button className="linkish" onClick={() => app.setTab('openers')}>
                #{rank + 1} opener · {fmt(openers!.leaderboard[rank][1])} total
              </button>
            </>
          )}
        </>
      );
    } else {
      const near = oneLetterAway(w, app.core.answers);
      message = (
        <>
          Not in the word list.
          {near.length > 0 && (
            <>
              {' '}
              Did you mean{' '}
              {near.map((a, i) => (
                <span key={a}>
                  {i > 0 && (i === near.length - 1 ? ' or ' : ', ')}
                  <button className="linkish" onClick={() => choose(a)}>
                    {upper(a)}
                  </button>
                </span>
              ))}
              ?
            </>
          )}
        </>
      );
    }
  }

  const listOpen = open && suggestions.length > 0;
  return (
    <div className="search">
      <input
        value={q}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={onKey}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Answer…"
        maxLength={5}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-label="Search for an Answer"
        aria-expanded={listOpen}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={listOpen ? `sugg-${suggestions[active]}` : undefined}
      />
      {listOpen && (
        <ul className="suggest" id="search-suggestions" role="listbox" aria-label="Matching Answers">
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`sugg-${s}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
      <div className="msg" aria-live="polite">
        {message}
      </div>
    </div>
  );
}
