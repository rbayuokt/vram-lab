/**
 * Indexed-image plumbing shared by every playground: a width, a height and one
 * palette index per pixel. Nothing here knows a colour; that needs a palette,
 * supplied at draw time.
 */

export const TRANSPARENT = 'transparent';

/** 16 or 256 entries of #rrggbb, with TRANSPARENT allowed (usually index 0). */
export type Palette = string[];

export interface IndexedImage {
  width: number;
  height: number;
  data: Uint8Array;
}

/** Build an image from ASCII rows of hex digits ('0'-'f'), one char per pixel. */
export function fromRows(rows: string[]): IndexedImage {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const data = new Uint8Array(width * height);
  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`row ${y} is ${row.length} wide, expected ${width}`);
    }
    for (let x = 0; x < width; x++) data[y * width + x] = parseInt(row[x], 16);
  });
  return { width, height, data };
}

export function makeImage(
  width: number,
  height: number,
  fn: (x: number, y: number) => number,
): IndexedImage {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) data[y * width + x] = fn(x, y) & 0xff;
  }
  return { width, height, data };
}

export function emptyImage(width: number, height: number, fill = 0): IndexedImage {
  return { width, height, data: new Uint8Array(width * height).fill(fill) };
}

export function cloneImage(img: IndexedImage): IndexedImage {
  return { width: img.width, height: img.height, data: new Uint8Array(img.data) };
}

export const getPixel = (img: IndexedImage, x: number, y: number): number =>
  x < 0 || y < 0 || x >= img.width || y >= img.height ? 0 : img.data[y * img.width + x];

export function setPixel(img: IndexedImage, x: number, y: number, value: number): void {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  img.data[y * img.width + x] = value;
}

/** Copy src into dst with its top-left at (ox, oy). Index 0 is copied too. */
export function blit(dst: IndexedImage, src: IndexedImage, ox: number, oy: number): void {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      setPixel(dst, ox + x, oy + y, src.data[y * src.width + x]);
    }
  }
}

export function usedIndexes(img: IndexedImage): number[] {
  const seen = new Set<number>();
  for (const v of img.data) seen.add(v);
  return [...seen].sort((a, b) => a - b);
}

export interface DrawOptions {
  scale?: number;
  originX?: number;
  originY?: number;
  /** Palette index treated as "draw nothing". -1 disables. */
  transparentIndex?: number;
}

/** Paint an indexed image into a 2D context at integer scale. */
export function drawIndexed(
  ctx: CanvasRenderingContext2D,
  img: IndexedImage,
  palette: Palette,
  opts: DrawOptions = {},
): void {
  const { scale = 1, originX = 0, originY = 0, transparentIndex = 0 } = opts;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = img.data[y * img.width + x];
      if (idx === transparentIndex) continue;
      const color = palette[idx];
      if (!color || color === TRANSPARENT) continue;
      ctx.fillStyle = color;
      ctx.fillRect(originX + x * scale, originY + y * scale, scale, scale);
    }
  }
}

/** Checkerboard used behind sprites so transparency reads as transparency. */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cell = 8,
  a = '#12161e',
  b = '#0d1117',
): void {
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      ctx.fillStyle = ((x / cell + y / cell) | 0) % 2 === 0 ? a : b;
      ctx.fillRect(x, y, Math.min(cell, w - x), Math.min(cell, h - y));
    }
  }
}

/** Deterministic value noise - keeps generated tiles identical every render. */
export function hash2(x: number, y: number, seed = 0): number {
  let h = x * 374761393 + y * 668265263 + seed * 2246822519;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
