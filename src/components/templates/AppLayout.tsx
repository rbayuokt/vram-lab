import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { GuideDock } from '@/components/organisms/GuideDock';
import { Masthead } from '@/components/organisms/Masthead';
import { SideNav } from '@/components/organisms/SideNav';
import { cn } from '@/lib/cn';

export function AppLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // scroll reset is a browser concern, so it stays in an effect
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // the drawer sits over the page, so the page behind it must not scroll
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="relative z-10 min-h-screen lg:flex">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-deck/95 backdrop-blur lg:hidden">
        <Masthead />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-controls="section-nav"
          className="mr-3 border border-line px-2.5 py-1 text-[10px] tracking-[0.14em] text-dim uppercase transition-colors hover:border-mint/60 hover:text-mint"
        >
          Sections
        </button>
      </header>

      <div
        aria-hidden
        onClick={() => setMenuOpen(false)}
        className={cn(
          'fixed inset-0 z-55 bg-void/75 backdrop-blur-[2px] transition-opacity duration-200 motion-reduce:transition-none lg:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="section-nav"
        aria-label="Sections"
        className={cn(
          'fixed inset-y-0 left-0 z-60 flex w-[272px] max-w-[85vw] shrink-0 flex-col border-r border-line bg-deck transition-[transform,visibility] duration-200 ease-out motion-reduce:transition-none',
          'lg:visible lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-[228px] lg:max-w-none lg:translate-x-0 lg:shadow-none lg:transition-none',
          menuOpen
            ? 'visible translate-x-0 shadow-[8px_0_40px_rgba(0,0,0,0.6)]'
            : 'invisible -translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-hair">
          <Masthead />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="mr-3 border border-line px-2 py-1 text-[10px] tracking-[0.14em] text-dim uppercase transition-colors hover:border-mint/60 hover:text-mint lg:hidden"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <SideNav onNavigate={() => setMenuOpen(false)} />
        </div>

        <div className="border-t border-hair px-3 py-3 text-[10px] leading-relaxed text-faint">
          Everything here is drawn from generated pixel data. No game assets, no network
          calls.
          <a
            href="https://github.com/rbayuokt/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 flex items-center gap-1.5 tracking-[0.14em] text-dim uppercase transition-colors hover:text-mint"
          >
            <span className="size-1.5 bg-mint" />
            Created by @rbayuokt
          </a>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-16">
        <Outlet />
      </main>

      <GuideDock />
    </div>
  );
}
