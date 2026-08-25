import { fromRows, TRANSPARENT, type IndexedImage, type Palette } from '@/utils/pixel';

/**
 * Hand-authored 16 x 16 pixel art, stored the way a PS1 game would: one
 * palette index per pixel, written here as hex digits. Index 0 is transparent.
 *
 * Kept as index data rather than colours so the palette-swap playground can
 * hand the same bytes to a different CLUT.
 */

export interface SpritePalette {
  id: string;
  name: string;
  colors: Palette;
}

export interface SpriteDef {
  id: string;
  name: string;
  /** What each index means, for the inspector panels. */
  roles: string[];
  rows: string[];
  palettes: SpritePalette[];
}

const CAR_ROWS = [
  '0000000000000000',
  '0000111111110000',
  '0001277777721000',
  '0001222222221000',
  '0661222222221660',
  '0661222222221660',
  '0001222222221000',
  '0001244444421000',
  '0001245555421000',
  '0001244444421000',
  '0001222222221000',
  '0661222222221660',
  '0661222222221660',
  '0001233333321000',
  '0001333333331000',
  '0000111111110000',
];

const SHIP_ROWS = [
  '0000000110000000',
  '0000001221000000',
  '0000001221000000',
  '0000012332100000',
  '0000012442100000',
  '0000012552100000',
  '0000122442210000',
  '0001222222221000',
  '0012222222222100',
  '0122222222222210',
  '1222211221122221',
  '1221100110011221',
  '0011006666001100',
  '0000067777600000',
  '0000007777000000',
  '0000000770000000',
];

const HERO_ROWS = [
  '0000011111100000',
  '0000133333310000',
  '0001333333331000',
  '0001322222231000',
  '0001321221231000',
  '0001322222231000',
  '0001322112231000',
  '0000122222210000',
  '0011444444441100',
  '0121444444441210',
  '0121444554441210',
  '0121444554441210',
  '0011444554441100',
  '0001666116661000',
  '0001666006661000',
  '0001777007771000',
];

const pad = (colors: string[]): Palette => {
  const out = colors.slice(0, 16);
  while (out.length < 16) out.push('#000000');
  return out;
};

export const SPRITES: Record<string, SpriteDef> = {
  car: {
    id: 'car',
    name: 'Racer',
    roles: [
      'transparent',
      'outline',
      'body',
      'body shade',
      'glass',
      'glass highlight',
      'tyre',
      'headlight',
    ],
    rows: CAR_ROWS,
    palettes: [
      {
        id: 'red',
        name: 'Team Red',
        colors: pad([
          TRANSPARENT,
          '#180d10',
          '#e23b3b',
          '#8c1f28',
          '#7fd8ff',
          '#d9f5ff',
          '#14161c',
          '#ffe066',
        ]),
      },
      {
        id: 'blue',
        name: 'Team Blue',
        colors: pad([
          TRANSPARENT,
          '#0d1018',
          '#3b6be2',
          '#1f3a8c',
          '#7fd8ff',
          '#d9f5ff',
          '#14161c',
          '#ffe066',
        ]),
      },
      {
        id: 'green',
        name: 'Team Green',
        colors: pad([
          TRANSPARENT,
          '#0d180f',
          '#47c46b',
          '#1f6b38',
          '#c8ffd8',
          '#f0fff5',
          '#14161c',
          '#ffe066',
        ]),
      },
      {
        id: 'night',
        name: 'Night Rival',
        colors: pad([
          TRANSPARENT,
          '#05060a',
          '#6b7280',
          '#3a3f4a',
          '#2a3550',
          '#5c6d94',
          '#0a0b0f',
          '#ff5a4d',
        ]),
      },
    ],
  },
  ship: {
    id: 'ship',
    name: 'Interceptor',
    roles: [
      'transparent',
      'outline',
      'hull',
      'hull shade',
      'canopy',
      'canopy glint',
      'engine ring',
      'thrust',
    ],
    rows: SHIP_ROWS,
    palettes: [
      {
        id: 'alliance',
        name: 'Alliance',
        colors: pad([
          TRANSPARENT,
          '#0b1020',
          '#9fb4d8',
          '#5b6b8c',
          '#4fd6ff',
          '#e6fbff',
          '#ffb454',
          '#ff6b3d',
        ]),
      },
      {
        id: 'pirate',
        name: 'Pirate',
        colors: pad([
          TRANSPARENT,
          '#150a12',
          '#8c3b56',
          '#4d1f2f',
          '#ffcf5c',
          '#fff3cf',
          '#b48dff',
          '#ff4d8d',
        ]),
      },
      {
        id: 'ghost',
        name: 'Ghost',
        colors: pad([
          TRANSPARENT,
          '#04120f',
          '#3fa88c',
          '#1c4f45',
          '#b6ffe9',
          '#ffffff',
          '#4de3bd',
          '#9ae66e',
        ]),
      },
    ],
  },
  hero: {
    id: 'hero',
    name: 'Pilot',
    roles: [
      'transparent',
      'outline',
      'skin',
      'hair',
      'jacket',
      'jacket shade',
      'trousers',
      'boots',
    ],
    rows: HERO_ROWS,
    palettes: [
      {
        id: 'default',
        name: 'Rookie',
        colors: pad([
          TRANSPARENT,
          '#150f0c',
          '#e0a878',
          '#54331f',
          '#d8452f',
          '#8f2a1c',
          '#2f3a58',
          '#1a1c22',
        ]),
      },
      {
        id: 'veteran',
        name: 'Veteran',
        colors: pad([
          TRANSPARENT,
          '#0e0f14',
          '#8c6a52',
          '#c9cdd6',
          '#2f6f8f',
          '#1d465c',
          '#22262f',
          '#12141a',
        ]),
      },
      {
        id: 'boss',
        name: 'Boss',
        colors: pad([
          TRANSPARENT,
          '#12060a',
          '#c4b8a8',
          '#1a1a1f',
          '#7a1f3d',
          '#4a1226',
          '#1a1420',
          '#0d0a10',
        ]),
      },
    ],
  },
};

export const SPRITE_LIST = Object.values(SPRITES);

const cache = new Map<string, IndexedImage>();

export function spriteImage(id: string): IndexedImage {
  const hit = cache.get(id);
  if (hit) return hit;
  const def = SPRITES[id];
  if (!def) throw new Error(`unknown sprite: ${id}`);
  const img = fromRows(def.rows);
  cache.set(id, img);
  return img;
}
