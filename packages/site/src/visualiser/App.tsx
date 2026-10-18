import { useCallback, useEffect, useMemo, useState } from 'react';
import { CURATED_OPENERS, findAnswer, followPatterns, type TreeNode } from '@wordle/core';
import { AppContext, type AppState } from './context';
import { loadCore, loadOpeners, loadTree, type Core, type LoadedTree } from './data';
import { formatHash, parseHash, TABS, type Route, type Tab } from './hash';
import { Search } from './Search';
import { Explore } from './explore/Explore';
import { Stats } from './stats/Stats';
import { Openers } from './openers/Openers';
import { fmt, upper } from '../shared/Tiles';
import { SitePage } from '../shared/Chrome';

const DEFAULT_OPENER = 'salet';
const curated = new Set<string>(CURATED_OPENERS);

function readRoute(): Route {
  const r = parseHash(window.location.hash, DEFAULT_OPENER);
  return curated.has(r.opener) ? r : { ...r, opener: DEFAULT_OPENER, patterns: [], solved: false };
}

export function App() {
  const [core, setCore] = useState<Core | null>(null);
  const [tree, setTree] = useState<LoadedTree | null>(null);
  const [route, setRoute] = useState<Route>(readRoute);
  const [error, setError] = useState<string | null>(null);
  const [focusAnswer, setFocusAnswer] = useState<string | null>(null);
  const [whatIf, setWhatIf] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // A link from the Ranked trainer pre-fills the What-if Guess (…?whatif=crane).
  useEffect(() => {
    if (route.whatIf) setWhatIf(route.whatIf);
  }, [route.whatIf]);

  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    loadCore().then(setCore, (e) => setError(String(e)));
    // Not needed for first paint; fetch it in the background for search and Openers.
    loadOpeners().catch(() => {});
  }, []);

  useEffect(() => {
    let live = true;
    loadTree(route.opener).then(
      (t) => live && setTree(t),
      (e) => setError(String(e)),
    );
    return () => {
      live = false;
    };
  }, [route.opener]);

  const ready = core && tree && tree.opener === route.opener;
  const node = ready ? followPatterns(tree.root, route.patterns) : null;
  const solved = !!node && route.solved && node.solvesHere && node.depth === route.patterns.length;

  const navigate = useCallback((hash: string) => {
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(readRoute());
    setMenuOpen(false);
  }, []);

  const state: AppState | null = useMemo(() => {
    if (!ready || !node) return null;
    const go = (n: TreeNode, opts: { tab?: Tab; solved?: boolean } = {}) => {
      if (opts.solved) setFocusAnswer(n.guess);
      navigate(formatHash(opts.tab ?? route.tab, n, opts.solved));
    };
    return {
      core,
      tree,
      node,
      solved,
      tab: route.tab,
      focusAnswer,
      whatIf,
      setWhatIf,
      go,
      showAnswer: (answer) => {
        const end = findAnswer(tree.root, answer);
        if (!end) return;
        setFocusAnswer(answer);
        navigate(formatHash('explore', end, true));
      },
      setTab: (tab) => navigate(formatHash(tab, node, solved)),
      switchOpener: (opener) => {
        setFocusAnswer(null);
        navigate(`#${opener}`);
      },
    };
  }, [ready, core, tree, node, solved, route.tab, focusAnswer, whatIf, navigate]);

  useEffect(() => {
    const where = state ? (route.tab === 'explore' ? '' : `${TABS.find((t) => t.id === route.tab)!.label} · `) : '';
    document.title = `${where}Visualiser · Optimle`;
  }, [state, route.tab]);

  if (error) {
    return (
      <main>
        <p className="bad">Could not load the data: {error}</p>
      </main>
    );
  }
  if (!state) {
    return (
      <main>
        <p className="muted" aria-live="polite">
          Loading the tree…
        </p>
      </main>
    );
  }

  const total = state.tree.root.cost;
  const n = state.tree.root.size;
  const tabHref = (t: Tab) => formatHash(t, state.node, state.solved);

  // The Visualiser's own bar: its tabs, tagline and Answer search.
  const bar = (
    <div className="top">
      <button
        className="burger"
        aria-label="Menu"
        aria-expanded={menuOpen}
        aria-controls="sections"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>
      <span className="tagline">
        {upper(state.tree.opener)} · {fmt(n)} Answers · {fmt(total)} guesses · avg {(total / n).toFixed(4)}
      </span>
      <nav id="sections" className={`topnav ${menuOpen ? 'open' : ''}`} aria-label="Sections">
        {TABS.map((t) => (
          <a key={t.id} href={tabHref(t.id)} aria-current={route.tab === t.id ? 'page' : undefined} onClick={() => setMenuOpen(false)}>
            {t.label}
          </a>
        ))}
      </nav>
      <Search />
    </div>
  );

  return (
    <AppContext.Provider value={state}>
      <SitePage
        page="visualiser"
        tree={state.tree.file.provenance}
        footerExtra="Greedy-entropy and the stats are computed by this site."
        bar={bar}
      >
        {state.tree.totalMismatch && (
          <div className="banner bad" role="alert">
            {state.tree.totalMismatch}
          </div>
        )}
        {route.tab === 'explore' && <Explore />}
        {route.tab === 'stats' && <Stats />}
        {route.tab === 'openers' && <Openers />}
      </SitePage>
    </AppContext.Provider>
  );
}
