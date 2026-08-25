import { useEffect, useMemo, useState } from 'react';
import { GLYPH_H, GLYPH_W, glyphImage } from '@/data/font';
import { encodeString } from '@/utils/encoding';
import { blit, emptyImage, type IndexedImage } from '@/utils/pixel';

/** The five stages the renderer walks per character. */
export const RENDER_STAGES = [
  'Read character ID',
  'Find glyph',
  'Find atlas coordinates',
  'Render glyph',
  'Move cursor',
] as const;

const STAGE_MS = 320;

export function useGlyphRenderer(text: string) {
  const chars = useMemo(() => encodeString(text), [text]);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(true);

  const total = chars.length * RENDER_STAGES.length;

  // rewind when the text changes, adjusted during render rather than in an effect
  const [prevText, setPrevText] = useState(text);
  if (prevText !== text) {
    setPrevText(text);
    setTick(0);
  }

  useEffect(() => {
    if (!playing || total === 0) return;
    const id = window.setInterval(() => {
      setTick((t) => (t + 1 >= total ? 0 : t + 1));
    }, STAGE_MS);
    return () => window.clearInterval(id);
  }, [playing, total]);

  const charIndex = total === 0 ? 0 : Math.floor(tick / RENDER_STAGES.length);
  const stage = total === 0 ? 0 : tick % RENDER_STAGES.length;
  /** A glyph is on screen once its "render" stage has been passed. */
  const drawnCount = charIndex + (stage >= 3 ? 1 : 0);

  const output: IndexedImage = useMemo(() => {
    const img = emptyImage(Math.max(1, chars.length * GLYPH_W), GLYPH_H, 0);
    chars.slice(0, drawnCount).forEach((c, i) => {
      if (!c.known) return;
      blit(img, glyphImage(c.id), i * GLYPH_W, 0);
    });
    return img;
  }, [chars, drawnCount]);

  return {
    chars,
    tick,
    setTick,
    playing,
    setPlaying,
    charIndex,
    stage,
    drawnCount,
    output,
    total,
    step: () => setTick((t) => (total === 0 ? 0 : (t + 1) % total)),
    restart: () => setTick(0),
  };
}
