import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGuide } from '@/app/providers/guideContext';
import { SECTIONS, sectionByPath } from '@/data/sections';
import { HOME_TUTORIAL, LEGEND, TUTORIALS, type Tutorial } from '@/data/tutorials';
import { cn } from '@/lib/cn';
import { GuideSpotlight } from './GuideSpotlight';

const HOME_ID = 'home';

const LEGEND_DOT: Record<string, string> = {
  mint: 'bg-mint',
  rose: 'bg-rose',
  amber: 'bg-amber',
  azure: 'bg-azure',
  violet: 'bg-violet',
};

interface Context {
  id: string;
  no: string;
  title: string;
  tutorial: Tutorial;
}

function contextFor(pathname: string): Context | null {
  if (pathname === '/') {
    return { id: HOME_ID, no: '00', title: 'Start here', tutorial: HOME_TUTORIAL };
  }
  const section = sectionByPath(pathname);
  const tutorial = section && TUTORIALS[section.id];
  if (!section || !tutorial) return null;
  return { id: section.id, no: section.no, title: section.nav, tutorial };
}

/**
 * A docked walkthrough that follows you from section to section.
 *
 * It reads the route and serves that section's steps one at a time, starting
 * over at step 1 on each arrival.
 */
export function GuideDock() {
  const { pathname } = useLocation();
  const { open, setOpen, firstVisit } = useGuide();
  const [tab, setTab] = useState<'steps' | 'try'>('steps');
  const [stepIndex, setStepIndex] = useState(0);
  const [shownFor, setShownFor] = useState<string | null>(null);

  const ctx = contextFor(pathname);

  // Arriving at a section always starts its walkthrough at step 1. Adjusted
  // during render rather than in an effect so there is no flash of the
  // previous section's step.
  if (ctx && ctx.id !== shownFor) {
    setShownFor(ctx.id);
    setStepIndex(0);
    setTab('steps');
  }

  if (!ctx) return null;

  const { tutorial } = ctx;
  const total = tutorial.steps.length;
  const index = Math.min(stepIndex, total - 1);
  const goTo = (next: number) => setStepIndex(Math.max(0, Math.min(next, total - 1)));
  const step = tutorial.steps[index];
  const done = index >= total - 1;
  const sectionIdx = SECTIONS.findIndex((s) => s.id === ctx.id);
  const selector =
    tab === 'steps' && step.target ? `[data-guide="${step.target}"]` : null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2 border border-mint/60 bg-panel px-3 py-2 text-[10px] tracking-[0.16em] text-mint uppercase shadow-[0_8px_28px_rgba(0,0,0,0.6)] transition-colors hover:bg-raise"
      >
        <span className="size-1.5 animate-pulse bg-mint" />
        Guide
        <span className="tabnum text-faint normal-case">
          {index + 1}/{total}
        </span>
      </button>
    );
  }

  return (
    <>
      <GuideSpotlight selector={selector} />
      <aside
        aria-label="Section guide"
        className="fixed right-3 bottom-3 left-3 z-50 flex max-h-[72vh] flex-col border border-line bg-panel shadow-[0_10px_40px_rgba(0,0,0,0.7)] sm:left-auto sm:w-[360px]"
      >
        <header className="flex items-center gap-2 border-b border-hair bg-deck px-3 py-2">
          <span className="size-1.5 bg-mint" />
          <span className="text-[10px] tracking-[0.18em] text-mint uppercase">Guide</span>
          <span className="tabnum truncate text-[10px] text-faint">
            {ctx.no} · {ctx.title}
            {sectionIdx >= 0 && (
              <span className="ml-1.5 text-line">
                (section {sectionIdx + 1} of {SECTIONS.length})
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Minimise guide"
            className="ml-auto px-1.5 text-[14px] leading-none text-faint hover:text-ink"
          >
            −
          </button>
        </header>

        {firstVisit && (
          <p className="border-b border-hair bg-mint/5 px-3 py-1.5 text-[10px] leading-relaxed text-mint">
            This panel walks you through each page. Minimise it any time with −.
          </p>
        )}

        <div className="flex border-b border-hair">
          {(['steps', 'try'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 px-3 py-1.5 text-[10px] tracking-[0.14em] uppercase transition-colors',
                tab === t
                  ? 'bg-raise text-ink shadow-[inset_0_-1px_0_var(--color-mint)]'
                  : 'text-faint hover:text-dim',
              )}
            >
              {t === 'steps'
                ? `Walkthrough (${total})`
                : `Try this (${tutorial.experiments.length})`}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === 'steps' ? (
            <div className="p-3">
              <p className="mb-3 border-l-2 border-mint/50 pl-2 text-[10.5px] leading-relaxed text-faint">
                {tutorial.goal}
              </p>

              <div className="mb-2 flex items-center gap-2">
                <span className="tabnum text-[10px] tracking-[0.14em] text-amber uppercase">
                  Step {index + 1} of {total}
                </span>
                <span className="flex flex-1 gap-1">
                  {tutorial.steps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to step ${i + 1}`}
                      onClick={() => goTo(i)}
                      className={cn(
                        'h-1 flex-1 transition-colors',
                        i === index ? 'bg-mint' : i < index ? 'bg-mint/30' : 'bg-line',
                      )}
                    />
                  ))}
                </span>
              </div>

              <p className="text-[12px] leading-relaxed text-ink">{step.action}</p>
              <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-dim">
                <span className="mt-[1px] shrink-0 text-mint">▸</span>
                <span>{step.notice}</span>
              </p>
              {step.target && (
                <p className="mt-2.5 flex items-center gap-1.5 border-t border-hair pt-2 text-[10px] tracking-[0.1em] text-amber uppercase">
                  <span className="size-1.5 bg-amber" />
                  Ringed on the page
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-2 p-3">
              {tutorial.experiments.map((e) => (
                <li key={e} className="flex gap-2 text-[11px] leading-relaxed text-dim">
                  <span className="mt-[1px] shrink-0 text-amber">→</span>
                  <span>{e}</span>
                </li>
              ))}
              <li className="mt-3 border-t border-hair pt-2.5">
                <span className="hud-label mb-1.5 block">Colour conventions</span>
                <ul className="space-y-1">
                  {LEGEND.map((l) => (
                    <li
                      key={l.token}
                      className="flex items-center gap-2 text-[10.5px] text-faint"
                    >
                      <span className={cn('size-2 shrink-0', LEGEND_DOT[l.token])} />
                      {l.meaning}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          )}
        </div>

        {tab === 'steps' && (
          <footer className="flex items-center gap-1.5 border-t border-hair bg-deck px-3 py-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
              className="border border-line px-2 py-1 text-[10px] tracking-[0.1em] text-dim uppercase transition-colors hover:text-ink disabled:opacity-30"
            >
              Back
            </button>
            {done ? (
              <button
                type="button"
                onClick={() => setTab('try')}
                className="border border-amber/60 bg-amber/10 px-2 py-1 text-[10px] tracking-[0.1em] text-amber uppercase transition-colors hover:bg-amber/20"
              >
                Try this →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="border border-mint bg-mint px-2.5 py-1 text-[10px] tracking-[0.1em] text-void uppercase transition-colors hover:bg-mint/85"
              >
                Next step →
              </button>
            )}
            <button
              type="button"
              onClick={() => goTo(0)}
              className="ml-auto text-[10px] tracking-[0.1em] text-faint uppercase hover:text-dim"
            >
              Restart
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
