import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Callout } from '@/components/atoms/Callout';
import { Panel } from '@/components/atoms/Panel';
import { Segmented } from '@/components/atoms/Segmented';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { DeepDive } from '@/components/molecules/DeepDive';
import { PaletteStrip } from '@/components/molecules/PaletteStrip';
import { PixelCanvas } from '@/components/molecules/PixelCanvas';
import { SectionShell } from '@/components/templates/SectionShell';
import { SECTIONS } from '@/data/sections';
import { SPRITES, SPRITE_LIST, spriteImage } from '@/data/sprites';
import { snapToPs1 } from '@/utils/color';
import { clutBytes, formatBytes, savedPercent, textureBytes } from '@/utils/memory';
import { fromRows, getPixel, TRANSPARENT, type Palette } from '@/utils/pixel';

const meta = SECTIONS[4];

/* The four-colour teaching example from the top of the section. */
const MINI = fromRows(['001100', '012210', '122221', '013310']);
const MINI_A: Palette = [TRANSPARENT, '#8c1f28', '#e23b3b', '#ffffff'];
const MINI_B: Palette = [TRANSPARENT, '#1f3a8c', '#3b6be2', '#ffffff'];

export function PaletteSwapDemo() {
  const [spriteId, setSpriteId] = useState('car');
  const sprite = SPRITES[spriteId];
  const image = spriteImage(spriteId);

  const [palettes, setPalettes] = useState<Record<string, Palette[]>>({});
  const active = palettes[spriteId] ?? sprite.palettes.map((p) => [...p.colors]);
  const [variant, setVariant] = useState(0);
  const [slot, setSlot] = useState(2);

  const editSlot = (hex: string) => {
    setPalettes((prev) => {
      const list = (prev[spriteId] ?? sprite.palettes.map((p) => [...p.colors])).map(
        (p) => [...p],
      );
      list[variant][slot] = snapToPs1(hex);
      return { ...prev, [spriteId]: list };
    });
  };

  const resetPalettes = () =>
    setPalettes((prev) => {
      const next = { ...prev };
      delete next[spriteId];
      return next;
    });

  const count = active.length;
  const pixelBytes = textureBytes(image.width, image.height, 4);
  const clut = clutBytes(4);
  const shared = pixelBytes + clut * count;
  const duplicated = (pixelBytes + clut) * count;
  const direct = textureBytes(image.width, image.height, 16) * count;

  const indexRows = Array.from({ length: image.height }, (_, y) =>
    Array.from({ length: image.width }, (_, x) =>
      getPixel(image, x, y).toString(16).toUpperCase(),
    ).join(' '),
  ).join('\n');

  return (
    <SectionShell meta={meta}>
      <Panel
        dataGuide="mini"
        title="The idea, at six pixels wide"
        subtitle="Same four rows of index data, two CLUTs"
      >
        <div className="flex flex-wrap items-start gap-6">
          <div>
            <div className="hud-label mb-1.5">Index data (shared)</div>
            <pre className="tabnum border border-hair bg-void p-2.5 text-[12px] leading-[1.6] text-dim">
              {['0 0 1 1 0 0', '0 1 2 2 1 0', '1 2 2 2 2 1', '0 1 3 3 1 0'].join('\n')}
            </pre>
          </div>
          {[
            {
              name: 'Palette A',
              pal: MINI_A,
              roles: ['transparent', 'dark red', 'red', 'white'],
            },
            {
              name: 'Palette B',
              pal: MINI_B,
              roles: ['transparent', 'dark blue', 'blue', 'white'],
            },
          ].map((v) => (
            <div key={v.name}>
              <div className="hud-label mb-1.5">{v.name}</div>
              <div className="flex items-start gap-3">
                <PixelCanvas image={MINI} palette={v.pal} scale={26} gridEvery={1} />
                <ul className="tabnum space-y-0.5 text-[10px] text-faint">
                  {v.roles.map((r, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span
                        className="inline-block size-2.5 border border-hair"
                        style={{
                          background: v.pal[i] === TRANSPARENT ? '#12161e' : v.pal[i],
                        }}
                      />
                      {i} = {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Full sprite, one texture, many CLUTs"
        right={
          <div className="flex flex-wrap gap-1.5">
            <Segmented
              size="sm"
              value={spriteId}
              onChange={(id) => {
                setSpriteId(id);
                setVariant(0);
                setSlot(2);
              }}
              options={SPRITE_LIST.map((s) => ({ value: s.id, label: s.name }))}
            />
            <Button onClick={resetPalettes}>Reset colours</Button>
          </div>
        }
      >
        <div data-guide="variants" className="flex flex-wrap gap-3">
          {active.map((pal, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setVariant(i)}
              className={`border p-2 text-left transition-colors ${
                variant === i
                  ? 'border-mint bg-raise'
                  : 'border-hair bg-deck hover:border-line'
              }`}
            >
              <PixelCanvas image={image} palette={pal} scale={7} checkerboard />
              <div className="mt-1.5 text-[11px] text-ink">{sprite.palettes[i].name}</div>
              <div className="tabnum text-[10px] text-faint">
                CLUT {i} · {clut} bytes
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border border-mint/40 bg-mint/5 px-3 py-2">
          <span className="text-[11px] tracking-[0.16em] text-mint uppercase">
            Pixel data: identical
          </span>
          <span className="text-faint">·</span>
          <span className="text-[11px] tracking-[0.16em] text-amber uppercase">
            Palette: different
          </span>
          <span className="ml-auto text-[10.5px] text-faint">
            {formatBytes(pixelBytes)} of pixels, shared by all {count} variants
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="hud-label mb-1.5">
              Editing {sprite.palettes[variant].name}
            </div>
            <PaletteStrip
              dataGuide="variant-palette"
              palette={active[variant]}
              selected={slot}
              onSelect={setSlot}
              columns={8}
              size={36}
              labels={sprite.roles}
            />
            <div className="mt-3 flex items-center gap-3">
              <input
                type="color"
                value={
                  active[variant][slot] === TRANSPARENT
                    ? '#000000'
                    : active[variant][slot]
                }
                onChange={(e) => editSlot(e.target.value)}
                className="size-12 cursor-pointer border border-line bg-deck"
                aria-label="Edit palette entry"
              />
              <div className="text-[11px] text-dim">
                <div className="text-ink">
                  index {slot} · {sprite.roles[slot] ?? 'free slot'}
                </div>
                <div className="tabnum text-faint">{active[variant][slot]}</div>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-dim">
              Change a colour and only the selected variant moves. The texture is
              untouched - you are editing 2 bytes inside a 32-byte{' '}
              <Term k="clut">CLUT</Term>.
            </p>
          </div>

          <div>
            <div className="hud-label mb-1.5">
              The shared index data ({image.width} x {image.height})
            </div>
            <pre
              data-guide="index-data"
              className="tabnum max-h-[240px] overflow-auto border border-hair bg-void p-2.5 text-[10px] leading-[1.45] text-faint"
            >
              {indexRows}
            </pre>
          </div>
        </div>
      </Panel>

      <Panel dataGuide="cost" title="What the variants cost">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Stat
            label={`Shared texture + ${count} CLUTs`}
            value={formatBytes(shared)}
            sub={`${formatBytes(pixelBytes)} pixels + ${count} x ${clut} B`}
            accent="mint"
          />
          <Stat
            label={`${count} separate 4bpp textures`}
            value={formatBytes(duplicated)}
            sub={`${savedPercent(duplicated, shared).toFixed(0)}% wasted`}
            accent="amber"
          />
          <Stat
            label={`${count} separate 16bpp textures`}
            value={formatBytes(direct)}
            sub={`${savedPercent(direct, shared).toFixed(0)}% wasted`}
            accent="rose"
          />
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-dim">
          Every extra colour scheme costs <span className="text-mint">{clut} bytes</span>.
          That is why a fighting game could ship two players in the same outfit, a racer
          could grid twenty liveries, and an RPG could recolour a slime into a mid-boss
          without the artist redrawing anything.
        </p>
      </Panel>

      <Callout tone="warn">
        The catch: every variant shares the same <em>shape</em> and the same light-to-dark
        structure. Palette swapping buys variety, not new silhouettes - which is exactly
        why swapped enemies in old games always move the same way.
      </Callout>

      <DeepDive title="Palette tricks that went further">
        <p>
          <strong>Palette animation.</strong> Rewriting CLUT entries every frame animates
          water, neon and fire without touching the texture. It costs a handful of bytes
          of VRAM upload per frame.
        </p>
        <p>
          <strong>Palette fades.</strong> Fading to black by interpolating 16 CLUT entries
          is far cheaper than re-uploading or re-shading the art, and it is how a lot of
          PS1 screen transitions worked.
        </p>
        <p>
          <strong>Sub-palettes inside one CLUT.</strong> A 256-entry CLUT can be treated
          as sixteen 16-entry palettes for 4bpp draws, letting a whole cast of sprites
          index different slices of one palette strip.
        </p>
        <p>
          <strong>It is not free at draw time.</strong> Changing CLUT means a different
          draw command, so variants are usually batched by palette to keep the GPU happy.
        </p>
      </DeepDive>
    </SectionShell>
  );
}
