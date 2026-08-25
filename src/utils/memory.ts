/**
 * Memory maths for PS1-era texture storage. Pure, no React or DOM: playgrounds
 * render whatever these return and never compute sizes inline.
 */

/** Bits used to store one pixel. PS1 texture pages come in exactly these three. */
export type ColorDepth = 4 | 8 | 16;

export const COLOR_DEPTHS: ColorDepth[] = [4, 8, 16];

export const KIB = 1024;
export const MIB = 1024 * 1024;

/** PS1 VRAM: 1 MiB, wired as a 1024 x 512 grid of 16-bit words. */
export const VRAM_BYTES = MIB;
/** Main RAM, where code + non-graphics data lives. */
export const MAIN_RAM_BYTES = 2 * MIB;

export const depthLabel = (d: ColorDepth) =>
  d === 16 ? '16-bit direct' : `${d}-bit indexed`;

export const depthShort = (d: ColorDepth) => `${d}bpp`;

/** How many distinct colors a mode can address at once. */
export const paletteSize = (d: ColorDepth) => (d === 16 ? 32768 : 2 ** d);

/** Pixels packed into a single byte at this depth (16bpp spends 2 bytes/pixel). */
export const pixelsPerByte = (d: ColorDepth) => 8 / d;

export const pixelCount = (w: number, h: number) => w * h;

/** Raw pixel data only; CLUT cost is counted separately. */
export function textureBytes(w: number, h: number, depth: ColorDepth): number {
  return Math.ceil((w * h * depth) / 8);
}

export function textureBits(w: number, h: number, depth: ColorDepth): number {
  return w * h * depth;
}

/**
 * CLUT cost. A 4bpp CLUT is 16 entries, 8bpp is 256, each entry one 16-bit
 * word. 16bpp textures carry their color inline so they have no CLUT.
 */
export function clutBytes(depth: ColorDepth): number {
  return depth === 16 ? 0 : paletteSize(depth) * 2;
}

export function totalBytes(w: number, h: number, depth: ColorDepth): number {
  return textureBytes(w, h, depth) + clutBytes(depth);
}

/** Framebuffer cost at a given display resolution (PS1 displays 16bpp). */
export function framebufferBytes(w: number, h: number, buffers = 2): number {
  return w * h * 2 * buffers;
}

export const percentOfVram = (bytes: number) => (bytes / VRAM_BYTES) * 100;

export function formatBytes(bytes: number, opts?: { long?: boolean }): string {
  if (bytes < KIB) return `${bytes} B`;
  if (bytes < MIB) {
    const k = bytes / KIB;
    const s = `${trim(k)} KiB`;
    return opts?.long ? `${s} (${group(bytes)} B)` : s;
  }
  const m = bytes / MIB;
  const s = `${trim(m)} MiB`;
  return opts?.long ? `${s} (${group(bytes)} B)` : s;
}

function trim(n: number): string {
  if (Number.isInteger(n)) return String(n);
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2).replace(/0$/, '');
}

/** 1048576 -> "1,048,576". */
export function group(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** Ratio between two depths for the same dimensions, e.g. 16bpp/4bpp = 4. */
export function depthRatio(from: ColorDepth, to: ColorDepth): number {
  return from / to;
}

export function savedPercent(before: number, after: number): number {
  if (before <= 0) return 0;
  return ((before - after) / before) * 100;
}
