import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

const sizes = {
  sm: { mark: 'h-8 w-8 rounded-xl', text: 'text-base' },
  md: { mark: 'h-10 w-10 rounded-2xl', text: 'text-lg' },
  lg: { mark: 'h-12 w-12 rounded-2xl', text: 'text-xl' },
} as const;

export function BrandLogo({
  size = 'md',
  showText = true,
  to = '/discover',
  className = '',
}: {
  size?: keyof typeof sizes;
  showText?: boolean;
  to?: string;
  className?: string;
}): ReactElement {
  const s = sizes[size];

  const content = (
    <>
      <span
        className={`${s.mark} relative inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-heritage-gold to-amber-800 shadow-md`}
        aria-hidden="true"
      >
        <svg className="h-[55%] w-[55%] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
        </svg>
      </span>
      {showText ? (
        <span className={`hidden font-display font-extrabold tracking-tight text-theme sm:inline ${s.text}`}>
          Historial-GO
        </span>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link className={`tap-scale inline-flex items-center gap-3 ${className}`} to={to} aria-label="Historial-GO ana sayfa">
        {content}
      </Link>
    );
  }

  return <div className={`inline-flex items-center gap-3 ${className}`}>{content}</div>;
}
