export function getSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL as string | undefined;
  if (raw?.trim()) return raw.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://historial-go-web.onrender.com';
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
