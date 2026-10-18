import type { KeyboardEvent, ReactNode } from 'react';

/** An SVG group that behaves as a button: focusable, Enter/Space activate, labelled for screen readers. */
export function SvgButton({ label, onActivate, children }: { label: string; onActivate: () => void; children: ReactNode }) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  };
  return (
    <g role="button" tabIndex={0} aria-label={label} onClick={onActivate} onKeyDown={onKey}>
      <title>{label}</title>
      {children}
    </g>
  );
}
