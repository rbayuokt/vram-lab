import { useMemo, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Field, NumberInput, Slider } from '@/components/atoms/Field';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { SectionShell } from '@/components/templates/SectionShell';
import { SECTIONS } from '@/data/sections';
import { cn } from '@/lib/cn';
import {
  clutBytes,
  COLOR_DEPTHS,
  depthLabel,
  formatBytes,
  group,
  paletteSize,
  percentOfVram,
  textureBits,
  textureBytes,
  VRAM_BYTES,
  type ColorDepth,
} from '@/utils/memory';

const meta = SECTIONS[2];

const PRESETS = [
  { label: '64x64', w: 64, h: 64 },
  { label: '128x128', w: 128, h: 128 },
  { label: '256x256', w: 256, h: 256 },
  { label: '512x256', w: 512, h: 256 },
];

const DEPTH_COLOR: Record<ColorDepth, string> = {
  16: 'bg-rose',
  8: 'bg-amber',
  4: 'bg-mint',
};

export function TextureCalculator() {
  const [w, setW] = useState(256);
  const [h, setH] = useState(256);
  const [depth, setDepth] = useState<ColorDepth>(4);
  const [withClut, setWithClut] = useState(true);

  const pixels = w * h;
  const bits = textureBits(w, h, depth);
  const pixelBytes = textureBytes(w, h, depth);
  const clut = withClut ? clutBytes(depth) : 0;
  const total = pixelBytes + clut;

  const rows = useMemo(
    () =>
      COLOR_DEPTHS.slice()
        .reverse()
        .map((d) => ({
          depth: d,
          pixelBytes: textureBytes(w, h, d),
          clut: clutBytes(d),
        })),
    [w, h],
  );
  const maxBytes = Math.max(...rows.map((r) => r.pixelBytes));
  const fitsInVram = Math.floor(VRAM_BYTES / Math.max(1, total));

  return (
    <SectionShell meta={meta}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Panel title="Inputs" bodyClassName="space-y-3.5">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Width (px)">
              <NumberInput value={w} min={4} max={1024} step={4} onChange={setW} />
            </Field>
            <Field label="Height (px)">
              <NumberInput value={h} min={4} max={1024} step={4} onChange={setH} />
            </Field>
          </div>
          <div data-guide="size-sliders">
            <Slider min={4} max={512} step={4} value={w} onChange={setW} />
            <Slider
              min={4}
              max={512}
              step={4}
              value={h}
              onChange={setH}
              className="mt-2"
            />
          </div>
          <Field label="Presets">
            <div data-guide="presets" className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant={w === p.w && h === p.h ? 'primary' : 'default'}
                  onClick={() => {
                    setW(p.w);
                    setH(p.h);
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </Field>
          <Field label="Colour depth">
            <Segmented
              dataGuide="depth"
              value={depth}
              onChange={setDepth}
              options={[
                { value: 4, label: '4-bit' },
                { value: 8, label: '8-bit' },
                { value: 16, label: '16-bit' },
              ]}
            />
          </Field>
          <label
            data-guide="clut-toggle"
            className="flex items-center gap-2 text-[11px] text-dim"
          >
            <input
              type="checkbox"
              checked={withClut}
              onChange={(e) => setWithClut(e.target.checked)}
              className="accent-mint"
            />
            Include the CLUT in the total
          </label>
        </Panel>

        <div className="space-y-4">
          <Panel title="The arithmetic" subtitle={`${w} x ${h}, ${depthLabel(depth)}`}>
            <div className="tabnum space-y-1 border border-hair bg-void p-3 text-[12.5px] leading-relaxed">
              <div className="text-faint">
                <span className="text-dim">pixels</span> = {group(w)} x {group(h)}
              </div>
              <div className="text-mint">= {group(pixels)} pixels</div>
              <div className="mt-2 text-faint">
                <span className="text-dim">bits</span> = {group(pixels)} x {depth}
              </div>
              <div className="text-mint">= {group(bits)} bits</div>
              <div className="mt-2 text-faint">
                <span className="text-dim">bytes</span> = {group(bits)} / 8
              </div>
              <div className="text-mint">
                = {group(pixelBytes)} bytes = {formatBytes(pixelBytes)}
              </div>
              {depth !== 16 && (
                <>
                  <div className="mt-2 text-faint">
                    <span className="text-dim">CLUT</span> = {paletteSize(depth)} entries
                    x 2 bytes
                  </div>
                  <div className="text-amber">= {group(clutBytes(depth))} bytes</div>
                </>
              )}
              <div className="mt-2 border-t border-hair pt-2 text-ink">
                total = {formatBytes(total, { long: true })}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <Stat label="Pixels" value={group(pixels)} accent="ink" />
              <Stat label="Pixel data" value={formatBytes(pixelBytes)} accent="mint" />
              <Stat
                label="Palette"
                value={depth === 16 ? 'none' : formatBytes(clutBytes(depth))}
                sub={depth === 16 ? 'colour is inline' : `${paletteSize(depth)} entries`}
                accent="amber"
              />
              <Stat
                label="Of 1 MB VRAM"
                value={`${percentOfVram(total).toFixed(1)}%`}
                sub={`${fitsInVram} would fit`}
                accent={percentOfVram(total) > 50 ? 'rose' : 'lime'}
              />
            </div>
          </Panel>

          <Panel dataGuide="depth-bars" title="Same texture, three depths">
            <div className="space-y-2.5">
              {rows.map((r) => (
                <button
                  key={r.depth}
                  type="button"
                  onClick={() => setDepth(r.depth)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span
                    className={cn(
                      'w-[92px] shrink-0 text-[11px]',
                      r.depth === depth ? 'text-ink' : 'text-dim',
                    )}
                  >
                    {r.depth}-bit
                  </span>
                  <span className="relative h-6 flex-1 border border-hair bg-deck">
                    <span
                      className={cn('absolute inset-y-0 left-0', DEPTH_COLOR[r.depth])}
                      style={{ width: `${(r.pixelBytes / maxBytes) * 100}%` }}
                    />
                    {withClut && r.clut > 0 && (
                      <span
                        className="absolute inset-y-0 bg-amber/60"
                        style={{
                          left: `${(r.pixelBytes / maxBytes) * 100}%`,
                          width: `${(r.clut / maxBytes) * 100}%`,
                          minWidth: 2,
                        }}
                      />
                    )}
                  </span>
                  <span className="tabnum w-[130px] shrink-0 text-right text-[11px] text-dim">
                    {formatBytes(r.pixelBytes)}
                    {withClut && r.clut > 0 && (
                      <span className="text-amber"> + {formatBytes(r.clut)}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-dim">
              At {w}x{h}, the 4-bit version stores{' '}
              <span className="text-mint">
                {(textureBytes(w, h, 16) / textureBytes(w, h, 4)).toFixed(0)}x less
              </span>{' '}
              pixel data than the 16-bit version. The palette is charged separately
              (amber), and it is a fixed cost - it does not grow with the texture.
            </p>
          </Panel>

          <Callout tone="good" title="THE WORKED EXAMPLE">
            256 x 256 = 65,536 pixels. At 16 bits that is 1,048,576 bits = 131,072 bytes ={' '}
            <span className="text-ink">128 KiB</span> - one eighth of all VRAM for one
            texture. At 4 bits it is 262,144 bits = 32,768 bytes ={' '}
            <span className="text-ink">32 KiB</span>, plus 32 bytes of{' '}
            <Term k="clut">CLUT</Term>.
          </Callout>
        </div>
      </div>

      <DeepDive title="Where the simple formula stops being enough">
        <p>
          <strong>Textures are not stored linearly on PS1.</strong> They live inside the
          2D VRAM grid, so a 4bpp texture 256 texels wide occupies 64 words across and 256
          rows down. Width in <em>words</em>, not bytes, is what a real packing tool works
          with.
        </p>
        <p>
          <strong>Sizes are effectively capped by the page.</strong> A single draw samples
          one 256x256 texel <Term k="texture-page">page</Term>. Anything larger has to be
          split across pages and drawn as multiple primitives, so "512x256" in this
          calculator means two pages, not one texture.
        </p>
        <p>
          <strong>Alignment costs bytes the maths does not show.</strong> CLUTs must start
          on a 16-word boundary, and hand packing leaves gaps. Real budgets ran a few
          percent above the arithmetic.
        </p>
        <p>
          <strong>Textures on disc were often compressed.</strong> The CD held packed
          data; VRAM held it raw. These numbers are the VRAM cost, which is the one that
          was actually scarce.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
