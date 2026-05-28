import { ArrowLeft, Heart, MapPin, Navigation, Share2 } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function VenueDetailHero({
  title,
  locationLine,
  imageUrl,
  backTo,
  onFavorite,
  favorited,
  children,
}: {
  title: string;
  locationLine: string;
  imageUrl: string;
  backTo: string;
  onFavorite?: () => void;
  favorited?: boolean;
  children?: ReactNode;
}): ReactElement {
  return (
    <div className="venue-hero -mx-3 sm:-mx-4 md:-mx-8">
      <div className="venue-hero__bar relative px-4 pb-3 pt-3 sm:px-5 md:px-8">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={backTo}
            className="tap-scale flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
            aria-label="Geri"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex gap-2">
            {onFavorite ? (
              <button
                type="button"
                className="tap-scale flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
                onClick={onFavorite}
                aria-label={favorited ? 'Favoriden çıkar' : 'Favoriye ekle'}
              >
                <Heart className={`h-5 w-5 ${favorited ? 'fill-white' : ''}`} />
              </button>
            ) : null}
            <button
              type="button"
              className="tap-scale flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
              aria-label="Paylaş"
              onClick={() => {
                if (navigator.share) void navigator.share({ title, text: locationLine, url: window.location.href });
              }}
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        <h1 className="mt-3 text-center font-display text-xl font-extrabold text-white sm:text-2xl">{title}</h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-center text-sm text-white/90">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          {locationLine}
        </p>
      </div>
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      {children ? (
        <div className="relative z-10 -mt-8 mx-3 rounded-2xl border border-stone-900/8 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-zinc-900 sm:mx-4 md:mx-8">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DirectionsCta({
  lat,
  lng,
  label = 'Yol tarifi al',
}: {
  lat: number;
  lng: number;
  label?: string;
}): ReactElement {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

  return (
    <div className="space-y-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-scale flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 text-base font-bold text-white shadow-md hover:bg-teal-700"
      >
        <Navigation className="h-5 w-5" aria-hidden="true" />
        {label}
      </a>
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
        💡 Yol tarifi için Google Haritalar açılır.
      </p>
    </div>
  );
}
