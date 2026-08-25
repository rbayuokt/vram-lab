import { useEffect, useState } from 'react';

interface GuideSpotlightProps {
  /** CSS selector for the element the current step is talking about. */
  selector: string | null;
}

const PAD = 6;

/**
 * A ring drawn over whatever control the current guide step refers to.
 *
 * It tracks the element's rect rather than styling the element itself, so
 * nothing in the playgrounds has to know the guide exists beyond carrying a
 * `data-guide` attribute.
 */
export function GuideSpotlight({ selector }: GuideSpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  // bring the target into view when the step changes
  useEffect(() => {
    if (!selector) return;
    const el = document.querySelector(selector);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selector]);

  // follow it while the page scrolls, resizes or reflows
  useEffect(() => {
    let raf = 0;
    // null is "nothing measured yet", distinct from the empty key for "no
    // target". Sharing one value froze a stale ring on targetless steps.
    let last: string | null = null;
    const tick = () => {
      const el = selector ? document.querySelector(selector) : null;
      const r = el?.getBoundingClientRect() ?? null;
      const key = r ? `${r.x}|${r.y}|${r.width}|${r.height}` : '';
      if (key !== last) {
        last = key;
        setRect(r);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selector]);

  if (!rect || rect.width === 0) return null;

  return (
    <div
      aria-hidden
      className="guide-ring pointer-events-none fixed z-40"
      style={{
        left: rect.left - PAD,
        top: rect.top - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }}
    />
  );
}
