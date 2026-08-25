import { cn } from '@/lib/cn';

interface BitRowProps {
  bits: string;
  /** Colour-group every N bits (4 = nibbles). */
  group?: number;
  groupColors?: string[];
  className?: string;
  size?: 'sm' | 'md';
}

/** Individual bit cells, so "0010 0100" stops being an abstraction. */
export function BitRow({
  bits,
  group = 4,
  groupColors = ['border-mint/60 text-mint', 'border-amber/60 text-amber'],
  className,
  size = 'md',
}: BitRowProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-px', className)}>
      {bits.split('').map((b, i) => {
        const g = Math.floor(i / group) % groupColors.length;
        return (
          <span
            key={i}
            className={cn(
              'tabnum inline-flex items-center justify-center border bg-deck',
              size === 'sm' ? 'size-4 text-[9px]' : 'size-6 text-[11px]',
              groupColors[g],
              i % group === 0 && i > 0 && 'ml-1.5',
            )}
          >
            {b}
          </span>
        );
      })}
    </div>
  );
}
