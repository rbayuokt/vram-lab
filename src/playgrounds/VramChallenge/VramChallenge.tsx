import { useMemo, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { MemoryBar, type MemorySegment } from '@/components/molecules/MemoryBar';
import { SectionShell } from '@/components/templates/SectionShell';
import { SECTIONS } from '@/data/sections';
import { cn } from '@/lib/cn';
import {
  formatBytes,
  framebufferBytes,
  VRAM_BYTES,
  type ColorDepth,
} from '@/utils/memory';
import {
  ASSETS,
  DEFAULT_CONFIG,
  MAX_FIDELITY,
  assetBytes,
  assetFidelity,
  suggestionsFor,
  type AssetConfig,
  type ConfigMap,
} from './challengeModel';

const meta = SECTIONS[10];
const FB_BYTES = framebufferBytes(320, 240, 2);

export function VramChallenge() {
  const [config, setConfig] = useState<ConfigMap>(DEFAULT_CONFIG);

  const patch = (
    id: string,
    next: Partial<AssetConfig> | ((c: AssetConfig) => AssetConfig),
  ) =>
    setConfig((prev) => ({
      ...prev,
      [id]: typeof next === 'function' ? next(prev[id]) : { ...prev[id], ...next },
    }));

  const rows = useMemo(
    () =>
      ASSETS.map((def) => ({
        def,
        cfg: config[def.id],
        bytes: assetBytes(def, config[def.id]),
      })),
    [config],
  );

  const assetTotal = rows.reduce((n, r) => n + r.bytes, 0);
  const used = assetTotal + FB_BYTES;
  const free = VRAM_BYTES - used;
  const over = used > VRAM_BYTES;
  const fidelity = rows.reduce((n, r) => n + assetFidelity(r.def, r.cfg), 0);

  const suggestions = useMemo(
    () =>
      rows
        .map((r) => suggestionsFor(r.def, r.cfg).sort((a, b) => b.saving - a.saving)[0])
        .filter((s) => s !== undefined)
        .sort((a, b) => b.saving - a.saving)
        .slice(0, 6),
    [rows],
  );

  const segments: MemorySegment[] = [
    { id: 'fb', label: 'Framebuffers', bytes: FB_BYTES, color: '#3a4454' },
    ...rows.map((r) => ({
      id: r.def.id,
      label: r.def.name,
      bytes: r.bytes,
      color: r.def.color,
    })),
  ];

  const maxRow = Math.max(...rows.map((r) => r.bytes), FB_BYTES);

  return (
    <SectionShell meta={meta}>
      <div data-guide="budget" className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Stat label="Budget" value="1 MiB" sub="1,048,576 bytes of VRAM" accent="ink" />
        <Stat
          label="Used"
          value={formatBytes(used)}
          sub={`${((used / VRAM_BYTES) * 100).toFixed(1)}%`}
          accent={over ? 'rose' : 'mint'}
        />
        <Stat
          label="Free"
          value={over ? formatBytes(used - VRAM_BYTES) + ' over' : formatBytes(free)}
          sub={over ? 'you cannot ship this' : 'headroom'}
          accent={over ? 'rose' : 'lime'}
        />
        <Stat
          dataGuide="fidelity"
          label="Fidelity score"
          value={`${fidelity.toFixed(1)} / ${MAX_FIDELITY.toFixed(0)}`}
          sub="bigger and deeper scores higher"
          accent="violet"
        />
      </div>

      <Panel
        title="VRAM"
        subtitle="Framebuffers are fixed. Everything else is your call."
        right={
          <div className="flex gap-1.5">
            <Button onClick={() => setConfig(DEFAULT_CONFIG)}>Reset to naive</Button>
            <Button
              onClick={() =>
                setConfig(
                  Object.fromEntries(
                    ASSETS.map((a) => [
                      a.id,
                      {
                        sizeIndex: 1,
                        depth: 4 as ColorDepth,
                        reuse: a.canReuse,
                        sharedClut: true,
                      },
                    ]),
                  ),
                )
              }
            >
              Optimise everything
            </Button>
          </div>
        }
      >
        <MemoryBar segments={segments} capacity={VRAM_BYTES} height={30} />
        <div className="mt-3 space-y-1">
          {segments.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="w-[130px] shrink-0 truncate text-[11px] text-dim">
                {s.label}
              </span>
              <span className="h-3 flex-1 border border-hair bg-deck">
                <span
                  className="block h-full"
                  style={{
                    width: `${(s.bytes / maxRow) * 100}%`,
                    background: s.color,
                  }}
                />
              </span>
              <span className="tabnum w-[76px] shrink-0 text-right text-[10.5px] text-faint">
                {formatBytes(s.bytes)}
              </span>
            </div>
          ))}
        </div>

        {over ? (
          <div data-guide="status" className="mt-4 border border-rose/60 bg-rose/10 p-3">
            <div className="text-[15px] tracking-[0.16em] text-rose">VRAM OVERFLOW</div>
            <div className="tabnum mt-1 text-[12px] text-dim">
              {formatBytes(used)} / 1 MiB — {formatBytes(used - VRAM_BYTES)} too much.
            </div>
          </div>
        ) : (
          <div data-guide="status" className="mt-4 border border-mint/50 bg-mint/10 p-3">
            <div className="text-[15px] tracking-[0.16em] text-mint">FITS IN VRAM</div>
            <div className="tabnum mt-1 text-[12px] text-dim">
              {formatBytes(free)} spare. Now try spending it: raise a depth or a size
              somewhere and see what still fits.
            </div>
          </div>
        )}
      </Panel>

      {suggestions.length > 0 && (
        <Panel
          dataGuide="suggestions"
          title="Suggested optimisations"
          subtitle="Ranked by bytes returned. Click to apply."
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s, i) => {
              const def = ASSETS.find((a) => a.id === s.assetId)!;
              return (
                <button
                  key={`${s.assetId}-${i}`}
                  type="button"
                  onClick={() => patch(s.assetId, s.apply)}
                  className="border border-hair bg-deck p-2.5 text-left transition-colors hover:border-mint/60 hover:bg-raise"
                >
                  <span className="hud-label" style={{ color: def.color }}>
                    {def.name}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-ink">
                    {s.label}
                  </span>
                  <span className="tabnum mt-1 block text-[11px] text-mint">
                    saves {formatBytes(s.saving)}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel title="Asset budget" bodyClassName="p-0">
        <div className="divide-y divide-hair">
          {rows.map(({ def, cfg, bytes }) => (
            <div
              key={def.id}
              data-guide={`asset-${def.id}`}
              className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[200px_minmax(0,1fr)_120px]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5" style={{ background: def.color }} />
                  <span className="text-[12px] text-ink">{def.name}</span>
                </div>
                <p className="mt-1 text-[10.5px] leading-snug text-faint">{def.note}</p>
                <p className="tabnum mt-1 text-[10px] text-faint">
                  {def.variants} variant{def.variants > 1 ? 's' : ''}
                  {cfg.reuse && def.canReuse ? ' · 1 shared texture' : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-2">
                <Segmented
                  size="sm"
                  ariaLabel={`${def.name} size`}
                  value={cfg.sizeIndex}
                  onChange={(sizeIndex) => patch(def.id, { sizeIndex })}
                  options={def.sizes.map((s, i) => ({
                    value: i,
                    label: s.label,
                  }))}
                />
                <Segmented
                  size="sm"
                  ariaLabel={`${def.name} depth`}
                  value={cfg.depth}
                  onChange={(depth) => patch(def.id, { depth })}
                  options={[
                    { value: 4, label: '4bpp' },
                    { value: 8, label: '8bpp' },
                    { value: 16, label: '16bpp' },
                  ]}
                />
                {def.canReuse && (
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-[10px] tracking-[0.08em] uppercase',
                      cfg.reuse
                        ? 'border-mint bg-mint/10 text-mint'
                        : 'border-line text-dim',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={cfg.reuse}
                      onChange={(e) => patch(def.id, { reuse: e.target.checked })}
                      className="accent-mint"
                    />
                    Palette swap
                  </label>
                )}
                {def.variants > 1 && cfg.depth !== 16 && (
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-[10px] tracking-[0.08em] uppercase',
                      cfg.sharedClut
                        ? 'border-amber bg-amber/10 text-amber'
                        : 'border-line text-dim',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={cfg.sharedClut}
                      onChange={(e) => patch(def.id, { sharedClut: e.target.checked })}
                      className="accent-mint"
                    />
                    Share CLUT
                  </label>
                )}
              </div>

              <div className="tabnum text-right">
                <div className="text-[14px] text-ink">{formatBytes(bytes)}</div>
                <div className="text-[10px] text-faint">
                  {((bytes / VRAM_BYTES) * 100).toFixed(1)}% of VRAM
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between bg-deck px-3 py-2.5">
            <span className="text-[11px] tracking-[0.14em] text-faint uppercase">
              Framebuffers (fixed) · 320x240 x2
            </span>
            <span className="tabnum text-[13px] text-dim">{formatBytes(FB_BYTES)}</span>
          </div>
        </div>
      </Panel>

      <Callout tone="warn">
        There is no single right answer. Spend 16bpp where gradients show (the sky), drop
        to 4bpp where colours are flat (UI, font), and use{' '}
        <Term k="palette-swap">palette swaps</Term> where the shape repeats. That
        judgement call <em>is</em> the job.
      </Callout>

      <DeepDive title="What a real budget also had to carry">
        <p>
          <strong>VRAM was not the only ceiling.</strong> 2 MB of main RAM held code,
          level data, animation and audio commands, and 512 KB of sound RAM held samples.
          Winning here can still lose there.
        </p>
        <p>
          <strong>Streaming changes everything.</strong> Games swapped textures per track,
          per cutscene, even per corner. The budget is per <em>moment</em>, not per game -
          which is what those loading screens were paying for.
        </p>
        <p>
          <strong>Fragmentation is real.</strong> Rectangles have to fit as rectangles. A
          layout can be under budget in bytes and still not fit, which is why teams kept a
          fixed VRAM map and made art conform to it.
        </p>
        <p>
          <strong>The drawing area is also VRAM.</strong> Some effects need scratch space
          for render-to-texture, so the practical budget is smaller than the arithmetic
          suggests.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
