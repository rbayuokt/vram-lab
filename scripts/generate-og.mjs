import { writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { GLYPHS } from '@/data/font';
import { typicalRacingLayout } from '@/data/vramLayouts';
import { formatBytes, VRAM_BYTES } from '@/utils/memory';
import { itemBytes, KIND_COLORS, packVram, VRAM_H, VRAM_W } from '@/utils/vram';
import { encodePng, fillRect, overlayRect, strokeRect, surface } from './lib/png.mjs';

/** Draws public/og.png with the app's own 5x7 font and VRAM packer. `npm run og`. */

const W = 1200;
const H = 630;
const PAD = 72;

const C = {
  void: '#07080b',
  panel: '#0b0e14',
  line: '#232c3b',
  hair: '#161c27',
  ink: '#dae2ee',
  dim: '#8c9bb0',
  faint: '#5b6a7e',
  mint: '#4de3bd',
  shadow: '#25453f',
};

const INK = GLYPHS.reduce((map, g) => map.set(g.char, g.bitmap), new Map());

// glyph cells are 8x8 with the 5x7 ink inset at (1,0); trimming it back out
// keeps tracking under our control instead of the atlas gutter's.
const advance = (scale, gap) => 6 * scale + gap;
const textWidth = (text, scale, gap) =>
  text.length ? (text.length - 1) * advance(scale, gap) + 5 * scale : 0;

function text(s, str, x, y, scale, color, { gap = scale, shadow } = {}) {
  const adv = advance(scale, gap);
  [...str.toUpperCase()].forEach((ch, i) => {
    const bitmap = INK.get(ch) ?? INK.get('?');
    const ox = x + i * adv;
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 1; gx <= 5; gx++) {
        if (bitmap[gy][gx] !== '#') continue;
        const px = ox + (gx - 1) * scale;
        const py = y + gy * scale;
        if (shadow) fillRect(s, px + scale, py + scale, scale, scale, shadow);
        fillRect(s, px, py, scale, scale, color);
      }
    }
  });
}

function textRight(s, str, xRight, y, scale, color, opts = {}) {
  text(s, str, xRight - textWidth(str, scale, opts.gap ?? scale), y, scale, color, opts);
}

/** The VRAM map, same shelf packing and colours the /hardware page draws. */
function vramMap(s, x, y, w) {
  const k = w / VRAM_W;
  const h = VRAM_H * k;
  fillRect(s, x, y, w, h, '#0a0d12');

  // checker the free area so unused VRAM reads as empty rather than as nothing
  for (let cy = 0; cy < h; cy += 8) {
    for (let cx = (cy / 8) % 2 ? 8 : 0; cx < w; cx += 16) {
      fillRect(s, x + cx, y + cy, 8, 8, '#0d1119');
    }
  }

  for (let wx = 0; wx <= VRAM_W; wx += 64) {
    fillRect(s, x + wx * k, y, 1, h, wx % 256 === 0 ? C.line : C.hair);
  }
  fillRect(s, x, y + 256 * k, w, 1, C.line);

  for (const p of packVram(typicalRacingLayout()).placements) {
    if (!p.fits) continue;
    const color = KIND_COLORS[p.kind];
    const pw = Math.max(2, p.wordsW * k);
    const ph = Math.max(2, p.rows * k);
    fillRect(s, x + p.x * k, y + p.y * k, pw, ph, color);
    overlayRect(s, x + p.x * k, y + p.y * k, pw, ph, '#000000', 0.34);
    strokeRect(s, x + p.x * k, y + p.y * k, pw, ph, color, 1);
  }
  strokeRect(s, x, y, w, h, C.line, 1);
}

const s = surface(W, H, C.void);

for (let x = 0; x < W; x += 24) overlayRect(s, x, 0, 1, H, '#62a8ff', 0.05);
for (let y = 0; y < H; y += 24) overlayRect(s, 0, y, W, 1, '#62a8ff', 0.05);

// favicon's four swatches, stretched into a header rule
['#4de3bd', '#ffb454', '#62a8ff', '#ff6b8b'].forEach((c, i) => {
  fillRect(s, i * (W / 4), 0, W / 4, 7, c);
});

text(s, 'Interactive playground - 1994 hardware', PAD, 92, 3, C.mint, { gap: 4 });
text(s, 'VRAM LAB', PAD, 138, 12, C.ink, { gap: 12, shadow: C.shadow });
fillRect(s, PAD, 258, W - PAD * 2, 1, C.line);
text(s, 'One megabyte of video memory,', PAD, 292, 5, C.dim, { gap: 6 });
text(s, 'and a whole game inside it.', PAD, 340, 5, C.dim, { gap: 6 });

const MAP_W = 360;
const MAP_X = W - PAD - MAP_W;
const MAP_Y = 392;
vramMap(s, MAP_X, MAP_Y, MAP_W);
textRight(s, '1024 x 512 words - 1 MB', MAP_X + MAP_W, MAP_Y + 192, 2, C.faint, {
  gap: 3,
});

const packed = packVram(typicalRacingLayout());
const legend = [
  ['framebuffer', 'Framebuffers'],
  ['texture', 'Textures'],
  ['clut', 'CLUTs'],
];
legend.forEach(([kind, label], i) => {
  const bytes = packed.placements
    .filter((p) => p.kind === kind)
    .reduce((n, p) => n + itemBytes(p), 0);
  const y = MAP_Y + 8 + i * 36;
  fillRect(s, PAD, y, 16, 16, KIND_COLORS[kind]);
  text(s, label, PAD + 30, y, 3, C.dim, { gap: 4 });
  textRight(s, formatBytes(bytes), PAD + 490, y, 3, C.faint, { gap: 4 });
});

const pct = Math.round((packed.usedBytes / VRAM_BYTES) * 100);
text(s, `${pct}% of VRAM spent`, PAD, MAP_Y + 128, 4, C.mint, { gap: 5 });
text(s, 'vram-lab.houseofky.xyz', PAD, MAP_Y + 176, 3, C.faint, { gap: 4 });

const og = encodePng(s);
writeFileSync(fileURLToPath(new URL('../public/og.png', import.meta.url)), og);

// same four swatches as favicon.svg, at the size iOS and link unfurlers ask for
const icon = surface(180, 180, C.panel);
[
  [0, 0, '#4de3bd'],
  [1, 0, '#ffb454'],
  [0, 1, '#62a8ff'],
  [1, 1, '#ff6b8b'],
].forEach(([cx, cy, color]) => {
  fillRect(icon, 22 + cx * 79, 22 + cy * 79, 57, 57, color);
});
writeFileSync(
  fileURLToPath(new URL('../public/apple-touch-icon.png', import.meta.url)),
  encodePng(icon),
);

console.log(
  `og.png ${W}x${H} (${(og.length / 1024).toFixed(1)} KB) + apple-touch-icon.png`,
);
