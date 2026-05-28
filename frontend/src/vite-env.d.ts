/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Google Maps JavaScript API — Maps için etkinleştirin ve faturalandırmayı açın. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
