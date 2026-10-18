import { useApp } from '../context';
import { upper } from '../../shared/Tiles';

/** Once an Answer is solved: how many Guesses each Strategy needs for it. */
export function Comparison({ answer }: { answer: string }) {
  const { core, tree, node } = useApp();
  const c = core.counts;
  return (
    <div className="cmp" aria-label="Guesses each Strategy needs for this Answer">
      {tree.opener !== 'salet' && (
        <span>
          {upper(tree.opener)} tree <b>{node.depth + 1}</b>
        </span>
      )}
      <span>
        Optimal <b>{c.optimal.get(answer)}</b>
      </span>
      <span>
        Greedy-entropy <b>{c.greedy.get(answer)}</b>
      </span>
      <span>
        Answers-only <b>{c.answersOnly.get(answer)}</b>
      </span>
    </div>
  );
}
