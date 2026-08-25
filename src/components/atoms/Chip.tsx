import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Chip({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'tabnum inline-flex items-center gap-1.5 border border-hair bg-deck px-1.5 py-0.5 text-[10px] text-dim',
        className,
      )}
    >
      {color && (
        <span
          className="inline-block size-2.5 border border-hair"
          style={{ background: color }}
        />
      )}
      {children}
    </span>
  );
}
