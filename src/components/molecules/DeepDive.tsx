import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface DeepDiveProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Optional accuracy layer. The playgrounds teach a mental model; this is where
 * the messier truth about real PS1 hardware lives, for whoever wants it.
 */
export function DeepDive({ title = 'Deep dive', children, className }: DeepDiveProps) {
  return (
    <details className={cn('group border border-hair bg-deck open:bg-panel', className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[10px] tracking-[0.16em] text-violet uppercase select-none hover:text-ink">
        <span className="inline-block transition-transform group-open:rotate-90">
          {'▸'}
        </span>
        {title}
        <span className="ml-auto text-[9px] text-faint normal-case">
          exact hardware behaviour
        </span>
      </summary>
      <div className="space-y-2 border-t border-hair px-3 py-2.5 text-[11px] leading-relaxed text-dim [&_code]:text-mint [&_strong]:text-ink">
        {children}
      </div>
    </details>
  );
}
