import type { FontPreference, ThemePreference } from '../stores/theme-store';

export type ThemeMeta = {
  id: ThemePreference;
  tagline: string;
  mood: string;
  swatch: string;
  swatchAlt: string;
};

export const THEME_META: ThemeMeta[] = [
  { id: 'system', tagline: 'Cihazınıza uyum', mood: 'Otomatik', swatch: '#e7e5e4', swatchAlt: '#18181b' },
  { id: 'light', tagline: 'Kağıt ve yeşil', mood: 'Gündüz gezisi', swatch: '#f4f0e8', swatchAlt: '#1db954' },
  { id: 'dark', tagline: 'Gece müzesi', mood: 'Odaklı keşif', swatch: '#0f172a', swatchAlt: '#22c55e' },
  {
    id: 'heritage',
    tagline: 'Osmanlı mirası',
    mood: 'Altın & parşömen',
    swatch: '#e8dcc8',
    swatchAlt: '#8b6914',
  },
  { id: 'ocean', tagline: 'Boğaz mavisi', mood: 'Deniz & gökyüzü', swatch: '#caf0f8', swatchAlt: '#0077b6' },
  { id: 'sunset', tagline: 'İstanbul akşamı', mood: 'Sıcak turuncu', swatch: '#fff1e6', swatchAlt: '#e85d04' },
  { id: 'forest', tagline: 'Belgrad ormanı', mood: 'Doğa yeşili', swatch: '#d8f3dc', swatchAlt: '#2d6a4f' },
  { id: 'classic', tagline: 'Gazete baskı', mood: 'Siyah-beyaz zarafet', swatch: '#faf8f5', swatchAlt: '#171717' },
];

export const FONT_META: Record<FontPreference, string> = {
  sans: 'Modern — Sora & DM Sans',
  serif: 'Klasik — Georgia serif',
  rounded: 'Yuvarlak — Nunito',
};
