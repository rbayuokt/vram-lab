import { Link } from 'react-router-dom';
import { Callout } from '@/components/atoms/Callout';
import { Panel } from '@/components/atoms/Panel';
import { Stat } from '@/components/atoms/Stat';
import { Term } from '@/components/atoms/Term';
import { FlowDiagram } from '@/components/molecules/FlowDiagram';
import { HARDWARE_STATS } from '@/data/ps1';
import { SECTIONS } from '@/data/sections';
import { HOME_SEO } from '@/data/seo';
import { useDocumentMeta } from '@/lib/head';

const CLAIMS = [
  'why a 256x256 16-bit texture is 128 KiB and the 4-bit version is 32 KiB plus a palette',
  'what a CLUT actually does at draw time',
  'how two 4-bit pixels fit inside one byte',
  'how palette swapping produces new characters for free',
  'why sprite sheets and tilemaps beat unique art',
  'how glyph-based text rendering works, and why games did not store words as pictures',
];

export function Home() {
  useDocumentMeta(HOME_SEO);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 lg:px-8 lg:py-14">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-faint uppercase">
        <span className="size-1.5 bg-mint" />
        Interactive playground · 1994 hardware
      </div>
      <h1 className="mt-3 max-w-[20ch] text-[30px] leading-[1.1] font-semibold text-ink lg:text-[42px]">
        One megabyte of video memory, and a whole racing game to fit inside it.
      </h1>
      <p className="mt-4 max-w-[70ch] text-[13px] leading-relaxed text-dim">
        The PlayStation shipped with 1 MB of{' '}
        <Term k="vram" guideId="term">
          VRAM
        </Term>{' '}
        and 2 MB of main RAM. Everything drawn on screen - the framebuffer, every texture,
        every palette - had to live in that megabyte at once. This is a hands-on tour of
        the tricks that made it work: <Term k="indexed-color">indexed colour</Term>,{' '}
        <Term k="clut">CLUTs</Term>, <Term k="atlas">atlases</Term>,{' '}
        <Term k="tilemap">tilemaps</Term> and <Term k="glyph">glyph</Term> fonts. Nothing
        here is a slideshow. Every idea has something you can push on.
      </p>
      <p className="mt-3 flex max-w-[70ch] items-start gap-2 border-l-2 border-mint/50 pl-2.5 text-[12px] leading-relaxed text-dim">
        <span className="mt-[3px] size-1.5 shrink-0 bg-mint" />
        <span>
          New here? The <span className="text-mint">guide panel</span> in the corner walks
          you through every page one control at a time and rings the control it is talking
          about. Each section starts at step 1. Minimise it whenever you would rather poke
          at things yourself.
        </span>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-8 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="The idea the whole app is built around">
          <p className="text-[12px] leading-relaxed text-dim">
            A pixel does not have to contain a colour. It can contain a{' '}
            <span className="text-ink">number</span> that points at a colour stored
            somewhere else. That single indirection is what turns 2 bytes per pixel into
            half a byte per pixel, and it is what makes palette swapping, texture reuse
            and tiny fonts possible.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <FlowDiagram
              orientation="horizontal"
              steps={[
                { id: 'p', label: 'Pixel', value: '2', tone: 'amber' },
                { id: 'i', label: 'Index', value: '0010', tone: 'amber' },
                { id: 'c', label: 'CLUT[2]', value: '0x7C00', tone: 'mint' },
                { id: 'col', label: 'Colour', value: 'red', tone: 'mint' },
              ]}
            />
          </div>
          <Callout tone="good" className="mt-4">
            Optimisation here almost never means "make it look worse". It means storing
            the same picture in a smarter shape.
          </Callout>
        </Panel>

        <Panel title="By the end you can explain">
          <ul className="space-y-2">
            {CLAIMS.map((c) => (
              <li key={c} className="flex gap-2 text-[11.5px] leading-relaxed text-dim">
                <span className="mt-[3px] text-mint">▸</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <h2 className="mt-10 mb-3 text-[11px] tracking-[0.18em] text-faint uppercase">
        Twelve playgrounds
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.id}
            to={s.path}
            className="group flex flex-col border border-hair bg-panel p-3 transition-colors hover:border-mint/50 hover:bg-raise"
          >
            <span className="tabnum text-[10px] tracking-[0.16em] text-mint">{s.no}</span>
            <span className="mt-1 text-[13px] leading-snug text-ink">{s.nav}</span>
            <span className="mt-1.5 text-[11px] leading-relaxed text-faint">
              {s.takeaway}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
