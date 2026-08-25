import {
  hash2,
  makeImage,
  TRANSPARENT,
  type IndexedImage,
  type Palette,
} from '@/utils/pixel';

/**
 * 16 x 16 environment tiles, drawn programmatically so the repo carries no
 * borrowed art. One 16-entry palette covers the whole tileset: 16 x 128 bytes
 * of pixels plus 32 bytes of CLUT, once.
 */

export const TILE_SIZE = 16;

export const TILE_PALETTE: Palette = [
  TRANSPARENT, // 0
  '#12151b', // 1  outline / mortar
  '#2b6b3a', // 2  grass shadow
  '#3f9950', // 3  grass
  '#6cc46f', // 4  grass light
  '#33383f', // 5  asphalt dark
  '#474d57', // 6  asphalt
  '#ffd166', // 7  road marking
  '#6b4a34', // 8  wood dark
  '#946a45', // 9  wood
  '#175a86', // 10 water deep
  '#2a86c4', // 11 water
  '#8ddcff', // 12 water crest
  '#6b6f7a', // 13 stone
  '#9aa0ad', // 14 stone light
  '#dfe4ec', // 15 highlight
];

export type TileId =
  | 'grass'
  | 'road'
  | 'wall'
  | 'water'
  | 'tree'
  | 'door'
  | 'floor'
  | 'sign'
  | 'wheel'
  | 'car';

export interface TileDef {
  id: TileId;
  name: string;
  gen: (x: number, y: number) => number;
}

const S = TILE_SIZE;
const inRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) =>
  x >= x0 && x <= x1 && y >= y0 && y <= y1;

const grass = (x: number, y: number): number => {
  if (hash2(x, y, 1) > 0.9) return 4;
  if (hash2(x, y, 2) > 0.88) return 2;
  return 3;
};

const road = (x: number, y: number): number => {
  if (x <= 0 || x >= S - 1) return 5;
  if (x >= 7 && x <= 8 && y % 8 < 5) return 7;
  if (hash2(x, y, 3) > 0.93) return 5;
  return 6;
};

const wall = (x: number, y: number): number => {
  const course = Math.floor(y / 4);
  const offset = (course % 2) * 4;
  if (y % 4 === 3) return 1;
  if ((x + offset) % 8 === 7) return 1;
  return y % 4 === 0 ? 14 : 13;
};

const water = (x: number, y: number): number => {
  const band = Math.floor(y / 4) % 2;
  if (y % 4 === 0 && (x + band * 4) % 8 < 3) return 12;
  if (y % 4 === 2) return 10;
  return 11;
};

const tree = (x: number, y: number): number => {
  if (inRect(x, y, 7, 11, 8, 15)) return x === 7 ? 9 : 8;
  const d = Math.hypot(x - 7.5, y - 6);
  // dark rim first, so the canopy separates from the grass underneath it
  if (d < 5.4) {
    if (d > 4.5) return 1;
    return hash2(x, y, 4) > 0.72 ? 3 : 2;
  }
  return grass(x, y);
};

const door = (x: number, y: number): number => {
  if (inRect(x, y, 3, 2, 12, 15)) {
    if (x === 3 || x === 12 || y === 2) return 1;
    if (x === 4 || x === 11 || y === 3) return 8;
    if (x === 10 && y >= 8 && y <= 9) return 15;
    return (x + y) % 5 === 0 ? 8 : 9;
  }
  return wall(x, y);
};

const floor = (x: number, y: number): number => {
  if (x % 8 === 0 || y % 8 === 0) return 1;
  return (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0 ? 13 : 14;
};

const sign = (x: number, y: number): number => {
  if (inRect(x, y, 7, 9, 8, 15)) return x === 7 ? 9 : 8;
  if (inRect(x, y, 2, 1, 13, 8)) {
    if (x === 2 || x === 13 || y === 1 || y === 8) return 1;
    if (inRect(x, y, 4, 3, 11, 3) || inRect(x, y, 4, 5, 9, 5)) return 1;
    return 14;
  }
  return grass(x, y);
};

const wheel = (x: number, y: number): number => {
  const d = Math.hypot(x - 7.5, y - 7.5);
  if (d > 7.4) return 0;
  if (d > 5.6) return 1;
  if (d > 4.4) return 13;
  if (d > 2.2) return 1;
  if (d > 1.2) return 14;
  return 15;
};

/** A road-facing car cell for the atlas, kept in the tile palette. */
const car = (x: number, y: number): number => {
  const base = road(x, y);
  if (inRect(x, y, 4, 2, 11, 13)) {
    if (x === 4 || x === 11 || y === 2 || y === 13) return 1;
    if (inRect(x, y, 6, 5, 9, 8)) return 12;
    if (y === 3) return 7;
    return 15;
  }
  if (inRect(x, y, 2, 4, 3, 6) || inRect(x, y, 12, 4, 13, 6)) return 1;
  if (inRect(x, y, 2, 9, 3, 11) || inRect(x, y, 12, 9, 13, 11)) return 1;
  return base;
};

export const TILES: TileDef[] = [
  { id: 'grass', name: 'GRASS', gen: grass },
  { id: 'road', name: 'ROAD', gen: road },
  { id: 'wall', name: 'WALL', gen: wall },
  { id: 'water', name: 'WATER', gen: water },
  { id: 'tree', name: 'TREE', gen: tree },
  { id: 'door', name: 'DOOR', gen: door },
  { id: 'floor', name: 'FLOOR', gen: floor },
  { id: 'sign', name: 'SIGN', gen: sign },
  { id: 'wheel', name: 'WHEEL', gen: wheel },
  { id: 'car', name: 'CAR', gen: car },
];

const cache = new Map<TileId, IndexedImage>();

export function tileImage(id: TileId): IndexedImage {
  const hit = cache.get(id);
  if (hit) return hit;
  const def = TILES.find((t) => t.id === id);
  if (!def) throw new Error(`unknown tile: ${id}`);
  const img = makeImage(S, S, def.gen);
  cache.set(id, img);
  return img;
}

/** The tileset used by the tilemap playground (order = tile index). */
export const TILEMAP_SET: TileId[] = [
  'grass',
  'road',
  'wall',
  'water',
  'tree',
  'door',
  'floor',
];
