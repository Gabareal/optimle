/** A number that ticks up from 0 to `to`, easing out. Shows `to` at once if motion is reduced. */
import { useEffect, useState } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CountUp({ to, duration, delay = 0 }: { to: number; duration: number; delay?: number }) {
  const [value, setValue] = useState(() => (reducedMotion() ? to : 0));

  useEffect(() => {
    if (reducedMotion()) {
      setValue(to);
      return;
    }
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration, delay]);

  return <>{value}</>;
}
