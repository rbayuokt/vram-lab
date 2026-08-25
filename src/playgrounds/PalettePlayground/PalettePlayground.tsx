import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Chip } from '@/components/atoms/Chip';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { FlowDiagram } from '@/components/molecules/FlowDiagram';
import { PaletteStrip } from '@/components/molecules/PaletteStrip';
import { CanvasScroller } from '@/components/molecules/CanvasScroller';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import { SECTIONS } from '@/data/sections';
import { cn } from '@/lib/cn';
import { toBgr555 } from '@/utils/color';
import { toBin, toHex } from '@/utils/encoding';
import { clutBytes, formatBytes, textureBytes } from '@/utils/memory';
import { getPixel } from '@/utils/pixel';
import { SLOT_ROLES, usePalettePlayground } from './usePalettePlayground';

const meta = SECTIONS[3];

export function PalettePlayground() {
  const pp = usePalettePlayground();
  const probe = pp.hover ?? { x: 6, y: 9 };
  const probeIndex = getPixel(pp.image, probe.x, probe.y);
  const probeColor = pp.palette[probeIndex];
  const isTransparent = probeColor === 'transparent';
  const word = isTransparent ? 0 : toBgr555(probeColor);

  const pixelBytes = textureBytes(pp.image.width, pp.image.height, 4);
  const paletteBytes = clutBytes(4);

  return (
    <SectionShell meta={meta}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="space-y-3">
          <Panel
            title="Canvas · 16 x 16, 4bpp"
            subtitle="You are painting indexes, not colours"
            right={
              <div className="flex gap-1.5">
                <Button onClick={pp.clear}>Clear</Button>
                <Button onClick={pp.reset}>Reset</Button>
              </div>
            }
          >
            <CanvasScroller>
              <PixelCanvas
                image={pp.image}
                palette={pp.palette}
                scale={24}
                gridEvery={1}
                drag
                cursor={pp.hover}
                onPixel={pp.paint}
                onHover={pp.setHover}
                ariaLabel="Pixel canvas"
              />
              {pp.showIndexes && (
                <div
                  className="pointer-events-none absolute inset-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${pp.image.width}, 24px)`,
                    gridTemplateRows: `repeat(${pp.image.height}, 24px)`,
                  }}
                >
                  {Array.from(pp.image.data).map((v, i) => (
                    <span
                      key={i}
                      className="tabnum flex items-center justify-center text-[10px] text-white mix-blend-difference"
                    >
                      {v.toString(16).toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </CanvasScroller>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Segmented
                size="sm"
                value={pp.tool}
                onChange={pp.setTool}
                options={[
                  { value: 'paint', label: 'Paint' },
                  { value: 'fill', label: 'Fill' },
                  { value: 'pick', label: 'Pick' },
                ]}
              />
              <label
                data-guide="show-indexes"
                className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] text-dim uppercase"
              >
                <input
                  type="checkbox"
                  checked={pp.showIndexes}
                  onChange={(e) => pp.setShowIndexes(e.target.checked)}
                  className="accent-mint"
                />
                Show indexes
              </label>
            </div>
          </Panel>

          <Panel title="Raw index values" subtitle="What the texture actually contains">
            <pre className="tabnum overflow-x-auto border border-hair bg-void p-2.5 text-[11px] leading-[1.5] text-dim">
              {Array.from({ length: pp.image.height }, (_, y) =>
                Array.from({ length: pp.image.width }, (_, x) =>
                  getPixel(pp.image, x, y).toString(16).toUpperCase(),
                ).join(' '),
              ).join('\n')}
            </pre>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel
            title="CLUT · 16 entries"
            subtitle="Click a slot to select it, then paint. Change its colour and every pixel using it updates."
          >
            <PaletteStrip
              dataGuide="clut-strip"
              palette={pp.palette}
              selected={pp.selected}
              onSelect={pp.setSelected}
              usedIndexes={pp.used}
              columns={8}
              size={42}
              labels={SLOT_ROLES}
            />
            <div className="mt-1.5 text-[10px] text-faint">
              Dimmed slots are not used by any pixel on the canvas right now - but they
              still cost their 2 bytes.
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex items-center gap-3">
                <input
                  data-guide="colour-picker"
                  type="color"
                  value={
                    pp.palette[pp.selected] === 'transparent'
                      ? '#000000'
                      : pp.palette[pp.selected]
                  }
                  onChange={(e) => pp.setSlotColor(pp.selected, e.target.value)}
                  className="size-14 cursor-pointer border border-line bg-deck"
                  aria-label={`Colour for index ${pp.selected}`}
                />
                <div>
                  <div className="hud-label">Index {pp.selected}</div>
                  <div className="tabnum text-[13px] text-ink">
                    {pp.palette[pp.selected]}
                  </div>
                  <div className="text-[10px] text-faint">{SLOT_ROLES[pp.selected]}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="tabnum text-[11px] text-dim">
                  stored as BGR555:{' '}
                  <span className="text-mint">
                    0x
                    {toHex(
                      pp.palette[pp.selected] === 'transparent'
                        ? 0
                        : toBgr555(pp.palette[pp.selected]),
                      4,
                    )}
                  </span>
                </div>
                <div className="tabnum text-[11px] text-faint">
                  {toBin(
                    pp.palette[pp.selected] === 'transparent'
                      ? 0
                      : toBgr555(pp.palette[pp.selected]),
                    16,
                  )}
                </div>
                <Button
                  data-guide="make-transparent"
                  onClick={() => pp.setSlotTransparent(pp.selected)}
                >
                  Make this slot transparent (0x0000)
                </Button>
              </div>
            </div>
          </Panel>

          <Panel
            dataGuide="lookup"
            title={`Lookup for pixel (${probe.x}, ${probe.y})`}
            subtitle="Hover the canvas to move the probe"
          >
            <FlowDiagram
              orientation="horizontal"
              steps={[
                {
                  id: 'p',
                  label: 'Pixel value',
                  value: probeIndex,
                  tone: 'amber',
                },
                {
                  id: 'b',
                  label: 'Stored bits',
                  value: toBin(probeIndex, 4),
                  tone: 'amber',
                },
                {
                  id: 'l',
                  label: 'CLUT lookup',
                  value: `CLUT[${probeIndex}]`,
                  tone: 'mint',
                },
                {
                  id: 'c',
                  label: 'Colour',
                  value: isTransparent ? 'transparent' : `0x${toHex(word, 4)}`,
                  tone: 'mint',
                },
              ]}
            />
            <div className="mt-3 flex items-center gap-3">
              <span
                className={cn('size-10 border border-line')}
                style={{
                  background: isTransparent
                    ? 'repeating-conic-gradient(#1b2029 0% 25%, #0e1219 0% 50%) 50% / 10px 10px'
                    : probeColor,
                }}
              />
              <p className="text-[11.5px] leading-relaxed text-dim">
                The pixel does not store{' '}
                <span className="text-faint line-through">
                  {isTransparent ? 'NOTHING' : 'this colour'}
                </span>
                . It stores <span className="text-amber">{probeIndex}</span>. The colour
                lives once in the <Term k="clut">CLUT</Term>, shared by every pixel that
                names the same index.
              </p>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat
              label="Pixel data"
              value={formatBytes(pixelBytes)}
              sub="16 x 16 at 4bpp"
              accent="mint"
            />
            <Stat
              label="CLUT"
              value={formatBytes(paletteBytes)}
              sub="16 entries x 2 bytes"
              accent="amber"
            />
            <Stat
              label="Total"
              value={formatBytes(pixelBytes + paletteBytes)}
              sub={`vs ${formatBytes(textureBytes(16, 16, 16))} at 16bpp`}
              accent="ink"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Chip>{pp.used.length} of 16 slots in use</Chip>
            <Chip>128 bytes of pixels</Chip>
            <Chip>32 bytes of palette</Chip>
          </div>
        </div>
      </div>

      <Callout tone="good">
        Change one CLUT entry and every pixel using that index changes at once, for the
        cost of two bytes. That is the whole basis of the next playground.
      </Callout>

      <DeepDive title="CLUTs as the hardware sees them">
        <p>
          <strong>A CLUT is just pixels.</strong> It is stored in VRAM like any texture -
          a 16x1 or 256x1 strip of 16-bit words. You can point the GPU at a rectangle of
          an existing texture and use it as a palette, and some games did exactly that to
          animate colours.
        </p>
        <p>
          <strong>Draw commands carry the CLUT address.</strong> The palette is not a
          property of the texture; it is a field in the primitive being drawn. The same
          texture drawn twice in one frame with two different CLUT addresses is completely
          normal.
        </p>
        <p>
          <strong>Transparency is a value, not a channel.</strong> A CLUT entry of{' '}
          <code>0x0000</code> means "do not draw this pixel". Black therefore has to be
          stored as something like <code>0x0421</code> - almost-black - if you want it
          opaque.
        </p>
        <p>
          <strong>The colour picker here snaps to 5 bits per channel.</strong> Pick
          anything you like; it is rounded to what BGR555 can express, which is why fine
          gradients collapse.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
