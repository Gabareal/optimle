/** The header and footer both pages share. */
import type { ReactNode } from 'react';
import type { Provenance } from '@wordle/core';
import { siteUrl } from './load';

export type Page = 'visualiser' | 'ranked';

const PAGES: { id: Page; label: string; path: string }[] = [
  { id: 'visualiser', label: 'Visualiser', path: '' },
  { id: 'ranked', label: 'Ranked trainer', path: 'ranked/' },
];

export function SiteHeader({ page }: { page: Page }) {
  return (
    <header className="site">
      <h1>
        <a href={siteUrl('')}>Optimal Wordle</a>
      </h1>
      <nav aria-label="Site">
        {PAGES.map((p) => (
          <a key={p.id} href={siteUrl(p.path)} aria-current={p.id === page ? 'page' : undefined}>
            {p.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

/** Credits for the tree, plus any page-specific lines. */
export function SiteFooter({ tree, children }: { tree?: Provenance; children?: ReactNode }) {
  return (
    <footer>
      {tree && (
        <>
          Tree: {tree.source}
          {tree.solverCommit && ` @ ${tree.solverCommit.slice(0, 7)}`}, generated {tree.generated}.{' '}
        </>
      )}
      SALET's 7,920 total is the proven optimum (Selby; Tseng; Olson; Bertsimas &amp; Paskov, <i>Operations Research</i>{' '}
      2025). Normal mode, original 2,315 Answers and 12,972 allowed Guesses. {children}
    </footer>
  );
}
