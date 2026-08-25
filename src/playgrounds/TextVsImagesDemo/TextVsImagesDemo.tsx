import { useMemo, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Field, TextInput } from '@/components/atoms/Field';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { DeepDive } from '@/components/molecules/DeepDive';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import {
  ATLAS_H,
  ATLAS_W,
  FONT_PALETTE,
  GLYPH_H,
  GLYPH_W,
  glyphImage,
} from '@/data/font';
import { SECTIONS } from '@/data/sections';
import { cn } from '@/lib/cn';
import { encodeString } from '@/utils/encoding';
import {
  clutBytes,
  formatBytes,
  group,
  savedPercent,
  textureBytes,
  type ColorDepth,
} from '@/utils/memory';
import { blit, emptyImage } from '@/utils/pixel';

const meta = SECTIONS[8];

const START = ['START GAME', 'LOAD GAME', 'OPTIONS', 'GARAGE', 'TAMIYA', 'CHAMPIONSHIP'];

const EXTRA = [
  'TIME TRIAL',
  'VS BATTLE',
  'PARTS SHOP',
  'SAVE DATA',
  'CONTROLLER',
  'SOUND TEST',
  'RECORDS',
  'CREDITS',
  'PRESS START',
  'GAME OVER',
  'NEW RECORD',
  'FINAL LAP',
  'ARE YOU SURE?',
  'NOT ENOUGH FUNDS',
  'CHASSIS SELECT',
  'MOTOR UPGRADE',
];

/** Height a pre-rendered phrase would occupy. Generous to the naive approach. */
const LINE_H = GLYPH_H;

