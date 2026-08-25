import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Horizontal scroll for a fixed-size canvas.
 *
 * The inner `w-fit relative` box is what absolutely-positioned overlays (index
 * numbers, cursors) anchor to, so they scroll with the canvas instead of
 * floating over a scrolled viewport.
 */
export function CanvasScroller({
  children,
  className,
  dataGuide,
}: {
  children: ReactNode;
  className?: string;
  dataGuide?: string;
}) {
  return (
    <div data-guide={dataGuide} className={cn('max-w-full overflow-x-auto', className)}>
      <div className="relative w-fit">{children}</div>
    </div>
  );
}
