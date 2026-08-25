import { useMemo, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Field, Slider } from '@/components/atoms/Field';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { CanvasScroller } from '@/components/molecules/CanvasScroller';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import { SECTIONS } from '@/data/sections';
import { TILE_PALETTE, TILE_SIZE, TILEMAP_SET, tileImage } from '@/data/tiles';
import { cn } from '@/lib/cn';
import {
  clutBytes,
  formatBytes,
  group,
  savedPercent,
  textureBytes,
  type ColorDepth,
} from '@/utils/memory';
import { blit, emptyImage, hash2 } from '@/utils/pixel';

const meta = SECTIONS[6];
const COLS = 16;
const ROWS = 10;

/** A small hand-shaped level so the map reads as a place, not noise. */
function defaultMap(): number[] {
  const map: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      let t = 0; // grass
      if (y <= 1) t = hash2(x, y, 9) > 0.78 ? 4 : 0;
      else if (y === 2)
        t = x === 4 || x === 11 ? 5 : 2; // wall with doors
      else if (y === 3)
        t = 6; // floor strip
      else if (y === 4 || y === 5)
        t = 1; // road
      else if (y === 7 && x >= 5 && x <= 10) t = 3;
      else if (y === 8 && x >= 4 && x <= 11) t = 3;
      else if (y === 9) t = hash2(x, y, 4) > 0.82 ? 4 : 0;
      map.push(t);
    }
  }
  return map;
}

