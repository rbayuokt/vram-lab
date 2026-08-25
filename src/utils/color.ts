/**
 * Color helpers, including the PS1's 16-bit pixel format: BGR555, five bits per
 * channel plus an STP ("semi-transparency") flag in the top bit. Not RGB565,
 * and only 15 bits of colour, which is why PS1 gradients band.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

const byte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((c) => byte(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Drop one channel to 5 bits, the resolution the GPU actually keeps. */
export const quantize5 = (v: number) => (byte(v) >> 3) * 8;

/** Snap a hex color onto the 15-bit grid the PS1 can represent. */
export function snapToPs1(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const q = (v: number) => (v >> 3) * 8;
  return rgbToHex({ r: q(r), g: q(g), b: q(b) });
}

/** Pack #rrggbb into the GPU's 16-bit BGR555 word. */
export function toBgr555(hex: string, stp = false): number {
  const { r, g, b } = hexToRgb(hex);
  const w = ((r >> 3) & 31) | (((g >> 3) & 31) << 5) | (((b >> 3) & 31) << 10);
  return stp ? w | 0x8000 : w;
}

/** Unpack a BGR555 word back to #rrggbb (STP bit ignored). */
export function fromBgr555(word: number): string {
  const r = ((word >> 0) & 31) * 8;
  const g = ((word >> 5) & 31) * 8;
  const b = ((word >> 10) & 31) * 8;
  return rgbToHex({ r, g, b });
}

/** Readable ink color for a swatch background. */
export function contrastInk(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Rec. 601 luma is good enough for picking black-or-white text.
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.55 ? '#07080b' : '#dae2ee';
}

export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex({
    r: A.r + (B.r - A.r) * t,
    g: A.g + (B.g - A.g) * t,
    b: A.b + (B.b - A.b) * t,
  });
}
