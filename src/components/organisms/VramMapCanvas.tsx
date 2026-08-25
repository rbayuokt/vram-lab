import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { formatBytes } from '@/utils/memory';
import { itemBytes, KIND_COLORS, VRAM_H, VRAM_W, type Placement } from '@/utils/vram';

interface VramMapCanvasProps {
  placements: Placement[];
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
  dataGuide?: string;
}

/** VRAM drawn as what it is: a 1024 x 512 grid of 16-bit words. */
export function VramMapCanvas({
  placements,
  selected,
  onSelect,
  className,
  dataGuide,
}: VramMapCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  // what the packer could not place, drawn below the grid at the same scale:
  // a map that looks neatly full while the counter reads 103% is a lie
  const spilled = placements.filter((p) => !p.fits);
  const spilledBytes = spilled.reduce((n, p) => n + itemBytes(p), 0);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, VRAM_W, VRAM_H);
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, VRAM_W, VRAM_H);

    // texture-page guides: 64 words is one 4bpp page, 256 rows is one page tall
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    for (let x = 0; x <= VRAM_W; x += 64) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, VRAM_H);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    for (let x = 0; x <= VRAM_W; x += 256) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, VRAM_H);
    }
    ctx.moveTo(0, 256.5);
    ctx.lineTo(VRAM_W, 256.5);
    ctx.stroke();

    for (const p of placements) {
      if (!p.fits) continue;
      const color = KIND_COLORS[p.kind];
      const w = Math.min(p.wordsW, VRAM_W - p.x);
      ctx.fillStyle = `${color}33`;
      ctx.fillRect(p.x, p.y, w, p.rows);
      ctx.strokeStyle = selected === p.id ? '#ffffff' : color;
      ctx.lineWidth = selected === p.id ? 3 : 1.5;
      ctx.strokeRect(p.x + 0.5, p.y + 0.5, w - 1, p.rows - 1);

      if (w > 90 && p.rows > 26) {
        ctx.fillStyle = color;
        ctx.font = '13px ui-monospace, monospace';
        ctx.textBaseline = 'top';
        const label =
          ctx.measureText(p.label).width > w - 12
            ? `${p.label.slice(0, Math.max(3, Math.floor((w - 12) / 7)))}…`
            : p.label;
        ctx.fillText(label, p.x + 6, p.y + 6);
      }
    }
  }, [placements, selected]);

  return (
    <div data-guide={dataGuide} className={className}>
      <div className="relative">
        <canvas
          ref={ref}
          width={VRAM_W}
          height={VRAM_H}
          className="block w-full border border-line bg-void"
          style={{ imageRendering: 'auto', aspectRatio: `${VRAM_W} / ${VRAM_H}` }}
          onClick={(e) => {
            if (!onSelect) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * VRAM_W;
            const y = ((e.clientY - rect.top) / rect.height) * VRAM_H;
            const hit = [...placements]
              .reverse()
              .find(
                (p) =>
                  p.fits &&
                  x >= p.x &&
                  x < p.x + p.wordsW &&
                  y >= p.y &&
                  y < p.y + p.rows,
              );
            onSelect(hit?.id ?? null);
          }}
        />
        <div className="pointer-events-none absolute top-1 left-1 text-[9px] tracking-[0.14em] text-faint">
          0,0
        </div>
        <div className="pointer-events-none absolute right-1 bottom-1 text-[9px] tracking-[0.14em] text-faint">
          1023,511
        </div>
      </div>

      {spilled.length > 0 && (
        <div className="mt-1.5 border border-rose/50 bg-rose/5 px-2 py-1.5">
          <div className="mb-1 flex items-center justify-between gap-2 text-[9px] tracking-[0.14em] text-rose uppercase">
            <span>
              ↓ Outside VRAM · {spilled.length} allocation
              {spilled.length > 1 ? 's' : ''} with nowhere to go
            </span>
            <span className="tabnum">{formatBytes(spilledBytes)}</span>
          </div>
          <div className="flex gap-[2px]">
            {spilled.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect?.(p.id)}
                title={`${p.label} - ${p.wordsW} x ${p.rows} words, ${formatBytes(itemBytes(p))}`}
                className={cn(
                  'h-7 min-w-[6px] border border-rose/70',
                  selected === p.id && 'ring-1 ring-ink ring-inset',
                )}
                style={{
                  width: `${(Math.min(p.wordsW, VRAM_W) / VRAM_W) * 100}%`,
                  backgroundImage:
                    'repeating-linear-gradient(135deg, rgba(255,107,139,0.55) 0 5px, rgba(255,107,139,0.12) 5px 10px)',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
