import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  tone?: 'default' | 'raised' | 'flat';
  /** Marks this panel as a guide-walkthrough target. */
  dataGuide?: string;
}

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
  bodyClassName,
  tone = 'default',
  dataGuide,
}: PanelProps) {
  return (
    <section
      data-guide={dataGuide}
      className={cn(
        'border border-line',
        tone === 'raised' ? 'bg-raise' : tone === 'flat' ? 'bg-transparent' : 'bg-panel',
        className,
      )}
    >
      {(title || right) && (
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-hair px-3 py-2">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-0.5 text-[11px] text-faint">{subtitle}</p>}
          </div>
          {right && <div className="min-w-0">{right}</div>}
        </header>
      )}
      <div className={cn('p-3', bodyClassName)}>{children}</div>
    </section>
  );
}
