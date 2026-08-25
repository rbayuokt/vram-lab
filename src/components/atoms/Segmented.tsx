import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
  dataGuide?: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ariaLabel,
  dataGuide,
}: SegmentedProps<T>) {
  return (
    <div
      data-guide={dataGuide}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex flex-wrap border border-line bg-deck', className)}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={cn(
              'transition-colors',
              size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]',
              'tracking-[0.08em] uppercase',
              i > 0 && 'border-l border-line',
              active ? 'bg-mint text-void' : 'text-dim hover:bg-raise hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
