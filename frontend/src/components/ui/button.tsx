import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-md hover:bg-primary-dark border-transparent',
  secondary:
    'border-2 border-stone-300 bg-transparent text-stone-900 hover:border-stone-900 dark:border-zinc-600 dark:text-stone-100 dark:hover:border-white',
  ghost:
    'border border-stone-900/10 bg-transparent text-stone-700 hover:bg-stone-900/5 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/5',
};

const base =
  'tap-scale inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 focus-ring';

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }): ReactElement {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  children,
  ...props
}: LinkProps & { variant?: Variant; children: ReactNode }): ReactElement {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
