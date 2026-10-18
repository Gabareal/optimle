import { useState } from 'react';
import type { TreeNode } from '@wordle/core';
import { fmt } from '../../shared/Tiles';

/** Candidates, Expected guesses and bits for a Game state, with a "what are bits?" explainer. */
export function NodeStats({ node }: { node: TreeNode }) {
  const [open, setOpen] = useState(false);
  const after = Math.max(1, node.size / 2 ** node.entropy);
  return (
    <div>
      <div className="nodestats">
        <span>
          <b>{fmt(node.size)}</b> {node.size === 1 ? 'candidate' : 'candidates'}
        </span>
        <span>
          <b>{node.expected.toFixed(3)}</b> exp. guesses
        </span>
        <span>
          <b>{node.entropy.toFixed(2)}</b> bits
          <button className="bitsq" aria-expanded={open} aria-label="What are bits?" onClick={() => setOpen(!open)}>
            ?
          </button>
        </span>
      </div>
      {open && (
        <div className="explain" role="note">
          Bits measure how much a Guess narrows things down. Each bit halves the candidates on average, so{' '}
          {node.entropy.toFixed(2)} bits cuts {fmt(node.size)} candidates to about <b>{after.toFixed(1)}</b>. Expected
          guesses is what the tree actually minimises: the average number of guesses still needed from here, this one
          included. A Guess with fewer bits can still be better if it leaves groups that are easier to finish.
        </div>
      )}
    </div>
  );
}
