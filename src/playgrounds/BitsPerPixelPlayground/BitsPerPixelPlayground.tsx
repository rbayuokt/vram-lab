import { useMemo, useState } from 'react';
import { Callout } from '@/components/atoms/Callout';
import { Chip } from '@/components/atoms/Chip';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { BitRow } from '@/components/molecules/BitRow';
import { DeepDive } from '@/components/molecules/DeepDive';
import { FlowDiagram } from '@/components/molecules/FlowDiagram';
import { PaletteStrip } from '@/components/molecules/PaletteStrip';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import { GEM_PALETTE, GEM_ROLES, gemImage } from '@/data/samples';
import { SECTIONS } from '@/data/sections';
import { cn } from '@/lib/cn';
import { fromBgr555, hexToRgb, toBgr555 } from '@/utils/color';
import { toBin, toHex } from '@/utils/encoding';
import {
  depthLabel,
  formatBytes,
  paletteSize,
  textureBytes,
  type ColorDepth,
} from '@/utils/memory';
import { getPixel } from '@/utils/pixel';

const meta = SECTIONS[1];
const IMG = gemImage();

export function BitsPerPixelPlayground() {
  const [depth, setDepth] = useState<ColorDepth>(4);
  const [sel, setSel] = useState({ x: 2, y: 3 });

  const index = getPixel(IMG, sel.x, sel.y);
  const neighbour = getPixel(IMG, Math.min(IMG.width - 1, sel.x + 1), sel.y);
  const color = GEM_PALETTE[index] === 'transparent' ? '#000000' : GEM_PALETTE[index];
  const word = toBgr555(color);
  const rgb = hexToRgb(color);

  /** How the first row of 8 pixels lands in bytes at the current depth. */
  const rowBytes = useMemo(() => {
    const row = Array.from({ length: IMG.width }, (_, x) => getPixel(IMG, x, sel.y));
    if (depth === 4) {
      return row.reduce<Array<{ pixels: number[]; bits: string }>>((acc, v, i) => {
        if (i % 2 === 0) acc.push({ pixels: [v], bits: toBin(v, 4) });
        else {
          const last = acc[acc.length - 1];
          last.pixels.push(v);
          last.bits += toBin(v, 4);
        }
        return acc;
      }, []);
    }
    if (depth === 8) return row.map((v) => ({ pixels: [v], bits: toBin(v, 8) }));
    return row.flatMap((v) => {
      const c = GEM_PALETTE[v] === 'transparent' ? '#000000' : GEM_PALETTE[v];
      const w = toBgr555(c);
      return [
        { pixels: [v], bits: toBin(w & 0xff, 8) },
        { pixels: [v], bits: toBin((w >> 8) & 0xff, 8) },
      ];
    });
  }, [depth, sel.y]);

  const bytes = textureBytes(IMG.width, IMG.height, depth);

  return (
    <SectionShell meta={meta}>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          dataGuide="depth"
          ariaLabel="Colour depth"
          value={depth}
          onChange={(d) => setDepth(d)}
          options={[
            { value: 16, label: '16-bit direct' },
            { value: 8, label: '8-bit indexed' },
            { value: 4, label: '4-bit indexed' },
          ]}
        />
        <Chip>{depth} bits per pixel</Chip>
        <Chip>{depth === 16 ? '2 bytes per pixel' : `${8 / depth} pixels per byte`}</Chip>
        <Chip>
          {depth === 16
            ? '32,768 colours available'
            : `2^${depth} = ${paletteSize(depth)} palette entries`}
        </Chip>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <Panel
          dataGuide="sample"
          title="8 x 8 sample texture"
          subtitle="Click any pixel to inspect it"
        >
          <PixelCanvas
            image={IMG}
            palette={GEM_PALETTE}
            scale={34}
            gridEvery={1}
            cursor={sel}
            onPixel={(x, y) => setSel({ x, y })}
            ariaLabel="Sample texture, click a pixel"
          />
          <div className="tabnum mt-2 flex items-center justify-between text-[10px] text-faint">
            <span>
              pixel ({sel.x}, {sel.y})
            </span>
            <span>{IMG.width * IMG.height} pixels total</span>
          </div>
        </Panel>

        <Panel
          title={`What is stored in pixel (${sel.x}, ${sel.y})`}
          subtitle={depthLabel(depth)}
        >
          {depth === 16 ? (
            <div className="space-y-4">
              <FlowDiagram
                orientation="horizontal"
                steps={[
                  {
                    id: 'p',
                    label: 'Pixel',
                    value: `(${sel.x}, ${sel.y})`,
                    tone: 'amber',
                  },
                  {
                    id: 'c',
                    label: 'Colour value',
                    value: `0x${toHex(word, 4)}`,
                    tone: 'mint',
                  },
                ]}
              />
              <p className="text-[11.5px] leading-relaxed text-dim">
                No lookup happens. The pixel <em>is</em> the colour: one 16-bit{' '}
                <Term k="bgr555">BGR555</Term> word holding five bits each of blue, green
                and red, plus the <Term k="stp">STP</Term> flag.
              </p>
              <div>
                <div className="hud-label mb-1.5">The 16 bits</div>
                <BitRow
                  bits={toBin(word, 16)}
                  group={1}
                  groupColors={['border-line text-ink']}
                  size="sm"
                  className="mb-2"
                />
                <div className="grid grid-cols-4 gap-2">
                  <Stat label="STP" value={(word >> 15) & 1} accent="violet" />
                  <Stat
                    label="Blue (5b)"
                    value={(word >> 10) & 31}
                    accent="azure"
                    sub={`${rgb.b} of 255`}
                  />
                  <Stat
                    label="Green (5b)"
                    value={(word >> 5) & 31}
                    accent="lime"
                    sub={`${rgb.g} of 255`}
                  />
                  <Stat
                    label="Red (5b)"
                    value={word & 31}
                    accent="rose"
                    sub={`${rgb.r} of 255`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="size-12 border border-line"
                  style={{ background: fromBgr555(word) }}
                />
                <div className="text-[11px] text-dim">
                  <div className="tabnum text-ink">{fromBgr555(word)}</div>
                  <div className="text-faint">
                    snapped to the 15-bit grid the GPU can represent
                  </div>
                </div>
              </div>
              <Callout tone="warn">
                16 bits per pixel = <span className="text-ink">2 bytes</span>, every
                pixel, no exceptions. Beautiful and expensive.
              </Callout>
            </div>
          ) : (
            <div className="space-y-4">
              <FlowDiagram
                orientation="horizontal"
                steps={[
                  {
                    id: 'p',
                    label: 'Pixel',
                    value: `(${sel.x}, ${sel.y})`,
                    tone: 'amber',
                  },
                  {
                    id: 'i',
                    label: `${depth}-bit index`,
                    value: toBin(index, depth),
                    tone: 'amber',
                  },
                  {
                    id: 'c',
                    label: 'CLUT lookup',
                    value: `CLUT[${index}]`,
                    tone: 'mint',
                  },
                  {
                    id: 'col',
                    label: 'Colour',
                    value: `0x${toHex(word, 4)}`,
                    tone: 'mint',
                  },
                ]}
              />
              <p className="text-[11.5px] leading-relaxed text-dim">
                The pixel does not know it is blue. It stores{' '}
                <span className="text-amber">{index}</span> - a seat number in a{' '}
                <Term k="clut">CLUT</Term> of {paletteSize(depth)} entries. Swap the CLUT
                and this pixel changes colour without a single byte of the texture
                changing.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div>
                  <div className="hud-label mb-1.5">Stored bits</div>
                  <BitRow bits={toBin(index, depth)} group={4} />
                  <div className="tabnum mt-1.5 text-[11px] text-faint">
                    decimal {index} · hex 0x{toHex(index, depth === 4 ? 1 : 2)}
                  </div>
                </div>
                <div>
                  <div className="hud-label mb-1.5">
                    CLUT · {paletteSize(depth)} entries
                    {depth === 8 && ' (first 16 shown)'}
                  </div>
                  <PaletteStrip
                    palette={GEM_PALETTE}
                    selected={index}
                    columns={8}
                    size={26}
                    labels={GEM_ROLES}
                  />
                  <div className="mt-1.5 text-[11px] text-dim">
                    CLUT[{index}] = <span className="text-ink">{GEM_PALETTE[index]}</span>{' '}
                    <span className="text-faint">({GEM_ROLES[index]})</span>
                  </div>
                </div>
              </div>
              {depth === 4 && (
                <div
                  data-guide="two-pixels"
                  className="border border-mint/40 bg-mint/5 p-3"
                >
                  <div className="hud-label mb-2 text-mint">Two pixels, one byte</div>
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <div className="text-[10px] text-faint">
                        pixel ({sel.x}, {sel.y})
                      </div>
                      <BitRow
                        bits={toBin(index, 4)}
                        group={4}
                        groupColors={['border-mint/60 text-mint']}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-faint">
                        pixel ({Math.min(IMG.width - 1, sel.x + 1)}, {sel.y})
                      </div>
                      <BitRow
                        bits={toBin(neighbour, 4)}
                        group={4}
                        groupColors={['border-amber/60 text-amber']}
                      />
                    </div>
                    <span className="pb-1.5 text-[16px] text-faint">=</span>
                    <div>
                      <div className="text-[10px] text-faint">one byte</div>
                      <BitRow bits={toBin(index, 4) + toBin(neighbour, 4)} group={4} />
                    </div>
                    <div className="pb-1">
                      <div className="text-[10px] text-faint">hex</div>
                      <div className="tabnum text-[18px] text-ink">
                        {toHex(index)[1]}
                        {toHex(neighbour)[1]}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-faint">
                    Shown left-to-right for readability. Real PS1 4bpp data puts the{' '}
                    <em>leftmost</em> pixel in the low nibble - see the hex inspector.
                  </p>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        dataGuide="row-bytes"
        title={`Row ${sel.y} laid out in memory`}
        subtitle="Same eight pixels, three storage costs"
      >
        <div className="flex flex-wrap gap-1.5">
          {rowBytes.map((b, i) => (
            <div key={i} className="border border-line bg-deck px-2 py-1.5 text-center">
              <div className="hud-label">byte {i}</div>
              <div className="tabnum mt-0.5 text-[12px] text-ink">{b.bits}</div>
              <div className="mt-1 flex justify-center gap-1">
                {b.pixels.map((p, k) => (
                  <span
                    key={k}
                    className="size-4 border border-hair"
                    style={{
                      background:
                        GEM_PALETTE[p] === 'transparent' ? '#12161e' : GEM_PALETTE[p],
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Stat
            label="Bytes for this row"
            value={rowBytes.length}
            sub={`${IMG.width} pixels`}
            accent={depth === 16 ? 'rose' : depth === 8 ? 'amber' : 'mint'}
          />
          <Stat
            label="Bytes for the 8x8 texture"
            value={formatBytes(bytes)}
            sub={`${IMG.width * IMG.height} px x ${depth} bits / 8`}
            accent="ink"
          />
          <Stat
            label="Versus 16-bit"
            value={depth === 16 ? '1x' : `${16 / depth}x smaller`}
            sub={`16bpp would be ${textureBytes(IMG.width, IMG.height, 16)} B`}
            accent="lime"
          />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {([16, 8, 4] as ColorDepth[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDepth(d)}
            className={cn(
              'border p-3 text-left transition-colors',
              d === depth
                ? 'border-mint bg-raise'
                : 'border-hair bg-panel hover:border-line',
            )}
          >
            <div className="text-[12px] text-ink">{depthLabel(d)}</div>
            <div className="tabnum mt-1 text-[11px] text-faint">
              {d === 16
                ? 'colour stored in the pixel'
                : `2^${d} = ${paletteSize(d)} colours per CLUT`}
            </div>
            <div className="mt-2 h-1.5 w-full bg-deck">
              <div
                className={
                  d === 16
                    ? 'h-full bg-rose'
                    : d === 8
                      ? 'h-full bg-amber'
                      : 'h-full bg-mint'
                }
                style={{ width: `${(d / 16) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      <DeepDive title="What 'bits per pixel' hides">
        <p>
          <strong>4bpp and 8bpp are not lossy compression.</strong> They are a different{' '}
          <em>encoding</em>. Nothing is approximated at decode time; the restriction is up
          front, in how many distinct colours the image may use.
        </p>
        <p>
          <strong>The CLUT is not free.</strong> A 16-entry CLUT costs 32 bytes and a
          256-entry CLUT costs 512 bytes, both in the same VRAM. For a 16x16 sprite a
          256-colour CLUT can cost more than the pixels do.
        </p>
        <p>
          <strong>Index 0 is special by convention.</strong> On PS1, a CLUT entry whose
          16-bit value is <code>0x0000</code> renders as fully transparent (unless the
          draw command disables that behaviour), which is why almost every sprite here
          reserves index 0.
        </p>
        <p>
          <strong>The GPU reads whole words.</strong> VRAM is addressed in 16-bit units,
          so a 4bpp texture row is read four pixels at a time. That is also why texture
          widths in these formats want to be multiples of 4.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
