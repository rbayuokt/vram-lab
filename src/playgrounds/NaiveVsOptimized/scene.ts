import { TILE_SIZE, TILEMAP_SET, tileImage } from '@/data/tiles';
import { blit, emptyImage, hash2, type IndexedImage } from '@/utils/pixel';

/** The demo scene, shared by both halves of the comparison. */
export const SCENE_COLS = 16;
export const SCENE_ROWS = 10;
export const SCENE_W = SCENE_COLS * TILE_SIZE;
export const SCENE_H = SCENE_ROWS * TILE_SIZE;

export const SCENE_MAP: number[] = (() => {
  const map: number[] = [];
  for (let y = 0; y < SCENE_ROWS; y++) {
    for (let x = 0; x < SCENE_COLS; x++) {
      let t = 0;
      if (y === 0) t = hash2(x, y, 12) > 0.7 ? 4 : 0;
      else if (y === 1) t = x === 3 || x === 12 ? 5 : 2;
      else if (y === 2) t = 6;
      else if (y >= 4 && y <= 6) t = 1;
      else if (y === 8 && x >= 6 && x <= 9) t = 3;
      else if (y === 9) t = hash2(x, y, 3) > 0.8 ? 4 : 0;
      map.push(t);
    }
  }
  return map;
})();

let cache: IndexedImage | null = null;

export function sceneBackground(): IndexedImage {
  if (cache) return cache;
  const img = emptyImage(SCENE_W, SCENE_H, 0);
  SCENE_MAP.forEach((t, i) => {
    blit(
      img,
      tileImage(TILEMAP_SET[t]),
      (i % SCENE_COLS) * TILE_SIZE,
      Math.floor(i / SCENE_COLS) * TILE_SIZE,
    );
  });
  cache = img;
  return img;
}

export const CAR_SLOTS = [
  { x: 24, y: 72, palette: 0 },
  { x: 88, y: 72, palette: 1 },
  { x: 152, y: 72, palette: 2 },
  { x: 216, y: 72, palette: 3 },
];

export const HUD_LINES = ['LAP 2/3', 'TIME 1:24:07'];
