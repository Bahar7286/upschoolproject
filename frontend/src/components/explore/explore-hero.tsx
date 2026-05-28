import { ArrowLeft } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function ExploreHero({
  title,
  subtitle,
  backTo,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  backTo: string;
  badge?: ReactNode;
  children?: ReactNode;
}): ReactElement {
  return (
    <div className="explore-hero -mx-3 mb-4 overflow-hidden rounded-b-[28px] px-4 pb-5 pt-3 sm:-mx-4 sm:px-5 md:-mx-8 md:rounded-b-[32px] md:px-8">
      <div className="relative flex items-start gap-3">
        <Link
          to={backTo}
          className="tap-scale mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-white/85">{subtitle}</p> : null}
          {badge ? <div className="mt-2">{badge}</div> : null}
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
