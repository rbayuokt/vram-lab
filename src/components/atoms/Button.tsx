import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'primary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  default: 'border-line bg-deck text-dim hover:border-dim hover:text-ink',
  primary: 'border-mint bg-mint text-void hover:bg-mint/85',
  danger: 'border-rose/50 bg-rose/10 text-rose hover:bg-rose/20',
  ghost: 'border-transparent bg-transparent text-faint hover:text-ink',
};

export function Button({ variant = 'default', className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'border px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        styles[variant],
        className,
      )}
    />
  );
}
