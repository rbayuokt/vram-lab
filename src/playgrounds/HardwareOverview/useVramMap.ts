import { useCallback, useMemo, useRef, useState } from 'react';
import { DISPLAY_MODES } from '@/data/ps1';
import { TYPICAL_LAYOUT_IDS, typicalRacingLayout } from '@/data/vramLayouts';
import type { ColorDepth } from '@/utils/memory';
import {
  makeClutItem,
  makeFramebufferItem,
  makeOtherItem,
  makeTextureItem,
  packVram,
  type VramItem,
} from '@/utils/vram';

const initialItems = (): VramItem[] => [
  makeFramebufferItem('fb-0', 320, 240, 'Framebuffer A (displayed)'),
  makeFramebufferItem('fb-1', 320, 240, 'Framebuffer B (drawing)'),
];

export function useVramMap() {
  const [items, setItems] = useState<VramItem[]>(initialItems);
  const [selected, setSelected] = useState<string | null>(null);
  const [texW, setTexW] = useState(256);
  const [texH, setTexH] = useState(256);
  const [depth, setDepth] = useState<ColorDepth>(8);
  const [mode, setMode] = useState(DISPLAY_MODES[1].id);
  const counter = useRef(0);

  const nextId = () => `it-${(counter.current += 1)}`;
  const packed = useMemo(() => packVram(items), [items]);

  const addTexture = useCallback(() => {
    setItems((prev) => [...prev, makeTextureItem(nextId(), texW, texH, depth)]);
  }, [texW, texH, depth]);

  const addClut = useCallback((d: 4 | 8) => {
    setItems((prev) => [...prev, makeClutItem(nextId(), d)]);
  }, []);

  const addOther = useCallback((bytes: number, label: string) => {
    setItems((prev) => [...prev, makeOtherItem(nextId(), bytes, label)]);
  }, []);

  const addFramebuffers = useCallback(() => {
    const m = DISPLAY_MODES.find((d) => d.id === mode) ?? DISPLAY_MODES[1];
    setItems((prev) => [
      ...prev.filter((i) => i.kind !== 'framebuffer'),
      makeFramebufferItem('fb-0', m.w, m.h, `Framebuffer A ${m.id}`),
      makeFramebufferItem('fb-1', m.w, m.h, `Framebuffer B ${m.id}`),
    ]);
  }, [mode]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected((s) => (s === id ? null : s));
  }, []);

  const reset = useCallback(() => {
    setItems(initialItems());
    setSelected(null);
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setSelected(null);
  }, []);

  const loadTypical = useCallback(() => {
    counter.current = TYPICAL_LAYOUT_IDS;
    setItems(typicalRacingLayout());
    setSelected(null);
  }, []);

  return {
    items,
    packed,
    selected,
    setSelected,
    texW,
    setTexW,
    texH,
    setTexH,
    depth,
    setDepth,
    mode,
    setMode,
    addTexture,
    addClut,
    addOther,
    addFramebuffers,
    remove,
    reset,
    clear,
    loadTypical,
  };
}
