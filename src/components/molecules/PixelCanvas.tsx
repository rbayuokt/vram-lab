import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import {
  drawCheckerboard,
  drawIndexed,
  type IndexedImage,
  type Palette,
} from '@/utils/pixel';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PixelCanvasProps {
  image: IndexedImage;
  palette: Palette;
  scale: number;
  className?: string;
  /** Draw a checkerboard behind transparent pixels. */
  checkerboard?: boolean;
  /** Index skipped when drawing. -1 draws everything. */
  transparentIndex?: number;
  /** Hairline grid every N image pixels. 0 disables. */
  gridEvery?: number;
  gridColor?: string;
  /** Highlight rectangles in image-pixel space. */
  highlights?: Array<Rect & { color?: string; fill?: string; label?: string }>;
  cursor?: { x: number; y: number } | null;
  onPixel?: (x: number, y: number, event: React.PointerEvent) => void;
  onHover?: (p: { x: number; y: number } | null) => void;
  /** Keep painting while the pointer is held down. */
  drag?: boolean;
  ariaLabel?: string;
}

/**
 * Renders an indexed image through a palette, at integer scale, crisply.
 *
 * Every playground that shows "a texture" goes through here, so the pixel ->
 * index -> CLUT -> colour path is implemented exactly once.
 */
export function PixelCanvas({
  image,
  palette,
  scale,
  className,
  checkerboard = true,
  transparentIndex = 0,
  gridEvery = 0,
  gridColor = 'rgba(255,255,255,0.10)',
  highlights,
  cursor,
  onPixel,
  onHover,
  drag = false,
  ariaLabel,
}: PixelCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = image.width * scale;
  const h = image.height * scale;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    if (checkerboard) drawCheckerboard(ctx, w, h, Math.max(4, scale * 2));
    drawIndexed(ctx, image, palette, { scale, transparentIndex });

    if (gridEvery > 0) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= image.width; x += gridEvery) {
        ctx.moveTo(x * scale + 0.5, 0);
        ctx.lineTo(x * scale + 0.5, h);
      }
      for (let y = 0; y <= image.height; y += gridEvery) {
        ctx.moveTo(0, y * scale + 0.5);
        ctx.lineTo(w, y * scale + 0.5);
      }
      ctx.stroke();
    }

    for (const hl of highlights ?? []) {
      if (hl.fill) {
        ctx.fillStyle = hl.fill;
        ctx.fillRect(hl.x * scale, hl.y * scale, hl.w * scale, hl.h * scale);
      }
      ctx.strokeStyle = hl.color ?? '#4de3bd';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hl.x * scale + 1,
        hl.y * scale + 1,
        hl.w * scale - 2,
        hl.h * scale - 2,
      );
    }

    if (cursor) {
      // inset the stroke: centred on the cell edge it would be half-clipped
      // against the canvas bounds on the first and last row/column
      const lw = Math.min(2, Math.max(1, Math.floor(scale / 4)));
      ctx.strokeStyle = '#ffb454';
      ctx.lineWidth = lw;
      ctx.strokeRect(
        cursor.x * scale + lw / 2,
        cursor.y * scale + lw / 2,
        scale - lw,
        scale - lw,
      );
    }
  }, [
    image,
    palette,
    scale,
    w,
    h,
    checkerboard,
    transparentIndex,
    gridEvery,
    gridColor,
    highlights,
    cursor,
  ]);

  const locate = useCallback(
    (e: React.PointerEvent) => {
      const canvas = ref.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * image.width);
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * image.height);
      if (x < 0 || y < 0 || x >= image.width || y >= image.height) return null;
      return { x, y };
    },
    [image.width, image.height],
  );

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      aria-label={ariaLabel}
      role={onPixel ? 'button' : 'img'}
      style={{ width: w, height: h }}
      className={cn(
        'block border border-line bg-void select-none',
        onPixel && 'cursor-crosshair',
        className,
      )}
      onPointerDown={(e) => {
        const p = locate(e);
        if (!p || !onPixel) return;
        if (drag) e.currentTarget.setPointerCapture(e.pointerId);
        onPixel(p.x, p.y, e);
      }}
      onPointerMove={(e) => {
        const p = locate(e);
        onHover?.(p);
        if (drag && onPixel && e.buttons === 1 && p) onPixel(p.x, p.y, e);
      }}
      onPointerLeave={() => onHover?.(null)}
    />
  );
}
