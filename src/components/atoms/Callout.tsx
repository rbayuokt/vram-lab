import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'note' | 'warn' | 'good' | 'real';

const tones: Record<Tone, { bar: string; label: string; text: string }> = {
  note: { bar: 'bg-azure', label: 'text-azure', text: 'NOTE' },
  warn: { bar: 'bg-amber', label: 'text-amber', text: 'WATCH OUT' },
  good: { bar: 'bg-lime', label: 'text-lime', text: 'KEY IDEA' },
  real: { bar: 'bg-violet', label: 'text-violet', text: 'ON REAL HARDWARE' },
};

interface CalloutProps {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Callout({ tone = 'note', title, children, className }: CalloutProps) {
  const t = tones[tone];
  return (
    <div className={cn('flex gap-2.5 border border-hair bg-deck p-2.5', className)}>
      <span className={cn('mt-0.5 w-[2px] shrink-0 self-stretch', t.bar)} />
      <div className="min-w-0 text-[11px] leading-relaxed text-dim">
        <span className={cn('mr-2 text-[10px] tracking-[0.14em]', t.label)}>
          {title ?? t.text}
        </span>
        {children}
      </div>
    </div>
  );
}
