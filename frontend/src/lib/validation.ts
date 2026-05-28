export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'E-posta gerekli.';
  if (!EMAIL_RE.test(v)) return 'Geçerli bir e-posta adresi girin.';
  return null;
}

export function validatePassword(value: string, minLen = 6): string | null {
  if (!value) return 'Şifre gerekli.';
  if (value.length < minLen) return `Şifre en az ${minLen} karakter olmalı.`;
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} gerekli.`;
  return null;
}

export const inputErrorClass =
  'border-red-500 focus:border-red-500 dark:border-red-400 dark:focus:border-red-400';
