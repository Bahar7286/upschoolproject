export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL?.trim() || 'gulbaharkirgin7286@gmail.com';

export const DEMO_ACCOUNTS = [
  { role: 'Turist', email: 'tourist@example.com', password: 'demo123' },
  { role: 'Rehber', email: 'guide@example.com', password: 'demo123' },
  { role: 'Admin', email: 'admin@example.com', password: 'demo123' },
] as const;
