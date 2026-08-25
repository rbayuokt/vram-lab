import { useMemo, useState } from 'react';
import { Callout } from '@/components/atoms/Callout';
import { Chip } from '@/components/atoms/Chip';
import { Field, TextInput } from '@/components/atoms/Field';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Term } from '@/components/atoms/Term';
import { BitRow } from '@/components/molecules/BitRow';
import { DeepDive } from '@/components/molecules/DeepDive';
import { FlowDiagram } from '@/components/molecules/FlowDiagram';
import { HexDump } from '@/components/molecules/HexDump';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import { SECTIONS } from '@/data/sections';
import { GEM_PALETTE, HEX_SAMPLE_INDEXES, gemImage } from '@/data/samples';
import { SPRITES, SPRITE_LIST, spriteImage } from '@/data/sprites';
import { cn } from '@/lib/cn';
import {
  CHAR_TABLE,
  encodeString,
  packNibbles,
  toBin,
  toHex,
  type NibbleOrder,
} from '@/utils/encoding';
import { formatBytes, paletteSize, type ColorDepth } from '@/utils/memory';
import { getPixel } from '@/utils/pixel';
import { serializeClut, serializeTexture } from '@/utils/serialize';

const meta = SECTIONS[9];

type Subject = 'gem' | 'car' | 'ship' | 'hero';

