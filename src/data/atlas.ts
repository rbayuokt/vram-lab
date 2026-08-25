import { blit, emptyImage, type IndexedImage } from '@/utils/pixel';
import { TILE_SIZE, tileImage, type TileId } from '@/data/tiles';

/**
 * A tiny 64 x 32 texture atlas: eight 16 x 16 cells sharing one CLUT.
 *
 * A PS1 draw command carries a texture page plus 8-bit U/V offsets, so putting
 * every small image inside one page means the GPU never has to switch pages
 * mid-scene - which is why atlases were about speed as much as memory.
 */

export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 2;
export const CELL = TILE_SIZE;
export const ATLAS_W = ATLAS_COLS * CELL;
export const ATLAS_H = ATLAS_ROWS * CELL;

export interface AtlasCell {
  id: TileId;
  name: string;
  index: number;
  u: number;
  v: number;
  w: number;
  h: number;
}

const ORDER: TileId[] = ['car', 'wheel', 'tree', 'door', 'wall', 'road', 'sign', 'grass'];

export const ATLAS_CELLS: AtlasCell[] = ORDER.map((id, index) => ({
  id,
  name: id.toUpperCase(),
  index,
  u: (index % ATLAS_COLS) * CELL,
  v: Math.floor(index / ATLAS_COLS) * CELL,
  w: CELL,
  h: CELL,
}));

let cache: IndexedImage | null = null;

export function atlasImage(): IndexedImage {
  if (cache) return cache;
  const img = emptyImage(ATLAS_W, ATLAS_H, 0);
  for (const cell of ATLAS_CELLS) blit(img, tileImage(cell.id), cell.u, cell.v);
  cache = img;
  return img;
}

export const cellByIndex = (i: number): AtlasCell | undefined => ATLAS_CELLS[i];

/** Starting scene for the builder: 12 x 6 cells of atlas indexes. */
export const SCENE_COLS = 12;
export const SCENE_ROWS = 6;

const g = 7; // grass
const r = 5; // road
const t = 2; // tree
const w = 4; // wall
const d = 3; // door
const s = 6; // sign
const c = 0; // car
const h = 1; // wheel

export const SCENE_PRESET: number[] = [
  g,
  g,
  t,
  g,
  g,
  s,
  g,
  g,
  t,
  g,
  g,
  g,
  w,
  w,
  d,
  w,
  w,
  w,
  w,
  d,
  w,
  w,
  w,
  w,
  g,
  g,
  g,
  g,
  g,
  g,
  g,
  g,
  g,
  g,
  g,
  g,
  r,
  r,
  r,
  r,
  r,
  r,
  r,
  r,
  r,
  r,
  r,
  r,
  r,
  r,
  c,
  r,
  r,
  r,
  r,
  c,
  r,
  r,
  r,
  r,
  g,
  h,
  g,
  g,
  t,
  g,
  g,
  g,
  g,
  t,
  g,
  h,
];
