import { NavLink } from 'react-router-dom';
import { SECTIONS } from '@/data/sections';
import { cn } from '@/lib/cn';

export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav
      data-guide="nav"
      className="flex flex-col gap-px"
      aria-label="Playground sections"
    >
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2.5 border-l-2 px-3 py-2 text-[11px] transition-colors',
            isActive
              ? 'border-mint bg-raise text-ink'
              : 'border-transparent text-dim hover:bg-panel hover:text-ink',
          )
        }
      >
        <span className="tabnum w-5 text-faint">00</span>
        <span className="tracking-[0.06em]">Start here</span>
      </NavLink>
      {SECTIONS.map((s) => (
        <NavLink
          key={s.id}
          to={s.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 border-l-2 px-3 py-2 text-[11px] transition-colors',
              isActive
                ? 'border-mint bg-raise text-ink'
                : 'border-transparent text-dim hover:bg-panel hover:text-ink',
            )
          }
        >
          <span className="tabnum w-5 shrink-0 text-faint">{s.no}</span>
          <span className="truncate tracking-[0.06em]">{s.nav}</span>
        </NavLink>
      ))}
    </nav>
  );
}
