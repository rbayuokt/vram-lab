import { cn } from '@/lib/cn';
import { contrastInk } from '@/utils/color';
import { TRANSPARENT, type Palette } from '@/utils/pixel';

interface PaletteStripProps {
  palette: Palette;
  selected?: number;
  onSelect?: (index: number) => void;
  columns?: number;
  showIndex?: boolean;
  size?: number;
  usedIndexes?: number[];
  className?: string;
  labels?: string[];
  dataGuide?: string;
}

/** A CLUT, drawn as the run of entries it actually is. */
export function PaletteStrip({
  palette,
  selected,
  onSelect,
  columns = 8,
  showIndex = true,
  size = 34,
  usedIndexes,
  className,
  labels,
  dataGuide,
}: PaletteStripProps) {
  return (
    <div
      data-guide={dataGuide}
      className={cn('grid gap-1', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {palette.map((color, i) => {
        const transparent = color === TRANSPARENT;
        const unused = usedIndexes ? !usedIndexes.includes(i) : false;
        return (
          <button
            key={i}
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(i)}
            title={labels?.[i] ? `${i}: ${labels[i]}` : `index ${i}`}
            className={cn(
              'relative flex items-end justify-start border transition-all',
              selected === i ? 'border-mint ring-1 ring-mint' : 'border-hair',
              onSelect && 'cursor-pointer hover:border-dim',
              unused && 'opacity-35',
            )}
            style={{
              height: size,
              background: transparent
                ? 'repeating-conic-gradient(#1b2029 0% 25%, #0e1219 0% 50%) 50% / 10px 10px'
                : color,
            }}
          >
            {showIndex && (
              <span
                className="tabnum absolute bottom-0 left-0 px-1 text-[9px] leading-tight"
                style={{ color: transparent ? '#8c9bb0' : contrastInk(color) }}
              >
                {i.toString(16).toUpperCase()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
