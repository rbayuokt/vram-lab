import { useMemo, useState } from 'react';
import { Callout } from '@/components/atoms/Callout';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import {
  ATLAS_H,
  ATLAS_W,
  FONT_PALETTE,
  GLYPHS,
  GLYPH_H,
  GLYPH_W,
  glyphAtlas,
  glyphImage,
} from '@/data/font';
import { SECTIONS } from '@/data/sections';
import { SPRITES, spriteImage } from '@/data/sprites';
import { TILE_PALETTE, TILE_SIZE, TILEMAP_SET, tileImage } from '@/data/tiles';
import { cn } from '@/lib/cn';
import { encodeString } from '@/utils/encoding';
import {
  clutBytes,
  formatBytes,
  group,
  savedPercent,
  textureBytes,
} from '@/utils/memory';
import { blit, emptyImage } from '@/utils/pixel';
import {
  CAR_SLOTS,
  HUD_LINES,
  SCENE_COLS,
  SCENE_H,
  SCENE_MAP,
  SCENE_ROWS,
  SCENE_W,
  sceneBackground,
} from './scene';

const meta = SECTIONS[11];
const BG = sceneBackground();
const CAR = spriteImage('car');
const CAR_PALETTES = SPRITES.car.palettes;

const NAIVE_POINTS = [
  'One unique texture per screen',
  'Every repeated tile stored again',
  'Full 16-bit direct colour everywhere',
  'Each car livery its own texture',
  'HUD text pre-rendered as pictures',
  'No palette reuse at all',
];

const OPT_POINTS = [
  'Small 16x16 tiles, reused',
  'Tilemap of one-byte indexes',
  '4-bit indexed colour',
  'One car texture, four CLUTs',
  'Glyph atlas + character IDs',
  'One CLUT shared by the whole tileset',
];

function hudImage(line: string) {
  const img = emptyImage(Math.max(1, line.length * GLYPH_W), GLYPH_H, 0);
  encodeString(line).forEach((c, i) => {
    if (c.known) blit(img, glyphImage(c.id), i * GLYPH_W, 0);
  });
  return img;
}

function SceneView({ scale }: { scale: number }) {
  const hud = useMemo(() => HUD_LINES.map(hudImage), []);
  return (
    <div
      className="relative border border-line bg-void"
      style={{ width: SCENE_W * scale, height: SCENE_H * scale }}
    >
      <PixelCanvas
        image={BG}
        palette={TILE_PALETTE}
        scale={scale}
        transparentIndex={-1}
        checkerboard={false}
        className="absolute inset-0 border-0"
      />
      {CAR_SLOTS.map((slot) => (
        <div
          key={slot.x}
          className="absolute"
          style={{ left: slot.x * scale, top: slot.y * scale }}
        >
          <PixelCanvas
            image={CAR}
            palette={CAR_PALETTES[slot.palette].colors}
            scale={scale}
            checkerboard={false}
            className="border-0"
          />
        </div>
      ))}
      {hud.map((img, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: (6 + (i === 0 ? 0 : HUD_LINES[0].length * GLYPH_W + 16)) * scale,
            top: 4 * scale,
          }}
        >
          <PixelCanvas
            image={img}
            palette={FONT_PALETTE}
            scale={scale}
            checkerboard={false}
            className="border-0"
          />
        </div>
      ))}
    </div>
  );
}

