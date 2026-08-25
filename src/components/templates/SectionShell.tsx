import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useGuide } from '@/app/providers/guideContext';
import { SECTIONS, sectionIndex, type SectionMeta } from '@/data/sections';
import { sectionSeo } from '@/data/seo';
import { useDocumentMeta } from '@/lib/head';

interface SectionShellProps {
  meta: SectionMeta;
  children: ReactNode;
}

export function SectionShell({ meta, children }: SectionShellProps) {
  useDocumentMeta(sectionSeo(meta));
  const { open, setOpen } = useGuide();
  const i = sectionIndex(meta.path);
  const prev = i > 0 ? SECTIONS[i - 1] : null;
  const next = i < SECTIONS.length - 1 ? SECTIONS[i + 1] : null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 lg:px-8 lg:py-10">
      <header className="mb-6 border-b border-hair pb-5">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-faint uppercase">
          <span className="text-mint">{meta.no}</span>
          <span className="h-px w-6 bg-line" />
          <span>Playground</span>
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="ml-auto border border-mint/50 px-2 py-0.5 text-[10px] tracking-[0.14em] text-mint uppercase transition-colors hover:bg-mint/10"
            >
              Show guide
            </button>
          )}
        </div>
        <h1 className="mt-2 text-[22px] leading-tight font-semibold text-ink lg:text-[26px]">
          {meta.title}
        </h1>
        <p className="mt-2 max-w-[68ch] text-[12.5px] leading-relaxed text-dim">
          {meta.lede}
        </p>
      </header>

      <div className="space-y-5">{children}</div>

      <nav className="mt-10 grid grid-cols-1 gap-2 border-t border-hair pt-5 sm:grid-cols-2">
        {prev ? (
          <Link
            to={prev.path}
            className="group border border-hair bg-panel px-3 py-2.5 transition-colors hover:border-line"
          >
            <span className="hud-label">{'← Previous · ' + prev.no}</span>
            <span className="mt-0.5 block text-[12px] text-dim group-hover:text-ink">
              {prev.nav}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to={next.path}
            className="group border border-hair bg-panel px-3 py-2.5 text-right transition-colors hover:border-line sm:col-start-2"
          >
            <span className="hud-label">{'Next · ' + next.no + ' →'}</span>
            <span className="mt-0.5 block text-[12px] text-dim group-hover:text-ink">
              {next.nav}
            </span>
          </Link>
        )}
      </nav>
    </div>
  );
}
