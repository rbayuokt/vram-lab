import { useMemo, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Chip } from '@/components/atoms/Chip';
import { Panel } from '@/components/atoms/Panel';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { CanvasScroller } from '@/components/molecules/CanvasScroller';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import {
  ATLAS_CELLS,
  ATLAS_H,
  ATLAS_W,
  CELL,
  SCENE_COLS,
  SCENE_PRESET,
  SCENE_ROWS,
  atlasImage,
} from '@/data/atlas';
import { SECTIONS } from '@/data/sections';
import { TILE_PALETTE, tileImage } from '@/data/tiles';
import { cn } from '@/lib/cn';
import {
  clutBytes,
  formatBytes,
  group,
  savedPercent,
  textureBytes,
} from '@/utils/memory';
import { blit, emptyImage } from '@/utils/pixel';

const meta = SECTIONS[5];
const ATLAS = atlasImage();

export function TextureAtlasDemo() {
  const [selectedCell, setSelectedCell] = useState(0);
  const [scene, setScene] = useState<number[]>(SCENE_PRESET);
  const [brush, setBrush] = useState(0);

  const sceneImage = useMemo(() => {
    const img = emptyImage(SCENE_COLS * CELL, SCENE_ROWS * CELL, 0);
    scene.forEach((cellIndex, i) => {
      const cell = ATLAS_CELLS[cellIndex];
      if (!cell) return;
      blit(
        img,
        tileImage(cell.id),
        (i % SCENE_COLS) * CELL,
        Math.floor(i / SCENE_COLS) * CELL,
      );
    });
    return img;
  }, [scene]);

  const cell = ATLAS_CELLS[selectedCell];
  const instances = scene.length;
  const uniqueUsed = new Set(scene).size;

  const usageByCell = useMemo(() => {
    const counts = new Map<number, number>();
    for (const c of scene) counts.set(c, (counts.get(c) ?? 0) + 1);
    return counts;
  }, [scene]);

  const atlasBytes = textureBytes(ATLAS_W, ATLAS_H, 4);
  const clut = clutBytes(4);
  const mapBytes = instances; // one byte per placed instance
  const optimized = atlasBytes + clut + mapBytes;
  const perInstance16 = textureBytes(CELL, CELL, 16);
  const naive = perInstance16 * instances;
  const uniqueOnly = perInstance16 * uniqueUsed;

  return (
    <SectionShell meta={meta}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel
          title={`Sprite sheet · ${ATLAS_W} x ${ATLAS_H}, 4bpp, one CLUT`}
          subtitle="Click a cell to see the region a draw call would sample"
        >
          <CanvasScroller dataGuide="sheet">
            <PixelCanvas
              image={ATLAS}
              palette={TILE_PALETTE}
              scale={9}
              transparentIndex={-1}
              gridEvery={CELL}
              gridColor="rgba(255,255,255,0.22)"
              highlights={[
                {
                  x: cell.u,
                  y: cell.v,
                  w: cell.w,
                  h: cell.h,
                  color: '#ffb454',
                  fill: 'rgba(255,180,84,0.12)',
                },
              ]}
              onPixel={(x, y) => {
                const col = Math.floor(x / CELL);
                const row = Math.floor(y / CELL);
                const idx = ATLAS_CELLS.findIndex(
                  (c) => c.u === col * CELL && c.v === row * CELL,
                );
                if (idx >= 0) {
                  setSelectedCell(idx);
                  setBrush(idx);
                }
              }}
              ariaLabel="Texture atlas"
            />
          </CanvasScroller>
          <div data-guide="regions" className="mt-2 flex flex-wrap gap-1.5">
            {ATLAS_CELLS.map((c) => (
              <button
                key={c.index}
                type="button"
                onClick={() => {
                  setSelectedCell(c.index);
                  setBrush(c.index);
                }}
                className={cn(
                  'border px-2 py-1 text-[10px] tracking-[0.08em]',
                  selectedCell === c.index
                    ? 'border-amber bg-amber/15 text-amber'
                    : 'border-hair bg-deck text-dim hover:border-line',
                )}
              >
                {c.index}. {c.name}
                <span className="ml-1.5 text-faint">
                  x{usageByCell.get(c.index) ?? 0}
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={`Region ${cell.index} · ${cell.name}`} bodyClassName="space-y-3">
          <div className="flex items-center gap-3">
            <PixelCanvas
              image={tileImage(cell.id)}
              palette={TILE_PALETTE}
              scale={6}
              transparentIndex={-1}
            />
            <div className="tabnum text-[11px] text-dim">
              <div>
                U = <span className="text-amber">{cell.u}</span>
              </div>
              <div>
                V = <span className="text-amber">{cell.v}</span>
              </div>
              <div>
                W x H = {cell.w} x {cell.h}
              </div>
            </div>
          </div>
          <div
            data-guide="draw-command"
            className="border border-hair bg-void p-2.5 text-[11px] leading-relaxed text-dim"
          >
            <div className="hud-label mb-1">Conceptual draw command</div>
            <pre className="tabnum text-[11px] text-mint">
              {`drawSprite({
  page: atlasPage,
  u: ${cell.u}, v: ${cell.v},
  w: ${cell.w}, h: ${cell.h},
  clut: sharedClut,
  x: screenX, y: screenY,
})`}
            </pre>
          </div>
          <p className="text-[11.5px] leading-relaxed text-dim">
            The <Term k="uv">UV</Term> pair is an offset inside the sheet. Nothing is
            copied, nothing is duplicated - the draw simply reads a different rectangle of
            the same texture already sitting in VRAM.
          </p>
        </Panel>
      </div>

      <Panel
        title="Scene builder"
        subtitle={`Click a tile to stamp the selected region. ${SCENE_COLS} x ${SCENE_ROWS} cells.`}
        right={
          <div className="flex gap-1.5">
            <Button onClick={() => setScene(SCENE_PRESET)}>Reset scene</Button>
            <Button onClick={() => setScene(Array(SCENE_COLS * SCENE_ROWS).fill(7))}>
              Fill with grass
            </Button>
          </div>
        }
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="hud-label">Brush</span>
          <Chip>{ATLAS_CELLS[brush].name}</Chip>
          <span className="text-[10px] text-faint">
            pick a region above, then paint below
          </span>
        </div>
        <div data-guide="scene" className="overflow-x-auto">
          <PixelCanvas
            image={sceneImage}
            palette={TILE_PALETTE}
            scale={4}
            transparentIndex={-1}
            gridEvery={CELL}
            gridColor="rgba(255,255,255,0.10)"
            drag
            onPixel={(x, y) => {
              const i = Math.floor(y / CELL) * SCENE_COLS + Math.floor(x / CELL);
              setScene((prev) => {
                if (prev[i] === brush) return prev;
                const next = [...prev];
                next[i] = brush;
                return next;
              });
            }}
            ariaLabel="Scene grid"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <Stat
            label="Unique assets"
            value={ATLAS_CELLS.length}
            sub="cells in the sheet"
            accent="mint"
          />
          <Stat
            label="Assets actually used"
            value={uniqueUsed}
            sub="distinct regions in this scene"
            accent="mint"
          />
          <Stat
            label="Rendered instances"
            value={instances}
            sub="draw calls, not textures"
            accent="amber"
          />
          <Stat
            label="Duplicated pixel data"
            value="0 bytes"
            sub="instances reference, never copy"
            accent="lime"
          />
        </div>

        <div data-guide="bars" className="mt-4 space-y-2.5">
          {[
            {
              label: `Store all ${instances} instances as images`,
              bytes: naive,
              color: 'bg-rose',
              note: `${instances} x ${formatBytes(perInstance16)} (16x16 at 16bpp)`,
            },
            {
              label: `Store ${uniqueUsed} unique images, 16bpp`,
              bytes: uniqueOnly,
              color: 'bg-amber',
              note: 'better, but still direct colour',
            },
            {
              label: 'One 4bpp atlas + CLUT + index list',
              bytes: optimized,
              color: 'bg-mint',
              note: `${formatBytes(atlasBytes)} + ${clut} B + ${mapBytes} B of indexes`,
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-[210px] shrink-0 text-[11px] text-dim sm:w-[260px]">
                {row.label}
                <span className="block text-[10px] text-faint">{row.note}</span>
              </span>
              <span className="h-5 flex-1 border border-hair bg-deck">
                <span
                  className={cn('block h-full', row.color)}
                  style={{ width: `${(row.bytes / naive) * 100}%` }}
                />
              </span>
              <span className="tabnum w-[86px] shrink-0 text-right text-[11px] text-ink">
                {formatBytes(row.bytes)}
              </span>
            </div>
          ))}
        </div>

        <Callout tone="good" className="mt-3">
          {group(instances)} things on screen, {group(optimized)} bytes of storage.
          Storing the same scene as {instances} separate images costs {formatBytes(naive)}{' '}
          - about{' '}
          <span className="text-ink">
            {savedPercent(naive, optimized).toFixed(1)}% wasted
          </span>{' '}
          on data the machine already had.
        </Callout>
      </Panel>

      <DeepDive title="Atlases on real PS1 hardware">
        <p>
          <strong>Atlases were about draw state as much as memory.</strong> Each primitive
          carries a texture-page id; keeping sprites in one page means the GPU is not
          re-pointed mid-scene, which mattered for the fill rate.
        </p>
        <p>
          <strong>The page is 256 x 256 texels.</strong> That is the real ceiling on an
          atlas that a single primitive can address. Bigger sheets exist, but the renderer
          has to switch pages between draws.
        </p>
        <p>
          <strong>UVs are 8-bit and wrap.</strong> U and V are byte offsets inside the
          page, so they wrap at 256. Sprites straddling the edge of a page were a classic
          source of garbled art.
        </p>
        <p>
          <strong>Bleeding is real.</strong> With bilinear-free point sampling the PS1 is
          kinder than modern GPUs, but perspective-warped textures still pull neighbouring
          cells, so packers left padding around each region.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
