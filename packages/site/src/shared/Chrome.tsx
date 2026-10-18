/**
 * The page frame both pages share: the site header, the main area and the credits footer.
 *
 * The footer sits at the bottom of the window. When the page is too tall for the window,
 * so the footer would only show after scrolling, it is replaced by a short credit at the
 * right of the header.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Provenance } from '@wordle/core';
import { siteUrl } from './load';

export type Page = 'visualiser' | 'ranked';

const PAGES: { id: Page; label: string; path: string }[] = [
  { id: 'visualiser', label: 'Visualiser', path: '' },
  { id: 'ranked', label: 'Ranked trainer', path: 'ranked/' },
];

const SELBY_REPO = 'https://github.com/alex1770/wordle';

export function SitePage({
  page,
  tree,
  bar,
  mainClass = '',
  footerExtra,
  children,
}: {
  page: Page;
  /** The tree file's provenance, for the credits. */
  tree?: Provenance;
  /** A page's own bar under the site header (the Visualiser's tabs and search). */
  bar?: ReactNode;
  mainClass?: string;
  footerExtra?: ReactNode;
  children: ReactNode;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const measure = () => {
      const main = mainRef.current;
      const content = contentRef.current;
      const footer = footerRef.current;
      if (!main || !content || !footer) return;
      const pad = getComputedStyle(main);
      // The main area's natural height, not the height it stretches to fill the window.
      const mainHeight = content.offsetHeight + parseFloat(pad.paddingTop) + parseFloat(pad.paddingBottom);
      const total = (headerRef.current?.offsetHeight ?? 0) + (barRef.current?.offsetHeight ?? 0) + mainHeight + footer.offsetHeight;
      setFits(total <= window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    for (const el of [headerRef.current, barRef.current, contentRef.current, footerRef.current]) if (el) ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <>
      <header className="site" ref={headerRef}>
        <h1>
          <a href={siteUrl('')}>Optimle</a>
        </h1>
        <nav aria-label="Site">
          {PAGES.map((p) => (
            <a key={p.id} href={siteUrl(p.path)} aria-current={p.id === page ? 'page' : undefined}>
              {p.label}
            </a>
          ))}
        </nav>
        {!fits && (
          <a className="credit" href={SELBY_REPO} target="_blank" rel="noopener" title={creditText(tree)}>
            Tree: Alex Selby (MIT)
          </a>
        )}
      </header>
      {bar && <div ref={barRef}>{bar}</div>}
      <main className={mainClass} ref={mainRef}>
        <div ref={contentRef}>{children}</div>
      </main>
      {/* Kept in the page while hidden so it can still be measured. */}
      <footer ref={footerRef} className={fits ? '' : 'offscreen'} aria-hidden={!fits}>
        {tree && (
          <>
            Tree: {tree.source}
            {tree.solverCommit && ` @ ${tree.solverCommit.slice(0, 7)}`}, generated {tree.generated}.{' '}
          </>
        )}
        SALET's 7,920 total is the proven optimum (Selby; Tseng; Olson; Bertsimas &amp; Paskov, <i>Operations Research</i>{' '}
        2025). Normal mode, original 2,315 Answers and 12,972 allowed Guesses. {footerExtra}
      </footer>
    </>
  );
}

function creditText(tree?: Provenance): string {
  return (
    `Tree: ${tree?.source ?? 'Alex Selby, MIT licence'}. SALET's 7,920 total is the proven optimum ` +
    '(Selby; Tseng; Olson; Bertsimas & Paskov, Operations Research 2025). Normal mode, original 2,315 Answers and 12,972 allowed Guesses.'
  );
}
