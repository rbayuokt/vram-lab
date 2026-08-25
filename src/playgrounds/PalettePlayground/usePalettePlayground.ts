import { useCallback, useMemo, useState } from 'react';
import { SPRITES, spriteImage } from '@/data/sprites';
import { snapToPs1 } from '@/utils/color';
import {
  cloneImage,
  emptyImage,
  getPixel,
  setPixel,
  usedIndexes,
  type IndexedImage,
  type Palette,
} from '@/utils/pixel';

export type Tool = 'paint' | 'pick' | 'fill';

const SEED = SPRITES.hero;

const seedImage = (): IndexedImage => cloneImage(spriteImage('hero'));
const seedPalette = (): Palette => [...SEED.palettes[0].colors];

/** Names for the 16 CLUT slots. The first eight come from the seeded sprite. */
export const SLOT_ROLES = [
  ...SEED.roles,
  ...Array.from({ length: 16 - SEED.roles.length }, (_, i) => `free slot ${i + 1}`),
];

export function usePalettePlayground() {
  const [image, setImage] = useState<IndexedImage>(seedImage);
  const [palette, setPalette] = useState<Palette>(seedPalette);
  const [selected, setSelected] = useState(4);
  const [tool, setTool] = useState<Tool>('paint');
  const [showIndexes, setShowIndexes] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  const used = useMemo(() => usedIndexes(image), [image]);

  const paint = useCallback(
    (x: number, y: number) => {
      if (tool === 'pick') {
        setSelected(getPixel(image, x, y));
        return;
      }
      setImage((prev) => {
        const next = cloneImage(prev);
        if (tool === 'fill') {
          floodFill(next, x, y, selected);
        } else {
          setPixel(next, x, y, selected);
        }
        return next;
      });
    },
    [image, selected, tool],
  );

  const setSlotColor = useCallback((index: number, hex: string) => {
    setPalette((prev) => {
      const next = [...prev];
      next[index] = snapToPs1(hex);
      return next;
    });
  }, []);

  const setSlotTransparent = useCallback((index: number) => {
    setPalette((prev) => {
      const next = [...prev];
      next[index] = 'transparent';
      return next;
    });
  }, []);

  const clear = useCallback(
    () => setImage(emptyImage(image.width, image.height, 0)),
    [image.width, image.height],
  );

  const reset = useCallback(() => {
    setImage(seedImage());
    setPalette(seedPalette());
  }, []);

  return {
    image,
    palette,
    selected,
    setSelected,
    tool,
    setTool,
    showIndexes,
    setShowIndexes,
    hover,
    setHover,
    used,
    paint,
    setSlotColor,
    setSlotTransparent,
    clear,
    reset,
  };
}

/** Scanline-free flood fill; the canvas is 16x16 so recursion depth is fine. */
function floodFill(img: IndexedImage, x: number, y: number, value: number): void {
  const target = getPixel(img, x, y);
  if (target === value) return;
  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= img.width || cy >= img.height) continue;
    if (getPixel(img, cx, cy) !== target) continue;
    setPixel(img, cx, cy, value);
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}
