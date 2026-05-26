/**
 * Historial-GO — store icon & splash generator
 * Renders SVG sources → PNG, then runs @capacitor/assets for native platforms.
 */
import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const publicDir = path.join(root, 'public');

const svgToPng = async (svgPath, pngPath, size) => {
  const svg = await readFile(svgPath);
  await sharp(svg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath);
  console.log(`  ✓ ${path.relative(root, pngPath)} (${size}px)`);
};

const svgToPngRect = async (svgPath, pngPath, width, height) => {
  const svg = await readFile(svgPath);
  await sharp(svg, { density: 300 })
    .resize(width, height, { fit: 'cover' })
    .png()
    .toFile(pngPath);
  console.log(`  ✓ ${path.relative(root, pngPath)} (${width}×${height})`);
};

console.log('\n📦 Historial-GO asset generation\n');

console.log('1/3 Source PNGs from SVG…');
await svgToPng(path.join(assetsDir, 'icon.svg'), path.join(assetsDir, 'icon-only.png'), 1024);
await svgToPng(path.join(assetsDir, 'icon-foreground.svg'), path.join(assetsDir, 'icon-foreground.png'), 1024);
await svgToPng(path.join(assetsDir, 'icon-background.svg'), path.join(assetsDir, 'icon-background.png'), 1024);
await svgToPngRect(path.join(assetsDir, 'splash.svg'), path.join(assetsDir, 'splash.png'), 2732, 2732);
await svgToPngRect(path.join(assetsDir, 'splash-dark.svg'), path.join(assetsDir, 'splash-dark.png'), 2732, 2732);

console.log('\n2/3 Web / PWA icons…');
await mkdir(publicDir, { recursive: true });
await svgToPng(path.join(assetsDir, 'icon.svg'), path.join(publicDir, 'apple-touch-icon.png'), 180);
await svgToPng(path.join(assetsDir, 'icon.svg'), path.join(publicDir, 'icon-192.png'), 192);
await svgToPng(path.join(assetsDir, 'icon.svg'), path.join(publicDir, 'icon-512.png'), 512);

const manifest = {
  name: 'Historial-GO',
  short_name: 'Historial-GO',
  description: "İstanbul'un tarihi rotalarını AI ile keşfet — sesli rehber ve interaktif harita.",
  start_url: '/',
  display: 'standalone',
  background_color: '#f4f0e8',
  theme_color: '#c9a227',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
await writeFile(path.join(publicDir, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('  ✓ public/manifest.webmanifest');

console.log('\n3/3 Native platforms (@capacitor/assets)…');
execSync('npx @capacitor/assets generate --assetPath assets --ios --android --iconBackgroundColor "#c9a227" --iconBackgroundColorDark "#0c1222" --splashBackgroundColor "#f4f0e8" --splashBackgroundColorDark "#09090b"', {
  cwd: root,
  stdio: 'inherit',
});

console.log('\n✅ Done — icons & splash ready for iOS, Android, and PWA.\n');
