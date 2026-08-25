import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FlowStep {
  id: string;
  label: ReactNode;
  value?: ReactNode;
  tone?: 'default' | 'mint' | 'amber' | 'azure' | 'rose' | 'violet';
}

const tones: Record<NonNullable<FlowStep['tone']>, string> = {
  default: 'border-line text-dim',
  mint: 'border-mint/60 text-mint',
  amber: 'border-amber/60 text-amber',
  azure: 'border-azure/60 text-azure',
  rose: 'border-rose/60 text-rose',
  violet: 'border-violet/60 text-violet',
};

interface FlowDiagramProps {
  steps: FlowStep[];
  orientation?: 'vertical' | 'horizontal';
  activeIndex?: number;
  className?: string;
  compact?: boolean;
}

/**
 * The "pixel -> index -> CLUT -> colour" chain, reused everywhere a lookup is
 * being explained. Prefer this over a paragraph.
 */
export function FlowDiagram({
  steps,
  orientation = 'vertical',
  activeIndex,
  className,
  compact,
}: FlowDiagramProps) {
  const horizontal = orientation === 'horizontal';
  return (
    <div
      className={cn(
        'flex',
        horizontal ? 'flex-wrap items-center gap-1.5' : 'flex-col items-center gap-0',
        className,
      )}
    >
      {steps.map((step, i) => {
        const dim = activeIndex !== undefined && i > activeIndex;
        return (
          <div
            key={step.id}
            className={cn(
              'flex',
              horizontal ? 'items-center gap-1.5' : 'w-full flex-col items-center',
            )}
          >
            <div
              className={cn(
                'border bg-deck text-center transition-opacity',
                compact ? 'px-2 py-1' : 'px-3 py-1.5',
                horizontal ? 'min-w-[84px]' : 'w-full',
                tones[step.tone ?? 'default'],
                dim && 'opacity-30',
                activeIndex === i && 'bg-raise shadow-[0_0_0_1px_currentColor]',
              )}
            >
              <div className="text-[10px] tracking-[0.12em] uppercase">{step.label}</div>
              {step.value !== undefined && (
                <div className="tabnum mt-0.5 text-[13px] text-ink">{step.value}</div>
              )}
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'text-faint',
                  horizontal ? 'px-0.5 text-[13px]' : 'py-0.5 text-[13px] leading-none',
                  dim && 'opacity-30',
                )}
              >
                {horizontal ? '→' : '↓'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