export function NaiveVsOptimized() {
  const [view, setView] = useState<'scene' | 'storage'>('scene');

  const budget = useMemo(() => {
    const tileInstances = SCENE_COLS * SCENE_ROWS;
    const uniqueTiles = new Set(SCENE_MAP).size;
    const glyphInstances = HUD_LINES.reduce((n, l) => n + l.length, 0);

    // Naive: flatten everything, store every instance as its own direct-colour art.
    const naiveBg = textureBytes(SCENE_W, SCENE_H, 16);
    const naiveCars = textureBytes(CAR.width, CAR.height, 16) * CAR_SLOTS.length;
    const naiveHud = HUD_LINES.reduce(
      (n, l) => n + textureBytes(l.length * GLYPH_W, GLYPH_H, 16),
      0,
    );
    const naive = naiveBg + naiveCars + naiveHud;
    const duplicated =
      (tileInstances - uniqueTiles) * textureBytes(TILE_SIZE, TILE_SIZE, 16);

    // Optimised: small indexed sources plus cheap index lists.
    const tileset = TILEMAP_SET.length * textureBytes(TILE_SIZE, TILE_SIZE, 4);
    const tilemap = tileInstances;
    const carTex = textureBytes(CAR.width, CAR.height, 4);
    const carCluts = clutBytes(4) * CAR_PALETTES.length;
    const fontAtlas = textureBytes(ATLAS_W, ATLAS_H, 4);
    const strings = glyphInstances;
    const cluts = clutBytes(4) * 2; // tileset + font
    const optimized = tileset + tilemap + carTex + carCluts + fontAtlas + strings + cluts;

    return {
      tileInstances,
      uniqueTiles,
      glyphInstances,
      naive,
      naiveBg,
      naiveCars,
      naiveHud,
      duplicated,
      optimized,
      tileset,
      tilemap,
      carTex,
      carCluts,
      fontAtlas,
      strings,
      cluts,
      uniqueAssetsNaive: 1 + CAR_SLOTS.length + HUD_LINES.length,
      uniqueAssetsOpt: TILEMAP_SET.length + 1 + GLYPHS.length,
      instances: tileInstances + CAR_SLOTS.length + glyphInstances,
    };
  }, []);

  const saved = savedPercent(budget.naive, budget.optimized);

  return (
    <SectionShell meta={meta}>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          dataGuide="view-toggle"
          value={view}
          onChange={setView}
          options={[
            { value: 'scene', label: 'What the player sees' },
            { value: 'storage', label: 'What is actually stored' },
          ]}
        />
        <span className="text-[11px] text-faint">
          The scene is byte-for-byte the same picture on both sides. Only the storage
          differs.
        </span>
      </div>

      {view === 'scene' ? (
        <Panel
          dataGuide="scene"
          title="The scene"
          subtitle="Rendered once, accounted for twice"
        >
          <div className="flex justify-center overflow-x-auto">
            <SceneView scale={3} />
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Naive storage" tone="raised">
            <div className="hud-label mb-1.5">
              One flattened {SCENE_W}x{SCENE_H} image, 16bpp
            </div>
            <div className="overflow-x-auto">
              <PixelCanvas
                image={BG}
                palette={TILE_PALETTE}
                scale={2}
                transparentIndex={-1}
                checkerboard={false}
              />
            </div>
            <div className="hud-label mt-3 mb-1.5">
              Plus {CAR_SLOTS.length} separate car textures
            </div>
            <div className="flex gap-2">
              {CAR_PALETTES.map((p, i) => (
                <PixelCanvas key={i} image={CAR} palette={p.colors} scale={3} />
              ))}
            </div>
            <div className="hud-label mt-3 mb-1.5">
              Plus {HUD_LINES.length} pre-rendered strings
            </div>
            <div className="space-y-1">
              {HUD_LINES.map((l) => (
                <PixelCanvas
                  key={l}
                  image={hudImage(l)}
                  palette={FONT_PALETTE}
                  scale={2}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Optimised storage" tone="raised">
            <div className="hud-label mb-1.5">
              {TILEMAP_SET.length} tiles, 4bpp, one shared CLUT
            </div>
            <div className="flex flex-wrap gap-1">
              {TILEMAP_SET.map((id) => (
                <PixelCanvas
                  key={id}
                  image={tileImage(id)}
                  palette={TILE_PALETTE}
                  scale={2.5}
                  transparentIndex={-1}
                />
              ))}
            </div>
            <div className="hud-label mt-3 mb-1.5">
              Tilemap · {budget.tileInstances} one-byte indexes
            </div>
            <pre className="tabnum overflow-x-auto border border-hair bg-void p-2 text-[10px] leading-[1.45] text-faint">
              {Array.from({ length: SCENE_ROWS }, (_, y) =>
                SCENE_MAP.slice(y * SCENE_COLS, (y + 1) * SCENE_COLS).join(' '),
              ).join('\n')}
            </pre>
            <div className="hud-label mt-3 mb-1.5">
              One car texture + {CAR_PALETTES.length} CLUTs
            </div>
            <div className="flex items-center gap-3">
              <PixelCanvas image={CAR} palette={CAR_PALETTES[0].colors} scale={3} />
              <div className="flex flex-wrap gap-1">
                {CAR_PALETTES.map((p) => (
                  <div key={p.id} className="flex">
                    {p.colors.slice(0, 8).map((c, i) => (
                      <span
                        key={i}
                        className="size-3 border border-hair"
                        style={{
                          background: c === 'transparent' ? '#12161e' : c,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="hud-label mt-3 mb-1.5">
              Font atlas + {budget.glyphInstances} character IDs
            </div>
            <PixelCanvas image={glyphAtlas()} palette={FONT_PALETTE} scale={2} />
          </Panel>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Panel title="Naive" tone="raised" className="border-rose/40">
          <div data-guide="stats" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat
              label="Texture memory"
              value={formatBytes(budget.naive)}
              accent="rose"
            />
            <Stat label="Unique assets" value={budget.uniqueAssetsNaive} accent="ink" />
            <Stat
              label="Duplicated data"
              value={formatBytes(budget.duplicated)}
              sub="repeated tiles, stored again"
              accent="rose"
            />
          </div>
          <ul data-guide="checklists" className="mt-3 space-y-1">
            {NAIVE_POINTS.map((p) => (
              <li key={p} className="flex gap-2 text-[11px] text-dim">
                <span className="text-rose">×</span>
                {p}
              </li>
            ))}
          </ul>
          <div className="tabnum mt-3 space-y-0.5 border-t border-hair pt-2 text-[10.5px] text-faint">
            {[
              ['flattened background 16bpp', budget.naiveBg],
              ['4 car textures 16bpp', budget.naiveCars],
              ['2 pre-rendered HUD strings', budget.naiveHud],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between">
                <span>{k}</span>
                <span className="text-dim">{formatBytes(v as number)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="PS1-style optimised" tone="raised" className="border-mint/40">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat
              label="Texture memory"
              value={formatBytes(budget.optimized)}
              accent="mint"
            />
            <Stat
              label="Unique assets"
              value={budget.uniqueAssetsOpt}
              sub="tiles + car + glyphs"
              accent="ink"
            />
            <Stat
              label="Reused instances"
              value={group(budget.instances)}
              sub="draws, not textures"
              accent="lime"
            />
          </div>
          <ul className="mt-3 space-y-1">
            {OPT_POINTS.map((p) => (
              <li key={p} className="flex gap-2 text-[11px] text-dim">
                <span className="text-mint">▸</span>
                {p}
              </li>
            ))}
          </ul>
          <div className="tabnum mt-3 space-y-0.5 border-t border-hair pt-2 text-[10.5px] text-faint">
            {[
              ['tileset 4bpp', budget.tileset],
              ['tilemap indexes', budget.tilemap],
              ['car texture 4bpp', budget.carTex],
              ['4 car CLUTs', budget.carCluts],
              ['font atlas 4bpp', budget.fontAtlas],
              ['HUD strings as IDs', budget.strings],
              ['tileset + font CLUTs', budget.cluts],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between">
                <span>{k}</span>
                <span className="text-dim">{formatBytes(v as number)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="The difference">
        <div className="flex flex-col gap-2">
          {[
            { label: 'Naive', bytes: budget.naive, color: 'bg-rose' },
            { label: 'Optimised', bytes: budget.optimized, color: 'bg-mint' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-[90px] shrink-0 text-[11px] text-dim">{r.label}</span>
              <span className="h-7 flex-1 border border-hair bg-deck">
                <span
                  className={cn('block h-full', r.color)}
                  style={{ width: `${(r.bytes / budget.naive) * 100}%` }}
                />
              </span>
              <span className="tabnum w-[92px] shrink-0 text-right text-[12px] text-ink">
                {formatBytes(r.bytes)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Stat label="Memory saved" value={`${saved.toFixed(1)}%`} accent="lime" />
          <Stat
            label="Size ratio"
            value={`${(budget.naive / budget.optimized).toFixed(1)}x smaller`}
            accent="mint"
          />
          <Stat
            label="Of 1 MB VRAM"
            value={`${((budget.naive / (1024 * 1024)) * 100).toFixed(0)}% → ${((budget.optimized / (1024 * 1024)) * 100).toFixed(1)}%`}
            sub="one screen's worth"
            accent="violet"
          />
        </div>
      </Panel>

      <Callout tone="good">
        Same pixels on screen. The optimised version is not a downgrade - it is the same
        information stored as small reusable pieces plus a list of numbers saying where
        they go. That is the entire idea behind{' '}
        <Term k="indexed-color">indexed colour</Term>, <Term k="atlas">atlases</Term>,{' '}
        <Term k="tilemap">tilemaps</Term> and <Term k="glyph">glyph</Term> fonts.
      </Callout>

      <DeepDive title="Where the honest limits are">
        <p>
          <strong>Reuse shows.</strong> Tiled grass repeats visibly, palette-swapped cars
          share a silhouette, and a fixed-width font cannot do fine typography. These were
          real, accepted trade-offs.
        </p>
        <p>
          <strong>Indexed colour constrains the art.</strong> Sixteen colours per CLUT
          means artists worked to a palette from the first sketch, not as a post-process.
          Photographic sources do not survive the trip.
        </p>
        <p>
          <strong>Some things really do want direct colour.</strong> Skies, lens flares
          and pre-rendered backdrops band badly at 4bpp. Every playground here can be
          pushed too far.
        </p>
        <p>
          <strong>The naive column is a teaching device.</strong> No one shipped a PS1
          game that flattened its levels into unique 16bpp screens - the hardware would
          not hold it. It is the modern default, drawn in PS1 units, so the gap can be
          seen.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
