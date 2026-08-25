import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Chip } from '@/components/atoms/Chip';
import { Field, NumberInput } from '@/components/atoms/Field';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { MemoryBar, type MemorySegment } from '@/components/molecules/MemoryBar';
import { VramMapCanvas } from '@/components/organisms/VramMapCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import { DISPLAY_MODES, HARDWARE_STATS, PS1, SCALE_COMPARISONS } from '@/data/ps1';
import { SECTIONS } from '@/data/sections';
import { cn } from '@/lib/cn';
import { formatBytes, group, VRAM_BYTES } from '@/utils/memory';
import { KIND_COLORS, KIND_LABELS, itemBytes } from '@/utils/vram';
import { useVramMap } from './useVramMap';

const meta = SECTIONS[0];
export function HardwareOverview() {
  const vm = useVramMap();
  // `used` is everything asked for, `placed` is what the packer fitted. The
  // gap between them is fragmentation, not rounding.
  const used = vm.packed.usedBytes;
  const placed = vm.packed.fittedBytes;
  const unplaced = vm.packed.overflowBytes;
  const freeArea = Math.max(0, VRAM_BYTES - placed);
  const pct = (used / VRAM_BYTES) * 100;
  const over = used > VRAM_BYTES;

  const segments: MemorySegment[] = vm.items.map((item) => ({
    id: item.id,
    label: item.label,
    bytes: itemBytes(item),
    color: KIND_COLORS[item.kind],
  }));

  const maxCompare = Math.max(...SCALE_COMPARISONS.map((c) => c.bytes));

  return (
    <SectionShell meta={meta}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {HARDWARE_STATS.map((s) => (
          <Stat
            key={s.label}
            label={s.label}
            value={s.value}
            sub={s.sub}
            accent={s.accent}
          />
        ))}
      </div>

      <Panel
        title="Sense of scale"
        subtitle="One modern phone photo against the console's entire graphics memory"
      >
        <div className="space-y-2">
          {SCALE_COMPARISONS.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-[210px] shrink-0 text-[11px] text-dim sm:w-[280px]">
                {c.label}
              </span>
              <div className="h-3 flex-1 border border-hair bg-deck">
                <div
                  className={cn('h-full', c.bytes === VRAM_BYTES ? 'bg-mint' : 'bg-line')}
                  style={{ width: `${(c.bytes / maxCompare) * 100}%` }}
                />
              </div>
              <span className="tabnum w-[70px] shrink-0 text-right text-[11px] text-faint">
                {formatBytes(c.bytes)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-dim">
          The CPU ran at <span className="text-ink">{PS1.cpuMhz} MHz</span> with no
          floating-point unit, main RAM held <span className="text-ink">2 MB</span> of
          code and game state, and the GPU had exactly{' '}
          <span className="text-mint">1 MB</span> of <Term k="vram">VRAM</Term>. That
          megabyte is not a texture budget. It is the whole graphics world: the picture
          being scanned out to the TV, the picture being drawn into, every texture, and
          every palette.
        </p>
      </Panel>

      <Panel
        title="VRAM map"
        subtitle="1024 x 512 sixteen-bit words. Add resources and watch it fill."
        right={
          <div className="flex gap-1.5">
            <Button data-guide="load-typical" onClick={vm.loadTypical}>
              Load a typical game
            </Button>
            <Button onClick={vm.reset}>Reset</Button>
            <Button variant="ghost" onClick={vm.clear}>
              Clear
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="space-y-3">
            <VramMapCanvas
              dataGuide="vram-map"
              placements={vm.packed.placements}
              selected={vm.selected}
              onSelect={vm.setSelected}
            />
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(KIND_LABELS) as Array<keyof typeof KIND_LABELS>).map((k) => (
                <Chip key={k} color={KIND_COLORS[k]}>
                  {KIND_LABELS[k]}
                </Chip>
              ))}
              <Chip>64-word columns = one 4bpp texture page</Chip>
            </div>

            <MemoryBar
              segments={segments}
              capacity={VRAM_BYTES}
              activeId={vm.selected}
              onSegmentClick={vm.setSelected}
            />

            <div className="grid grid-cols-3 gap-2">
              <Stat
                label="Used VRAM"
                value={formatBytes(used)}
                sub={
                  over
                    ? `${formatBytes(placed)} placed · ${formatBytes(unplaced)} unplaced`
                    : `${group(used)} bytes`
                }
                accent={over ? 'rose' : 'mint'}
              />
              <Stat
                label="Free VRAM"
                value={formatBytes(freeArea)}
                sub={
                  over
                    ? 'unused area, but no gap fits the next rectangle'
                    : `${group(freeArea)} bytes`
                }
                accent={over ? 'amber' : 'ink'}
              />
              <Stat
                label="Percentage used"
                value={`${pct.toFixed(1)}%`}
                sub="of 1 MiB"
                accent={pct > 100 ? 'rose' : pct > 85 ? 'amber' : 'lime'}
              />
            </div>

            {over && (
              <div className="border border-rose/60 bg-rose/10 p-3">
                <div className="text-[13px] tracking-[0.16em] text-rose">
                  VRAM OVERFLOW
                </div>
                <p className="mt-1 text-[11.5px] text-dim">
                  {formatBytes(used)} / 1 MiB. On real hardware there is no swap and no
                  allocation failure to catch: you simply cannot upload it, and whatever
                  you overwrite is somebody else's texture. Try dropping a texture to
                  4bpp, or shrinking it.
                </p>
                {freeArea > 0 && (
                  <p className="mt-2 border-t border-rose/25 pt-2 text-[11.5px] text-dim">
                    Note that {formatBytes(freeArea)} of VRAM is still{' '}
                    <span className="text-amber">unused</span> - it is simply the wrong
                    shape. Allocations are rectangles, so a strip{' '}
                    {Math.floor(freeArea / 2 / 1024)} rows tall cannot hold a 256-row
                    texture however many bytes are left. Real teams fought this with a
                    fixed, hand-tuned VRAM layout.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Panel
              dataGuide="add-texture"
              title="Add a texture"
              tone="raised"
              bodyClassName="space-y-2.5"
            >
              <div className="grid grid-cols-2 gap-2">
                <Field label="Width">
                  <NumberInput
                    value={vm.texW}
                    min={8}
                    max={1024}
                    step={8}
                    onChange={vm.setTexW}
                  />
                </Field>
                <Field label="Height">
                  <NumberInput
                    value={vm.texH}
                    min={8}
                    max={512}
                    step={8}
                    onChange={vm.setTexH}
                  />
                </Field>
              </div>
              <Field label="Colour depth">
                <Segmented
                  dataGuide="tex-depth"
                  value={vm.depth}
                  onChange={vm.setDepth}
                  options={[
                    { value: 4, label: '4bpp' },
                    { value: 8, label: '8bpp' },
                    { value: 16, label: '16bpp' },
                  ]}
                  size="sm"
                />
              </Field>
              <Button variant="primary" className="w-full" onClick={vm.addTexture}>
                + Texture
              </Button>
            </Panel>

            <Panel title="Add other resources" tone="raised" bodyClassName="space-y-2.5">
              <Field label="Display mode (framebuffer pair)">
                <Segmented
                  value={vm.mode}
                  onChange={vm.setMode}
                  size="sm"
                  options={DISPLAY_MODES.map((m) => ({
                    value: m.id,
                    label: m.id,
                    hint: m.note,
                  }))}
                />
              </Field>
              <Button className="w-full" onClick={vm.addFramebuffers}>
                Set framebuffers
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => vm.addClut(4)}>+ CLUT 16</Button>
                <Button onClick={() => vm.addClut(8)}>+ CLUT 256</Button>
              </div>
              <Button
                className="w-full"
                onClick={() => vm.addOther(32 * 1024, 'Scratch / effects buffer')}
              >
                + Other GPU data (32 KiB)
              </Button>
            </Panel>

            <Panel
              title={`Allocations (${vm.items.length})`}
              tone="raised"
              bodyClassName="p-0"
            >
              <ul
                data-guide="allocations"
                className="max-h-[260px] divide-y divide-hair overflow-y-auto"
              >
                {vm.items.length === 0 && (
                  <li className="px-3 py-3 text-[11px] text-faint">
                    Empty VRAM. Even this is not really free: with no framebuffer there is
                    nothing to show.
                  </li>
                )}
                {vm.items.map((item) => {
                  const placement = vm.packed.placements.find((p) => p.id === item.id);
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5',
                        vm.selected === item.id && 'bg-raise',
                        placement && !placement.fits && 'bg-rose/10',
                      )}
                      onMouseEnter={() => vm.setSelected(item.id)}
                    >
                      <span
                        className="size-2 shrink-0"
                        style={{ background: KIND_COLORS[item.kind] }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-ink">
                          {item.label}
                        </span>
                        <span className="tabnum block text-[10px] text-faint">
                          {item.wordsW} x {item.rows} words ·{' '}
                          {formatBytes(itemBytes(item))}
                          {placement && !placement.fits && ' · DOES NOT FIT'}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => vm.remove(item.id)}
                        className="shrink-0 px-1 text-[12px] text-faint hover:text-rose"
                        aria-label={`Remove ${item.label}`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </div>
      </Panel>

      <Callout tone="good">
        Two 320x240 framebuffers cost{' '}
        <span className="text-ink">{formatBytes(320 * 240 * 2 * 2)}</span> before a single
        texture exists. That is nearly a third of VRAM gone on the picture itself.
      </Callout>

      <DeepDive title="What this map simplifies">
        <p>
          <strong>Placement was manual.</strong> There was no allocator. Studios decided
          at build time where every texture and <Term k="clut">CLUT</Term> lived, often
          with a custom packing tool, and shipped those coordinates in the data.
        </p>
        <p>
          <strong>Texture pages constrain the layout.</strong> A draw command names a{' '}
          <Term k="texture-page">texture page</Term> plus 8-bit U/V offsets, so a triangle
          can only reach a 256x256 texel window. In VRAM that window is 64 words wide at
          4bpp, 128 at 8bpp and 256 at 16bpp - the vertical guides on the map are the 4bpp
          page boundaries.
        </p>
        <p>
          <strong>CLUTs are alignment-sensitive.</strong> A CLUT must start on a 16-word
          boundary and lives entirely on one VRAM row, which is why games packed dozens of
          16-colour CLUTs into a single strip.
        </p>
        <p>
          <strong>The display area is configurable.</strong> Framebuffers can sit
          anywhere, can overlap the drawing area on purpose, and 24-bit mode exists for
          FMV playback (display only - the GPU cannot draw into it).
        </p>
        <p>
          <strong>This packer is naive.</strong> It shelf-packs left to right and never
          reuses gaps, so it will report "does not fit" slightly earlier than a hand-tuned
          layout would.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