export function TilemapDemo() {
  const [map, setMap] = useState<number[]>(defaultMap);
  const [brush, setBrush] = useState(1);
  const [showNumbers, setShowNumbers] = useState(false);
  const [scaleCols, setScaleCols] = useState(COLS);
  const [scaleRows, setScaleRows] = useState(ROWS);
  const [naiveDepth, setNaiveDepth] = useState<ColorDepth>(16);

  const levelImage = useMemo(() => {
    const img = emptyImage(COLS * TILE_SIZE, ROWS * TILE_SIZE, 0);
    map.forEach((t, i) => {
      const id = TILEMAP_SET[t];
      if (!id) return;
      blit(img, tileImage(id), (i % COLS) * TILE_SIZE, Math.floor(i / COLS) * TILE_SIZE);
    });
    return img;
  }, [map]);

  const tilesUsed = new Set(map).size;

  // Budget for an arbitrary level size, so the two curves can be compared.
  const tileCount = scaleCols * scaleRows;
  const levelPxW = scaleCols * TILE_SIZE;
  const levelPxH = scaleRows * TILE_SIZE;
  const approachA = textureBytes(levelPxW, levelPxH, naiveDepth) + clutBytes(naiveDepth);
  const tilesetBytes = TILEMAP_SET.length * textureBytes(TILE_SIZE, TILE_SIZE, 4);
  const approachB = tilesetBytes + clutBytes(4) + tileCount; // 1 byte per tile index

  return (
    <SectionShell meta={meta}>
      <Panel dataGuide="equation" title="Tileset + tilemap = level">
        <p className="mb-4 max-w-[74ch] text-[11.5px] leading-relaxed text-dim">
          A <Term k="tilemap">tilemap</Term> separates the two things a level is made of:
          a handful of reusable images, and a grid of numbers saying where they go.
          Nothing in the grid is a picture - each entry is just a seat number in the
          tileset.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
          <div className="text-center">
            <div className="hud-label mb-1.5">Tileset (7 images)</div>
            <div className="flex flex-wrap justify-center gap-1">
              {TILEMAP_SET.map((id, i) => (
                <div key={id} className="text-center">
                  <PixelCanvas
                    image={tileImage(id)}
                    palette={TILE_PALETTE}
                    scale={3}
                    transparentIndex={-1}
                  />
                  <div className="tabnum text-[9px] text-faint">{i}</div>
                </div>
              ))}
            </div>
          </div>
          <span className="text-[20px] text-faint">+</span>
          <div className="text-center">
            <div className="hud-label mb-1.5">Tilemap (numbers)</div>
            <pre className="tabnum border border-hair bg-void p-2 text-[9px] leading-[1.4] text-dim">
              {Array.from({ length: 5 }, (_, y) =>
                map
                  .slice(y * COLS, y * COLS + 10)
                  .map((t) => t)
                  .join(' '),
              ).join('\n')}
              {'\n...'}
            </pre>
          </div>
          <span className="text-[20px] text-faint">=</span>
          <div className="text-center">
            <div className="hud-label mb-1.5">Level</div>
            <PixelCanvas
              image={levelImage}
              palette={TILE_PALETTE}
              scale={1.5}
              transparentIndex={-1}
            />
          </div>
        </div>
      </Panel>

      <Panel
        title="Paint the level"
        subtitle={`${COLS} x ${ROWS} tiles of ${TILE_SIZE} x ${TILE_SIZE} pixels`}
        right={
          <div className="flex flex-wrap gap-1.5">
            <Button onClick={() => setMap(defaultMap())}>Reset</Button>
            <Button onClick={() => setMap(Array(COLS * ROWS).fill(0))}>Clear</Button>
          </div>
        }
      >
        <div data-guide="tileset" className="mb-3 flex flex-wrap items-center gap-2">
          <span className="hud-label">Tileset</span>
          {TILEMAP_SET.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => setBrush(i)}
              className={cn(
                'flex items-center gap-1.5 border px-1.5 py-1 text-[10px] tracking-[0.08em] uppercase',
                brush === i
                  ? 'border-mint bg-mint/10 text-mint'
                  : 'border-hair bg-deck text-dim hover:border-line',
              )}
            >
              <PixelCanvas
                image={tileImage(id)}
                palette={TILE_PALETTE}
                scale={1}
                transparentIndex={-1}
                checkerboard={false}
                className="border-0"
              />
              <span className="tabnum">{i}</span>
              {id}
            </button>
          ))}
          <label
            data-guide="show-indexes"
            className="ml-auto flex items-center gap-1.5 text-[10px] tracking-[0.1em] text-dim uppercase"
          >
            <input
              type="checkbox"
              checked={showNumbers}
              onChange={(e) => setShowNumbers(e.target.checked)}
              className="accent-mint"
            />
            Show tile indexes
          </label>
        </div>

        <CanvasScroller>
          <PixelCanvas
            image={levelImage}
            palette={TILE_PALETTE}
            scale={3}
            transparentIndex={-1}
            gridEvery={TILE_SIZE}
            gridColor="rgba(255,255,255,0.12)"
            drag
            onPixel={(x, y) => {
              const i = Math.floor(y / TILE_SIZE) * COLS + Math.floor(x / TILE_SIZE);
              setMap((prev) => {
                if (prev[i] === brush) return prev;
                const next = [...prev];
                next[i] = brush;
                return next;
              });
            }}
            ariaLabel="Level editor"
          />
          {showNumbers && (
            <div
              className="pointer-events-none absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${COLS}, ${TILE_SIZE * 3}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${TILE_SIZE * 3}px)`,
              }}
            >
              {map.map((t, i) => (
                <span
                  key={i}
                  className="tabnum flex items-center justify-center text-[15px] font-semibold text-white mix-blend-difference"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </CanvasScroller>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <Stat label="Tiles in the set" value={TILEMAP_SET.length} accent="mint" />
          <Stat label="Distinct tiles used" value={tilesUsed} accent="mint" />
          <Stat label="Tiles placed" value={COLS * ROWS} accent="amber" />
          <Stat
            label="Tilemap size"
            value={`${COLS * ROWS} B`}
            sub="one byte per tile"
            accent="lime"
          />
        </div>
      </Panel>

      <Panel
        title="Approach A vs approach B"
        subtitle="Scale the level up and watch only one of them grow"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div data-guide="scale-sliders" className="space-y-3">
            <Field label={`Level width: ${scaleCols} tiles (${levelPxW} px)`}>
              <Slider min={8} max={128} value={scaleCols} onChange={setScaleCols} />
            </Field>
            <Field label={`Level height: ${scaleRows} tiles (${levelPxH} px)`}>
              <Slider min={8} max={128} value={scaleRows} onChange={setScaleRows} />
            </Field>
            <Field label="Depth for approach A">
              <Segmented
                dataGuide="naive-depth"
                size="sm"
                value={naiveDepth}
                onChange={setNaiveDepth}
                options={[
                  { value: 4, label: '4bpp' },
                  { value: 8, label: '8bpp' },
                  { value: 16, label: '16bpp' },
                ]}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="border border-rose/40 bg-rose/5 p-3">
                <div className="hud-label text-rose">Approach A · one big image</div>
                <div className="tabnum mt-1 text-[20px] text-ink">
                  {formatBytes(approachA)}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
                  {group(levelPxW)} x {group(levelPxH)} pixels stored once, every blade of
                  grass unique. Grows with the <em>area</em> of the level.
                </p>
              </div>
              <div className="border border-mint/40 bg-mint/5 p-3">
                <div className="hud-label text-mint">Approach B · tileset + indexes</div>
                <div className="tabnum mt-1 text-[20px] text-ink">
                  {formatBytes(approachB)}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
                  {formatBytes(tilesetBytes)} of tiles + {clutBytes(4)} B CLUT +{' '}
                  {group(tileCount)} B of indexes. Only the index list grows.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Approach A', bytes: approachA, color: 'bg-rose' },
                { label: 'Approach B', bytes: approachB, color: 'bg-mint' },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="w-[86px] shrink-0 text-[11px] text-dim">
                    {r.label}
                  </span>
                  <span className="h-5 flex-1 border border-hair bg-deck">
                    <span
                      className={cn('block h-full', r.color)}
                      style={{
                        width: `${(r.bytes / Math.max(approachA, approachB)) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="tabnum w-[90px] shrink-0 text-right text-[11px] text-ink">
                    {formatBytes(r.bytes)}
                  </span>
                </div>
              ))}
            </div>

            <Callout tone="good">
              Approach B is{' '}
              <span className="text-ink">
                {(approachA / approachB).toFixed(1)}x smaller
              </span>{' '}
              here - {savedPercent(approachA, approachB).toFixed(1)}% saved. Push the
              level to 128 x 128 tiles and approach A alone is far past the machine's
              entire 1 MB of VRAM, while approach B still fits in a corner of it.
            </Callout>
          </div>
        </div>
      </Panel>

      <DeepDive title="What a real PS1 'tilemap' looked like">
        <p>
          <strong>The PS1 has no tilemap hardware.</strong> Unlike the SNES or Mega Drive,
          there is no background layer that reads a nametable. A PS1 tilemap is the game
          code walking an array and issuing one textured quad per tile.
        </p>
        <p>
          <strong>Which is why 3D levels used the same trick.</strong> Track and building
          geometry sampled a handful of shared textures across hundreds of polygons - the
          same reuse, just in three dimensions.
        </p>
        <p>
          <strong>Tile indexes were rarely one plain byte.</strong> Real formats packed
          flip flags, palette selectors, collision bits and layer ids alongside the tile
          id, often into a 16-bit word.
        </p>
        <p>
          <strong>Levels were streamed.</strong> Nothing forced the whole map into RAM at
          once; games loaded screens or sectors from the CD as the player moved, which is
          what the loading pauses were doing.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
