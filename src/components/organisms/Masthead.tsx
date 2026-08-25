import { Link } from 'react-router-dom';

export function Masthead() {
  return (
    <Link to="/" className="block px-3 py-3.5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-[0.2em] text-ink">VRAM</span>
        <span className="text-[15px] font-semibold tracking-[0.2em] text-mint">LAB</span>
      </div>
      <p className="mt-0.5 text-[10px] leading-tight tracking-[0.1em] text-faint uppercase">
        PS1 asset optimisation
      </p>
    </Link>
  );
}
