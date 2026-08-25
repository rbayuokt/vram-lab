import { CHAR_TABLE, CHAR_TABLE_COLS } from '@/utils/encoding';
import { emptyImage, setPixel, type IndexedImage } from '@/utils/pixel';

/**
 * A 5 x 7 bitmap font drawn in an 8 x 8 cell - the shape countless 32-bit era
 * games shipped. Each glyph is 7 strings of 5 characters; '#' is ink.
 *
 * Stored 1 bit per pixel conceptually, but the atlas below is emitted as a
 * 4bpp indexed texture because that is what a PS1 would actually upload.
 */

export const GLYPH_W = 8;
export const GLYPH_H = 8;
/** Ink sits at (1,0) inside the cell, leaving a 1px gutter left and 2px right. */
const INK_X = 1;
const INK_Y = 0;

const G: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '.##..', '.#...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '%': ['##..#', '##.#.', '..#..', '.#...', '#.##.', '..##.', '.....'],
};

export interface Glyph {
  id: number;
  char: string;
  /** 8 rows of 8 chars, '.' or '#'. */
  bitmap: string[];
  col: number;
  row: number;
}

function expand(char: string): string[] {
  const src = G[char] ?? G['?'];
  const rows: string[] = [];
  for (let y = 0; y < GLYPH_H; y++) {
    let line = '';
    for (let x = 0; x < GLYPH_W; x++) {
      const sx = x - INK_X;
      const sy = y - INK_Y;
      const on = sy >= 0 && sy < 7 && sx >= 0 && sx < 5 && src[sy][sx] === '#';
      line += on ? '#' : '.';
    }
    rows.push(line);
  }
  return rows;
}

export const GLYPHS: Glyph[] = CHAR_TABLE.map((char, id) => ({
  id,
  char,
  bitmap: expand(char),
  col: id % CHAR_TABLE_COLS,
  row: Math.floor(id / CHAR_TABLE_COLS),
}));

export const ATLAS_COLS = CHAR_TABLE_COLS;
export const ATLAS_ROWS = Math.ceil(GLYPHS.length / ATLAS_COLS);
export const ATLAS_W = ATLAS_COLS * GLYPH_W;
export const ATLAS_H = ATLAS_ROWS * GLYPH_H;

/** Font palette: 0 transparent, 1 ink, 2 shadow, 3 highlight. */
export const FONT_PALETTE = [
  'transparent',
  '#e8eef8',
  '#3d4a5c',
  '#4de3bd',
  ...Array.from({ length: 12 }, () => '#000000'),
];

let atlasCache: IndexedImage | null = null;

/** The whole font baked into one indexed texture, glyph cells left to right. */
export function glyphAtlas(): IndexedImage {
  if (atlasCache) return atlasCache;
  const img = emptyImage(ATLAS_W, ATLAS_H, 0);
  for (const g of GLYPHS) {
    const ox = g.col * GLYPH_W;
    const oy = g.row * GLYPH_H;
    g.bitmap.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) {
        if (line[x] === '#') setPixel(img, ox + x, oy + y, 1);
      }
    });
  }
  atlasCache = img;
  return img;
}

export function glyphImage(id: number): IndexedImage {
  const g = GLYPHS[id];
  const img = emptyImage(GLYPH_W, GLYPH_H, 0);
  if (!g) return img;
  g.bitmap.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      if (line[x] === '#') setPixel(img, x, y, 1);
    }
  });
  return img;
}

/** Ink pixels in a glyph - used to show that most of a glyph is empty. */
export function glyphInkCount(id: number): number {
  const g = GLYPHS[id];
  if (!g) return 0;
  return g.bitmap
    .join('')
    .split('')
    .filter((c) => c === '#').length;
}
