import { PS1 } from '@/data/ps1';
import type { ColorDepth } from '@/utils/memory';

/**
 * VRAM as the hardware sees it: a 1024 x 512 grid of 16-bit words where every
 * resource is a rectangle, not a heap you malloc from. A texture's width in
 * that grid shrinks with bit depth, so a 4bpp 256-wide texture spans 64 words.
 *
 * Real games placed the rectangles by hand and respected texture-page and CLUT
 * alignment. Shelf packing is close enough to show the shape of the problem.
 */

export const VRAM_W = PS1.vram.width; // 1024 words
export const VRAM_H = PS1.vram.height; // 512 rows

export type VramKind = 'framebuffer' | 'texture' | 'clut' | 'other';

export interface VramItem {
  id: string;
  kind: VramKind;
  label: string;
  /** Width in 16-bit VRAM words. */
  wordsW: number;
  /** Height in VRAM rows. */
  rows: number;
  detail?: string;
}

export interface Placement extends VramItem {
  x: number;
  y: number;
  fits: boolean;
}

export interface PackResult {
  placements: Placement[];
  /** Bytes of VRAM area consumed by everything, fitting or not. */
  usedBytes: number;
  fittedBytes: number;
  overflowBytes: number;
}

export const itemBytes = (item: VramItem) => item.wordsW * item.rows * 2;

/** Words across that a texture of this pixel-width occupies at this depth. */
export const textureWords = (pixelWidth: number, depth: ColorDepth) =>
  Math.ceil((pixelWidth * depth) / 16);

export function makeTextureItem(
  id: string,
  w: number,
  h: number,
  depth: ColorDepth,
  label?: string,
): VramItem {
  return {
    id,
    kind: 'texture',
    label: label ?? `${w}x${h} ${depth}bpp`,
    wordsW: textureWords(w, depth),
    rows: h,
    detail: `${w}x${h} at ${depth} bits per pixel`,
  };
}

export function makeFramebufferItem(
  id: string,
  w: number,
  h: number,
  label?: string,
): VramItem {
  return {
    id,
    kind: 'framebuffer',
    label: label ?? `${w}x${h} buffer`,
    wordsW: w,
    rows: h,
    detail: 'Always 16-bit, one word per pixel',
  };
}

export function makeClutItem(id: string, depth: 4 | 8, label?: string): VramItem {
  const entries = depth === 4 ? 16 : 256;
  return {
    id,
    kind: 'clut',
    label: label ?? `CLUT ${entries}`,
    wordsW: entries,
    rows: 1,
    detail: `${entries} colours, one 16-bit word each`,
  };
}

export function makeOtherItem(id: string, bytes: number, label: string): VramItem {
  const words = Math.ceil(bytes / 2);
  const wordsW = Math.min(VRAM_W, 256);
  return {
    id,
    kind: 'other',
    label,
    wordsW,
    rows: Math.max(1, Math.ceil(words / wordsW)),
  };
}

/** Shelf-pack rectangles top-left first; anything that will not fit is flagged. */
export function packVram(items: VramItem[]): PackResult {
  const placements: Placement[] = [];
  let x = 0;
  let y = 0;
  let shelfH = 0;
  let fittedBytes = 0;
  let overflowBytes = 0;

  for (const item of items) {
    const w = Math.min(item.wordsW, VRAM_W);
    if (x + w > VRAM_W) {
      x = 0;
      y += shelfH;
      shelfH = 0;
    }
    const fits = y + item.rows <= VRAM_H;
    placements.push({ ...item, x, y: fits ? y : VRAM_H, fits });
    if (fits) {
      x += w;
      shelfH = Math.max(shelfH, item.rows);
      fittedBytes += itemBytes(item);
    } else {
      overflowBytes += itemBytes(item);
    }
  }

  return {
    placements,
    usedBytes: fittedBytes + overflowBytes,
    fittedBytes,
    overflowBytes,
  };
}

export const KIND_COLORS: Record<VramKind, string> = {
  framebuffer: '#62a8ff',
  texture: '#4de3bd',
  clut: '#ffb454',
  other: '#b48dff',
};

export const KIND_LABELS: Record<VramKind, string> = {
  framebuffer: 'Framebuffer',
  texture: 'Texture',
  clut: 'CLUT',
  other: 'Other GPU data',
};