export function HexInspector() {
  const [subject, setSubject] = useState<Subject>('gem');
  const [depth, setDepth] = useState<ColorDepth>(4);
  const [order, setOrder] = useState<NibbleOrder>('ps1');
  const [sel, setSel] = useState({ x: 2, y: 3 });
  const [hoverByte, setHoverByte] = useState<number | null>(null);
  const [text, setText] = useState('TAMIYA');

  const image = subject === 'gem' ? gemImage() : spriteImage(subject);
  const palette = subject === 'gem' ? GEM_PALETTE : SPRITES[subject].palettes[0].colors;

  const tex = useMemo(
    () => serializeTexture(image, palette, depth, order),
    [image, palette, depth, order],
  );
  const clutBytesArr = useMemo(
    () => (depth === 16 ? [] : serializeClut(palette, paletteSize(depth))),
    [palette, depth],
  );

  const selOffsets = tex.offsetsFor(sel.x, sel.y);
  const chars = useMemo(() => encodeString(text), [text]);

  // The worked example from the brief: four 4-bit indexes into two bytes.
  const packedExample = packNibbles(HEX_SAMPLE_INDEXES, order);

  return (
    <SectionShell meta={meta}>
      <Panel
        dataGuide="worked"
        title="Four pixels, packed"
        subtitle="binary → packed bytes → hexadecimal"
      >
        <div className="flex flex-wrap items-start gap-6">
          <div>
            <div className="hud-label mb-1.5">Pixel indexes</div>
            <div className="flex gap-1.5">
              {HEX_SAMPLE_INDEXES.map((v, i) => (
                <div key={i} className="text-center">
                  <span
                    className="block size-9 border border-line"
                    style={{ background: GEM_PALETTE[v] }}
                  />
                  <span className="tabnum text-[12px] text-ink">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="hud-label mb-1.5">As 4-bit binary</div>
            <div className="flex gap-3">
              {HEX_SAMPLE_INDEXES.map((v, i) => (
                <BitRow
                  key={i}
                  bits={toBin(v, 4)}
                  group={4}
                  size="sm"
                  groupColors={[
                    i % 2 === 0
                      ? 'border-mint/60 text-mint'
                      : 'border-amber/60 text-amber',
                  ]}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="hud-label mb-1.5">Packed into bytes</div>
            <div className="flex gap-3">
              {packedExample.map((b, i) => (
                <div key={i} className="text-center">
                  <BitRow bits={toBin(b, 8)} group={4} size="sm" />
                  <div className="tabnum mt-1 text-[16px] text-ink">{toHex(b)}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="hud-label mb-1.5">Hex</div>
            <div className="tabnum border border-hair bg-void px-3 py-2 text-[20px] tracking-[0.2em] text-mint">
              {packedExample.map((b) => toHex(b)).join(' ')}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Segmented
            dataGuide="order"
            size="sm"
            value={order}
            onChange={setOrder}
            options={[
              {
                value: 'ps1',
                label: 'PS1 order',
                hint: 'Leftmost pixel in the LOW nibble',
              },
              {
                value: 'display',
                label: 'Whiteboard order',
                hint: 'Leftmost pixel first',
              },
            ]}
          />
          <p className="max-w-[62ch] text-[11px] leading-relaxed text-dim">
            {order === 'ps1' ? (
              <>
                Real 4bpp PS1 data puts the <span className="text-ink">leftmost</span>{' '}
                pixel in the <span className="text-ink">low</span> nibble, so pixels 2 and
                4 become <span className="tabnum text-mint">0x42</span>. This catches
                everyone the first time they open a texture in a hex editor.
              </>
            ) : (
              <>
                Reading left to right the way you would write it on a whiteboard gives{' '}
                <span className="tabnum text-mint">0x24</span>. Intuitive, and wrong for
                actual PS1 files - switch back to PS1 order to see the difference.
              </>
            )}
          </p>
        </div>
      </Panel>

      <Panel
        title="Texture inspector"
        subtitle="Click a pixel to find its bytes, or hover a byte to find its pixels"
        right={
          <div className="flex flex-wrap gap-1.5">
            <Segmented
              size="sm"
              value={subject}
              onChange={setSubject}
              options={[
                { value: 'gem', label: 'Gem 8x8' },
                ...SPRITE_LIST.map((s) => ({
                  value: s.id as Subject,
                  label: s.name,
                })),
              ]}
            />
            <Segmented
              size="sm"
              value={depth}
              onChange={setDepth}
              options={[
                { value: 4, label: '4bpp' },
                { value: 8, label: '8bpp' },
                { value: 16, label: '16bpp' },
              ]}
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div data-guide="texture">
            <PixelCanvas
              image={image}
              palette={palette}
              scale={image.width <= 8 ? 30 : 16}
              gridEvery={1}
              cursor={sel}
              onPixel={(x, y) => setSel({ x, y })}
              ariaLabel="Texture"
            />
            <div className="tabnum mt-2 space-y-0.5 text-[11px] text-dim">
              <div>
                pixel ({sel.x}, {sel.y}) = index{' '}
                <span className="text-amber">{getPixel(image, sel.x, sel.y)}</span>
              </div>
              <div>
                byte offset{' '}
                <span className="text-mint">
                  {selOffsets.map((o) => `0x${toHex(o, 4)}`).join(' + ')}
                </span>
              </div>
              <div className="text-faint">
                row stride {tex.rowBytes} bytes · total {formatBytes(tex.bytes.length)}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>
                {image.width} x {image.height}
              </Chip>
              <Chip>{depth} bpp</Chip>
              <Chip>{tex.bytes.length} bytes</Chip>
            </div>
          </div>

          <div className="space-y-3">
            <div data-guide="dump">
              <div className="hud-label mb-1.5">Pixel data</div>
              <div className="max-h-[300px] overflow-y-auto border border-hair bg-void p-2">
                <HexDump
                  bytes={tex.bytes}
                  perRow={depth === 16 ? 16 : Math.min(16, tex.rowBytes)}
                  highlight={hoverByte !== null ? [hoverByte] : selOffsets}
                  onByteHover={setHoverByte}
                />
              </div>
            </div>
            {clutBytesArr.length > 0 && (
              <div>
                <div className="hud-label mb-1.5">
                  CLUT data · {paletteSize(depth)} little-endian BGR555 words
                </div>
                <div className="max-h-[130px] overflow-y-auto border border-hair bg-void p-2">
                  <HexDump bytes={clutBytesArr} perRow={16} showAscii={false} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        dataGuide="text-inspector"
        title="Text inspector"
        subtitle="Character → table → numeric ID → hex byte"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-3">
            <Field label="String">
              <TextInput value={text} onChange={setText} uppercase maxLength={24} />
            </Field>
            <FlowDiagram
              steps={[
                {
                  id: 'c',
                  label: 'Character',
                  value: chars[0]?.char ?? '-',
                  tone: 'amber',
                },
                {
                  id: 't',
                  label: 'Character table',
                  value: 'A = 0',
                  tone: 'default',
                },
                {
                  id: 'i',
                  label: 'Numeric ID',
                  value: chars[0]?.id ?? '-',
                  tone: 'mint',
                },
                {
                  id: 'h',
                  label: 'Hex byte',
                  value: `0x${chars[0]?.hex ?? '--'}`,
                  tone: 'mint',
                },
              ]}
            />
          </div>
          <div className="space-y-3">
            <div>
              <div className="hud-label mb-1.5">Encoded</div>
              <div className="tabnum border border-hair bg-void p-3 text-[17px] tracking-[0.2em] text-mint">
                {chars.map((c) => c.hex).join(' ') || '--'}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {chars.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    'tabnum border px-1.5 py-1 text-center text-[10px]',
                    c.known
                      ? 'border-hair bg-deck text-dim'
                      : 'border-rose/50 bg-rose/10 text-rose',
                  )}
                >
                  <span className="block text-[13px] text-ink">
                    {c.char === ' ' ? '␣' : c.char}
                  </span>
                  {c.known ? c.id : 'n/a'}
                  <span className="block text-faint">0x{c.hex}</span>
                </span>
              ))}
            </div>
            <div>
              <div className="hud-label mb-1.5">Byte view</div>
              <div className="border border-hair bg-void p-2">
                <HexDump bytes={chars.map((c) => c.id)} perRow={16} showAscii={false} />
              </div>
              <p className="mt-1.5 text-[10.5px] text-faint">
                The ASCII gutter is deliberately off - in this table 0x00 is the letter A,
                not a terminator. That mismatch is exactly what makes an unknown game's
                text look like garbage in a stock hex editor.
              </p>
            </div>
            <div>
              <div className="hud-label mb-1.5">
                Character table ({CHAR_TABLE.length} entries)
              </div>
              <div className="tabnum flex flex-wrap gap-px text-[10px]">
                {CHAR_TABLE.map((ch, i) => (
                  <span
                    key={i}
                    className={cn(
                      'flex w-9 flex-col items-center border border-hair px-0.5 py-0.5',
                      chars.some((c) => c.id === i)
                        ? 'bg-mint/15 text-mint'
                        : 'text-faint',
                    )}
                  >
                    <span className="text-[12px] text-ink">{ch === ' ' ? '␣' : ch}</span>
                    {toHex(i)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Callout tone="note">
        Nothing in a binary announces what it is. A run of bytes is a texture, a string or
        a jump table depending only on what reads it - which is why reverse engineering
        starts by guessing a <Term k="bpp">BPP</Term> and a width and squinting at the
        result.
      </Callout>

      <DeepDive title="Reading real files">
        <p>
          <strong>Endianness bites twice.</strong> The MIPS CPU here is little-endian, so
          a 16-bit colour <code>0x7C1F</code> appears as <code>1F 7C</code> in a file -
          and the 4bpp nibble order is a second, separate reversal on top of that.
        </p>
        <p>
          <strong>TIM is the common container.</strong> Sony's TIM format wraps exactly
          what you see here: a header, an optional CLUT block with its VRAM coordinates,
          then the pixel block with its own coordinates. Many games shipped their own
          variant instead.
        </p>
        <p>
          <strong>Textures are usually not stored as one flat rectangle.</strong> Because
          VRAM is 2D, a "256x256 4bpp texture" is written as 64 words per row, and a tool
          dumping it linearly at the wrong stride produces the classic diagonally-sheared
          image.
        </p>
        <p>
          <strong>Control codes hide in text.</strong> Dialogue streams mix character IDs
          with markers for line breaks, speed, colour, portraits and waits, so a clean
          "one byte per letter" mapping is the exception.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
