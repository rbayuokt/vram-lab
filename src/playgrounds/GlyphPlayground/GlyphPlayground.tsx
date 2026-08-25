import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Chip } from '@/components/atoms/Chip';
import { Field, TextInput } from '@/components/atoms/Field';
import { Panel } from '@/components/atoms/Panel';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { FlowDiagram } from '@/components/molecules/FlowDiagram';
import { CanvasScroller } from '@/components/molecules/CanvasScroller';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import {
  ATLAS_COLS,
  ATLAS_H,
  ATLAS_W,
  FONT_PALETTE,
  GLYPHS,
  GLYPH_H,
  GLYPH_W,
  glyphAtlas,
  glyphImage,
  glyphInkCount,
} from '@/data/font';
import { SECTIONS } from '@/data/sections';
import { cn } from '@/lib/cn';
import { toHex } from '@/utils/encoding';
import { clutBytes, formatBytes, textureBytes } from '@/utils/memory';
import { RENDER_STAGES, useGlyphRenderer } from './useGlyphRenderer';

const meta = SECTIONS[7];
const ATLAS = glyphAtlas();

export function GlyphPlayground() {
  const [text, setText] = useState('TAMIYA');
  const [inspect, setInspect] = useState(19); // T
  const r = useGlyphRenderer(text);

  const g = GLYPHS[inspect];
  const atlasBytes = textureBytes(ATLAS_W, ATLAS_H, 4);
  const activeChar = r.chars[r.charIndex];

  return (
    <SectionShell meta={meta}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title={`Font atlas · ${ATLAS_W} x ${ATLAS_H}, ${GLYPHS.length} glyphs`}
          subtitle="Click a glyph to inspect its cell"
        >
          <CanvasScroller dataGuide="atlas">
            <PixelCanvas
              image={ATLAS}
              palette={FONT_PALETTE}
              scale={7}
              gridEvery={GLYPH_W}
              gridColor="rgba(255,255,255,0.16)"
              highlights={[
                {
                  x: g.col * GLYPH_W,
                  y: g.row * GLYPH_H,
                  w: GLYPH_W,
                  h: GLYPH_H,
                  color: '#ffb454',
                },
                ...r.chars
                  .slice(0, r.drawnCount)
                  .filter((c) => c.known)
                  .map((c) => {
                    const gg = GLYPHS[c.id];
                    return {
                      x: gg.col * GLYPH_W,
                      y: gg.row * GLYPH_H,
                      w: GLYPH_W,
                      h: GLYPH_H,
                      color: '#4de3bd',
                    };
                  }),
              ]}
              onPixel={(x, y) => {
                const id = Math.floor(y / GLYPH_H) * ATLAS_COLS + Math.floor(x / GLYPH_W);
                if (GLYPHS[id]) setInspect(id);
              }}
              ariaLabel="Font atlas"
            />
          </CanvasScroller>
          <div className="mt-3 flex flex-wrap gap-1">
            {GLYPHS.map((gl) => (
              <button
                key={gl.id}
                type="button"
                onClick={() => setInspect(gl.id)}
                title={`id ${gl.id} · 0x${toHex(gl.id)} · u=${gl.col * GLYPH_W} v=${gl.row * GLYPH_H}`}
                className={cn(
                  'tabnum flex size-7 items-center justify-center border text-[11px]',
                  inspect === gl.id
                    ? 'border-amber bg-amber/15 text-amber'
                    : 'border-hair bg-deck text-dim hover:border-line',
                )}
              >
                {gl.char === ' ' ? '␣' : gl.char}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-dim">
            A <Term k="glyph">glyph</Term> is the drawn shape of one character. A font is
            just a bag of glyphs packed into a texture - so a font is an{' '}
            <Term k="atlas">atlas</Term>, and rendering text is sprite drawing with a
            cursor.
          </p>
        </Panel>

        <Panel title={`Glyph ${g.id} · "${g.char === ' ' ? 'space' : g.char}"`}>
          <div className="flex items-start gap-4">
            <PixelCanvas
              image={glyphImage(g.id)}
              palette={FONT_PALETTE}
              scale={18}
              gridEvery={1}
            />
            <pre className="text-[11px] leading-[1.35] text-faint">
              {g.bitmap.join('\n')}
            </pre>
          </div>
          <dl className="tabnum mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            {[
              ['character', g.char === ' ' ? 'space' : g.char],
              ['glyph id', String(g.id)],
              ['hex byte', `0x${toHex(g.id)}`],
              ['atlas cell', `col ${g.col}, row ${g.row}`],
              ['U, V', `${g.col * GLYPH_W}, ${g.row * GLYPH_H}`],
              ['cell size', `${GLYPH_W} x ${GLYPH_H}`],
              ['ink pixels', `${glyphInkCount(g.id)} of 64`],
              ['4bpp cost', `${(GLYPH_W * GLYPH_H) / 2} bytes`],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-2 border-b border-hair py-0.5"
              >
                <dt className="text-faint">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel
        title="Type something"
        subtitle="Characters become IDs, IDs become atlas coordinates, coordinates become pixels"
        right={
          <div className="flex gap-1.5">
            <Button onClick={() => r.setPlaying(!r.playing)}>
              {r.playing ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={r.step}>Step</Button>
            <Button onClick={r.restart}>Restart</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-3">
            <Field label="Text" hint="A-Z, 0-9 and a few symbols exist in this table">
              <span data-guide="text" className="block">
                <TextInput value={text} onChange={setText} maxLength={16} uppercase />
              </span>
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {['TAMIYA', 'START GAME', 'GARAGE', 'LAP 2/3'].map((t) => (
                <Button key={t} onClick={() => setText(t)}>
                  {t}
                </Button>
              ))}
            </div>
            <div className="border border-hair bg-void p-2.5">
              <div className="hud-label mb-1.5">Character to glyph</div>
              <ul className="tabnum space-y-0.5 text-[11.5px]">
                {r.chars.map((c, i) => (
                  <li
                    key={i}
                    className={cn(
                      'flex items-center gap-2',
                      i === r.charIndex ? 'text-mint' : 'text-dim',
                      i > r.charIndex && 'opacity-45',
                    )}
                  >
                    <span className="w-4">{c.char === ' ' ? '␣' : c.char}</span>
                    <span className="text-faint">→</span>
                    <span>glyph {c.known ? c.id : '??'}</span>
                    <span className="ml-auto text-faint">0x{c.hex}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="hud-label mb-1.5">Example encoding</div>
              <div className="tabnum border border-hair bg-void p-3 text-[16px] tracking-[0.22em] text-mint">
                {r.chars.map((c) => c.hex).join(' ')}
              </div>
              <p className="mt-1.5 text-[10.5px] text-faint">
                Example only. This table happens to be A=0; real games shipped whatever
                their tools produced, and many are not ASCII.
              </p>
            </div>

            <div data-guide="renderer">
              <div className="hud-label mb-1.5">Renderer</div>
              <FlowDiagram
                orientation="horizontal"
                activeIndex={r.stage}
                steps={RENDER_STAGES.map((s, i) => ({
                  id: s,
                  label: s,
                  tone: i === r.stage ? 'mint' : 'default',
                  value:
                    i === 0 && activeChar
                      ? `0x${activeChar.hex}`
                      : i === 2 && activeChar?.known
                        ? `u${GLYPHS[activeChar.id].col * GLYPH_W} v${GLYPHS[activeChar.id].row * GLYPH_H}`
                        : i === 4
                          ? `x += ${GLYPH_W}`
                          : undefined,
                }))}
              />
            </div>

            <div data-guide="output">
              <div className="hud-label mb-1.5">Output</div>
              <CanvasScroller>
                <PixelCanvas
                  image={r.output}
                  palette={FONT_PALETTE}
                  scale={8}
                  gridEvery={GLYPH_W}
                  gridColor="rgba(255,255,255,0.08)"
                />
                <span
                  className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-amber transition-[left] duration-200"
                  style={{ left: r.drawnCount * GLYPH_W * 8 }}
                />
              </CanvasScroller>
              <div className="tabnum mt-1.5 text-[10px] text-faint">
                cursor x = {r.drawnCount * GLYPH_W} px
              </div>
            </div>
          </div>
        </div>

        <div data-guide="stats" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <Stat
            label="Font atlas"
            value={formatBytes(atlasBytes)}
            sub={`${ATLAS_W}x${ATLAS_H} at 4bpp`}
            accent="mint"
          />
          <Stat
            label="Font CLUT"
            value={`${clutBytes(4)} B`}
            sub="16 entries"
            accent="amber"
          />
          <Stat
            label={`"${text || '...'}" as data`}
            value={`${r.chars.length} B`}
            sub="one byte per character"
            accent="lime"
          />
          <Stat
            label="Same text as an image"
            value={formatBytes(textureBytes(r.chars.length * GLYPH_W, GLYPH_H, 16))}
            sub="16bpp, and only usable once"
            accent="rose"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>{GLYPHS.length} glyphs cover every string you can type</Chip>
          <Chip>
            {GLYPH_W} x {GLYPH_H} cell
          </Chip>
          <Chip>32 bytes per glyph at 4bpp</Chip>
        </div>
      </Panel>

      <Callout tone="good">
        Text on this hardware is the same trick as an indexed texture: store small
        reusable pieces once, then store cheap numbers that point at them.
      </Callout>

      <DeepDive title="Real font pipelines were messier">
        <p>
          <strong>Fonts were often 1bpp, expanded at load.</strong> Storing a glyph as one
          bit per pixel and expanding into a 4bpp texture in VRAM was common: eight times
          smaller on the disc.
        </p>
        <p>
          <strong>Proportional fonts need a width table.</strong> A fixed 8px advance is
          easy but ugly. Games shipped a per-glyph width byte so "I" did not reserve as
          much room as "W".
        </p>
        <p>
          <strong>Japanese changes the maths.</strong> A kana-and-kanji script needs
          thousands of glyphs, far beyond one texture page, so those games streamed glyph
          cells into a small VRAM cache as the dialogue scrolled - a font equivalent of
          texture streaming.
        </p>
        <p>
          <strong>Encodings were arbitrary.</strong> Some tables start at A=0 like this
          one, some are Shift-JIS, plenty are custom orderings with control codes mixed in
          for colour, pauses and portraits. That is precisely why translating an old game
          starts with reverse-engineering its table.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
