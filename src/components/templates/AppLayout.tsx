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

  return (
    <div className="relative z-10 min-h-screen lg:flex">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-deck/95 backdrop-blur lg:hidden">
        <Masthead />
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="mr-3 border border-line px-2.5 py-1 text-[10px] tracking-[0.14em] text-dim uppercase"
        >
          {menuOpen ? 'Close' : 'Sections'}
        </button>
      </header>

      <aside
        className={cn(
          'z-30 w-full shrink-0 border-line bg-deck lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[228px] lg:overflow-y-auto lg:border-r',
          menuOpen ? 'block border-b' : 'hidden',
        )}
      >
        <div className="hidden border-b border-hair lg:block">
          <Masthead />
        </div>
        <div className="py-2">
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
