import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  accent?: 'mint' | 'amber' | 'azure' | 'rose' | 'lime' | 'violet' | 'ink';
  className?: string;
  dataGuide?: string;
}

const accents: Record<NonNullable<StatProps['accent']>, string> = {
  mint: 'text-mint',
  amber: 'text-amber',
  azure: 'text-azure',
  rose: 'text-rose',
  lime: 'text-lime',
  violet: 'text-violet',
  ink: 'text-ink',
};

export function Stat({
  label,
  value,
  sub,
  accent = 'ink',
  className,
  dataGuide,
}: StatProps) {
  return (
    <div
      data-guide={dataGuide}
      className={cn('border border-hair bg-deck px-3 py-2', className)}
    >
      <div className="hud-label">{label}</div>
      <div className={cn('tabnum mt-0.5 text-[17px] leading-tight', accents[accent])}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] leading-snug text-faint">{sub}</div>}
    </div>
  );
}
