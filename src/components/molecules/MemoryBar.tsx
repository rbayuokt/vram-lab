import { cn } from '@/lib/cn';
import { formatBytes, percentOfVram } from '@/utils/memory';

export interface MemorySegment {
  id: string;
  label: string;
  bytes: number;
  color: string;
}

interface MemoryBarProps {
  segments: MemorySegment[];
  capacity: number;
  height?: number;
  className?: string;
  onSegmentClick?: (id: string) => void;
  activeId?: string | null;
}

/**
 * A capacity bar that keeps its scale honest when you blow the budget: the
 * track always represents `capacity`, and anything past it spills into a
 * hatched overflow strip instead of silently rescaling.
 */
export function MemoryBar({
  segments,
  capacity,
  height = 26,
  className,
  onSegmentClick,
  activeId,
}: MemoryBarProps) {
  const used = segments.reduce((n, s) => n + s.bytes, 0);
  const over = Math.max(0, used - capacity);
  const scale = used > capacity ? used : capacity;

  return (
    <div className={cn('w-full', className)}>
      <div
        className="relative flex w-full overflow-hidden border border-line bg-deck"
        style={{ height }}
      >
        {segments.map((s) => {
          const pct = (s.bytes / scale) * 100;
          if (pct <= 0) return null;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!onSegmentClick}
              onClick={() => onSegmentClick?.(s.id)}
              title={`${s.label} - ${formatBytes(s.bytes)} (${percentOfVram(s.bytes).toFixed(1)}% of 1 MiB)`}
              className={cn(
                'relative h-full min-w-0 transition-[filter]',
                onSegmentClick && 'cursor-pointer hover:brightness-125',
                activeId === s.id && 'ring-1 ring-ink ring-inset',
              )}
              style={{ width: `${pct}%`, background: s.color }}
            />
          );
        })}
        {used < capacity && (
          <div className="h-full flex-1" style={{ background: 'transparent' }} />
        )}
        {over > 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0"
            style={{
              width: `${(over / scale) * 100}%`,
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(255,107,139,0.55) 0 6px, rgba(255,107,139,0.15) 6px 12px)',
              boxShadow: 'inset 2px 0 0 #ff6b8b',
            }}
          />
        )}
        {/* the 1 MB wall */}
        {used > capacity && (
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-rose"
            style={{ left: `${(capacity / scale) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
