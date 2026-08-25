/**
 * Turns an indexed image into the bytes a file would hold. Feeds the hex
 * inspector: same picture, viewed as storage.
 */
import { toBgr555 } from '@/utils/color';
import { packNibbles, packWordsLE, type NibbleOrder } from '@/utils/encoding';
import type { ColorDepth } from '@/utils/memory';
import { getPixel, TRANSPARENT, type IndexedImage, type Palette } from '@/utils/pixel';

export interface SerializedTexture {
  bytes: number[];
  /** Bytes per image row, after packing. */
  rowBytes: number;
  /** Byte offsets that hold the pixel at (x, y). */
  offsetsFor: (x: number, y: number) => number[];
}

export function serializeTexture(
  img: IndexedImage,
  palette: Palette,
  depth: ColorDepth,
  order: NibbleOrder = 'ps1',
): SerializedTexture {
  if (depth === 4) {
    const rowBytes = Math.ceil(img.width / 2);
    const bytes: number[] = [];
    for (let y = 0; y < img.height; y++) {
      const row = Array.from({ length: img.width }, (_, x) => getPixel(img, x, y));
      bytes.push(...packNibbles(row, order));
    }
    return {
      bytes,
      rowBytes,
      offsetsFor: (x, y) => [y * rowBytes + Math.floor(x / 2)],
    };
  }

  if (depth === 8) {
    const bytes: number[] = [];
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) bytes.push(getPixel(img, x, y));
    }
    return { bytes, rowBytes: img.width, offsetsFor: (x, y) => [y * img.width + x] };
  }

  const words: number[] = [];
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const color = palette[getPixel(img, x, y)];
      words.push(!color || color === TRANSPARENT ? 0x0000 : toBgr555(color));
    }
  }
  const rowBytes = img.width * 2;
  return {
    bytes: packWordsLE(words),
    rowBytes,
    offsetsFor: (x, y) => [y * rowBytes + x * 2, y * rowBytes + x * 2 + 1],
  };
}

/** A CLUT as it sits in VRAM: N little-endian BGR555 words. */
export function serializeClut(palette: Palette, entries: number): number[] {
  const words = Array.from({ length: entries }, (_, i) => {
    const c = palette[i];
    return !c || c === TRANSPARENT ? 0x0000 : toBgr555(c);
  });
  return packWordsLE(words);
}
