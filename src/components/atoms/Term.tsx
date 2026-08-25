import { useId, useState, type ReactNode } from 'react';
import { GLOSSARY } from '@/data/glossary';
import { cn } from '@/lib/cn';

interface TermProps {
  k: keyof typeof GLOSSARY | string;
  children?: ReactNode;
  className?: string;
  /** Lets the guide spotlight point at this term. */
  guideId?: string;
}

/** Dotted-underline jargon with a hover/focus definition popover. */
export function Term({ k, children, className, guideId }: TermProps) {
  const entry = GLOSSARY[k];
  const [open, setOpen] = useState(false);
  const id = useId();

  if (!entry) return <>{children ?? k}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        data-guide={guideId}
        aria-describedby={open ? id : undefined}
        className={cn(
          'cursor-help border-b border-dotted border-mint/60 text-mint/90 transition-colors hover:text-mint',
          className,
        )}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 border border-line bg-raise p-2.5 text-left text-[11px] leading-relaxed text-ink shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
        >
          <span className="mb-1 block text-[10px] tracking-[0.16em] text-mint uppercase">
            {entry.term}
          </span>
          <span className="block text-dim">{entry.short}</span>
          {entry.detail && (
            <span className="mt-1.5 block border-t border-hair pt-1.5 text-faint">
              {entry.detail}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
