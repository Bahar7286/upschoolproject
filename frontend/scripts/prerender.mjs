/**
 * Post-build prerender: snapshot key routes for SEO (requires preview server + puppeteer).
 * Skip with SKIP_PRERENDER=1
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PRERENDER_PORT || 4173);
const api = (process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const STATIC = [
  '/',
  '/discover',
  '/cities',
  '/rehberler',
  '/terms',
  '/privacy',
  '/kvkk',
  '/cerezler',
  '/iade',
  '/rehber-guven',
  '/odeme-guvenlik',
  '/iletisim',
  '/hakkimizda',
  '/sss',
];

async function fetchExtraRoutes() {
  const extra = [];
  try {
    const routesRes = await fetch(`${api}/routes`);
    if (routesRes.ok) {
      const routes = await routesRes.json();
      for (const r of routes.slice(0, 30)) {
        extra.push(`/routes/${r.route_id}`);
      }
    }
    const citiesRes = await fetch(`${api}/cities`);
    if (citiesRes.ok) {
      const cities = await citiesRes.json();
      for (const c of cities.slice(0, 20)) {
        extra.push(`/cities/${c.city_id}`);
      }
    }
  } catch {
    console.warn('API unavailable for dynamic prerender URLs; static only.');
  }
  return extra;
}

function waitForServer(ms = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      fetch(`http://127.0.0.1:${port}/`)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - start > ms) reject(new Error('Preview server timeout'));
          else setTimeout(tick, 300);
        });
    };
    tick();
  });
}

async function main() {
  if (process.env.SKIP_PRERENDER === '1') {
    console.log('SKIP_PRERENDER=1 — prerender atlandı.');
    return;
  }
  if (!fs.existsSync(dist)) {
    console.error('dist/ yok — önce npm run build');
    process.exit(1);
  }

  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.warn('puppeteer yok — npm i -D puppeteer veya SKIP_PRERENDER=1');
    return;
  }

  const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: root,
    shell: true,
    stdio: 'ignore',
  });

  try {
    await waitForServer();
    const paths = [...STATIC, ...(await fetchExtraRoutes())];
    const browser = await puppeteer.default.launch({ headless: true });
    const page = await browser.newPage();

    for (const routePath of paths) {
      const url = `http://127.0.0.1:${port}${routePath}`;
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await new Promise((r) => setTimeout(r, 800));
      const html = await page.content();
      const outDir = path.join(dist, routePath === '/' ? '' : routePath);
      fs.mkdirSync(outDir, { recursive: true });
      const outFile = path.join(dist, routePath === '/' ? 'index.html' : path.join(routePath.slice(1), 'index.html'));
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, html, 'utf8');
      console.log('prerendered', routePath);
    }

    await browser.close();
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