export function TextVsImagesDemo() {
  const [strings, setStrings] = useState<string[]>(START);
  const [draft, setDraft] = useState('');
  const [naiveDepth, setNaiveDepth] = useState<ColorDepth>(16);

  const atlasBytes = textureBytes(ATLAS_W, ATLAS_H, 4) + clutBytes(4);

  const stats = useMemo(() => {
    const naivePer = strings.map(
      (s) =>
        textureBytes(s.length * GLYPH_W, LINE_H, naiveDepth) +
        (naiveDepth === 16 ? 0 : clutBytes(naiveDepth)),
    );
    const naive = naivePer.reduce((a, b) => a + b, 0);
    const chars = strings.reduce((n, s) => n + s.length, 0);
    const glyph = atlasBytes + chars;
    const cumulative = strings.map((_, i) => ({
      n: i + 1,
      naive: naivePer.slice(0, i + 1).reduce((a, b) => a + b, 0),
      glyph: atlasBytes + strings.slice(0, i + 1).reduce((n, s) => n + s.length, 0),
    }));
    return { naivePer, naive, chars, glyph, cumulative };
  }, [strings, naiveDepth, atlasBytes]);

  const preview = useMemo(() => {
    const w = Math.max(1, Math.max(...strings.map((s) => s.length), 1) * GLYPH_W);
    const img = emptyImage(w, Math.max(1, strings.length * (GLYPH_H + 2)), 0);
    strings.forEach((s, row) => {
      encodeString(s).forEach((c, i) => {
        if (c.known) blit(img, glyphImage(c.id), i * GLYPH_W, row * (GLYPH_H + 2));
      });
    });
    return img;
  }, [strings]);

  const max = Math.max(stats.naive, stats.glyph, 1);
  const chartMax = Math.max(...stats.cumulative.map((c) => c.naive), 1);

  return (
    <SectionShell meta={meta}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel title="The game's strings" bodyClassName="space-y-3">
          <ul className="max-h-[240px] divide-y divide-hair overflow-y-auto border border-hair">
            {strings.map((s, i) => (
              <li key={`${s}-${i}`} className="flex items-center gap-2 px-2 py-1.5">
                <span className="tabnum w-5 shrink-0 text-[10px] text-faint">{i}</span>
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink">
                  {s}
                </span>
                <span className="tabnum shrink-0 text-[10px] text-faint">
                  {s.length} ch
                </span>
                <button
                  type="button"
                  onClick={() => setStrings((p) => p.filter((_, k) => k !== i))}
                  className="shrink-0 text-[12px] text-faint hover:text-rose"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <Field label="Add a string">
            <div data-guide="add-string" className="flex gap-1.5">
              <TextInput
                value={draft}
                onChange={setDraft}
                uppercase
                maxLength={24}
                placeholder="NEW MENU ITEM"
              />
              <Button
                variant="primary"
                onClick={() => {
                  if (!draft.trim()) return;
                  setStrings((p) => [...p, draft.trim()]);
                  setDraft('');
                }}
              >
                Add
              </Button>
            </div>
          </Field>
          <div className="flex flex-wrap gap-1.5">
            <Button onClick={() => setStrings((p) => [...p, ...EXTRA.slice(0, 4)])}>
              + 4 more
            </Button>
            <Button
              data-guide="bulk-add"
              onClick={() => setStrings((p) => [...p, ...EXTRA])}
            >
              + a whole menu ({EXTRA.length})
            </Button>
            <Button onClick={() => setStrings(START)}>Reset</Button>
          </div>
          <Field label="Naive image depth">
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
        </Panel>

        <div className="space-y-4">
          <div data-guide="totals" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Panel title="Naive · one image per phrase" tone="raised">
              <div className="tabnum text-[24px] text-rose">
                {formatBytes(stats.naive)}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-dim">
                {strings.length} pre-rendered images. Every phrase carries its own pixels,
                and "GAME" inside "START GAME" and "LOAD GAME" is stored twice.
              </p>
              <ul className="mt-2 max-h-[132px] space-y-0.5 overflow-y-auto text-[10.5px]">
                {strings.map((s, i) => (
                  <li key={i} className="tabnum flex justify-between text-faint">
                    <span className="truncate">{s}</span>
                    <span className="text-dim">{formatBytes(stats.naivePer[i])}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Glyphs · one atlas, then numbers" tone="raised">
              <div className="tabnum text-[24px] text-mint">
                {formatBytes(stats.glyph)}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-dim">
                One {ATLAS_W}x{ATLAS_H} atlas ({formatBytes(atlasBytes)} including its
                CLUT), then {group(stats.chars)} bytes of character IDs. Adding a string
                costs its length in bytes and nothing else.
              </p>
              <div className="tabnum mt-2 space-y-0.5 text-[10.5px] text-faint">
                <div className="flex justify-between">
                  <span>font atlas + CLUT</span>
                  <span className="text-dim">{formatBytes(atlasBytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{group(stats.chars)} characters x 1 byte</span>
                  <span className="text-dim">{formatBytes(stats.chars)}</span>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="Side by side">
            <div className="space-y-2">
              {[
                { label: 'Naive images', bytes: stats.naive, color: 'bg-rose' },
                { label: 'Glyph atlas', bytes: stats.glyph, color: 'bg-mint' },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="w-[110px] shrink-0 text-[11px] text-dim">
                    {r.label}
                  </span>
                  <span className="h-6 flex-1 border border-hair bg-deck">
                    <span
                      className={cn('block h-full', r.color)}
                      style={{ width: `${(r.bytes / max) * 100}%` }}
                    />
                  </span>
                  <span className="tabnum w-[86px] shrink-0 text-right text-[11px] text-ink">
                    {formatBytes(r.bytes)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Stat label="Strings" value={strings.length} accent="ink" />
              <Stat label="Characters" value={group(stats.chars)} accent="amber" />
              <Stat
                label="Saved by glyphs"
                value={`${Math.max(0, savedPercent(stats.naive, stats.glyph)).toFixed(1)}%`}
                sub={
                  stats.glyph < stats.naive
                    ? `${formatBytes(stats.naive - stats.glyph)} back`
                    : 'atlas not paid off yet'
                }
                accent={stats.glyph < stats.naive ? 'lime' : 'amber'}
              />
            </div>

            <div data-guide="chart" className="mt-4">
              <div className="hud-label mb-1.5">
                How each approach scales as strings are added
              </div>
              <svg
                viewBox="0 0 400 150"
                preserveAspectRatio="none"
                className="h-[150px] w-full"
                role="img"
                aria-label="Growth chart"
              >
                <rect x="0" y="0" width="400" height="150" fill="#0a0d12" />
                {[0.25, 0.5, 0.75].map((f) => (
                  <line
                    key={f}
                    x1="0"
                    x2="400"
                    y1={150 - f * 140}
                    y2={150 - f * 140}
                    stroke="#1a2130"
                  />
                ))}
                {(['naive', 'glyph'] as const).map((key) => (
                  <polyline
                    key={key}
                    fill="none"
                    strokeWidth="2"
                    stroke={key === 'naive' ? '#ff6b8b' : '#4de3bd'}
                    points={stats.cumulative
                      .map((c, i) => {
                        const x =
                          stats.cumulative.length > 1
                            ? (i / (stats.cumulative.length - 1)) * 396 + 2
                            : 2;
                        const y = 148 - (c[key] / chartMax) * 140;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                ))}
              </svg>
              <div className="mt-1 flex gap-4 text-[10px]">
                <span className="text-rose">— one image per phrase</span>
                <span className="text-mint">— glyph atlas + IDs</span>
                <span className="ml-auto text-faint">x = strings added</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="All of it, rendered from the same 48 glyphs"
        subtitle="No phrase has its own pixels"
      >
        <div className="overflow-x-auto">
          <PixelCanvas image={preview} palette={FONT_PALETTE} scale={3} />
        </div>
      </Panel>

      <Callout tone="warn">
        The naive approach is not always wrong. A logo, a stylised "GAME OVER" or anything
        with a gradient has to be art. The rule of thumb is: if it is
        <em> language</em>, store it as characters; if it is a <em>picture</em>, store it
        as pixels.
      </Callout>

      <DeepDive title="What pushed games toward glyphs">
        <p>
          <strong>Localisation.</strong> Pre-rendered strings mean re-rendering every
          image per language. Character IDs mean shipping a different table.
        </p>
        <p>
          <strong>Dynamic text.</strong> Scores, lap times, player names and item counts
          cannot be pre-rendered at all.
        </p>
        <p>
          <strong>Disc space vs VRAM.</strong> Pre-rendered text is not just big in VRAM;
          it also has to be read off the CD, and CD seeks were the most expensive thing in
          the machine.
        </p>
        <p>
          <strong>The comparison here is conservative.</strong> Real menu text was rarely
          8 pixels tall. At 16 pixels the naive side quadruples while the glyph side
          changes only by the size of the atlas.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
