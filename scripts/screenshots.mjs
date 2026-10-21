// Toma capturas de los proyectos con demo pública y las guarda optimizadas en WebP.
// Uso: npm run screenshots            (todos los proyectos con liveUrl y repo público)
//      npm run screenshots -- kuna-wallet sep   (solo esos slugs)
// Resultado: public/projects/<slug>/*.webp (+ variante -720.webp) y actualiza `images` en data/projects.json.
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'data/projects.json');
const MAX_BYTES = 200 * 1024;
const only = process.argv.slice(2);

const projects = JSON.parse(await fs.readFile(DATA, 'utf8'));
const capture = JSON.parse(await fs.readFile(path.join(ROOT, 'scripts/capture.json'), 'utf8').catch(() => '{}'));
const cfgOf = (p) => capture[p.slug] ?? {};
const targets = projects.filter((p) => p.liveUrl && (!p.isPrivate || cfgOf(p).allowPrivate) && (!only.length || only.includes(p.slug)));

async function toWebp(buf, out, width) {
  for (const quality of [80, 70, 60, 50, 40]) {
    const data = await sharp(buf).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
    if (data.length <= MAX_BYTES || quality === 40) {
      await fs.writeFile(out, data);
      const { width: w, height: h } = await sharp(data).metadata();
      return { w, h, bytes: data.length };
    }
  }
}

async function dismissBanners(page) {
  const re = /^(aceptar|acepto|accept|accept all|entendido|ok|got it|cerrar|close|de acuerdo)$/i;
  for (const el of await page.locator('button, [role="button"], a').all()) {
    const t = ((await el.textContent().catch(() => '')) || '').trim();
    if (re.test(t) && (await el.isVisible().catch(() => false))) await el.click({ timeout: 1500 }).catch(() => {});
  }
}

async function shoot(page, url, blur = []) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => page.waitForLoadState('load'));
  await page.waitForTimeout(1500);
  await dismissBanners(page);
  // Difumina datos de personas (fotos, nombres) que no son del autor
  if (blur.length) await page.addStyleTag({ content: `${blur.join(',')}{filter:blur(9px)!important}` }).catch(() => {});
  // Desactiva animaciones para capturas estables
  await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}' }).catch(() => {});
}

const browser = await chromium.launch();
const report = [];
for (const p of targets) {
  const dir = path.join(ROOT, 'public/projects', p.slug);
  await fs.mkdir(dir, { recursive: true });
  const images = [];
  try {
    const desk = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'es-PE' });
    const cfg = cfgOf(p);
    await shoot(desk, p.liveUrl, cfg.blur);
    const height = await desk.evaluate(() => document.documentElement.scrollHeight);
    const stops = [0, Math.round(height * 0.33), Math.round(height * 0.66)].filter((y, i, a) => i === 0 || y - a[i - 1] > 600).slice(0, cfg.maxStops ?? 3);
    for (const [i, y] of stops.entries()) {
      await desk.evaluate((yy) => window.scrollTo(0, yy), y);
      await desk.waitForTimeout(700);
      const buf = await desk.screenshot({ type: 'png' });
      const name = `desktop-${i + 1}.webp`;
      const big = await toWebp(buf, path.join(dir, name), 1440);
      await toWebp(buf, path.join(dir, name.replace('.webp', '-720.webp')), 720);
      images.push({ src: `projects/${p.slug}/${name}`, alt: i === 0 ? `Pantalla principal de ${p.title}` : `${p.title}: sección ${i + 1} de la página`, width: big.w, height: big.h, kind: 'desktop' });
    }
    await desk.close();

    const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light', locale: 'es-PE' });
    await shoot(mob, p.liveUrl, cfg.blur);
    const buf = await mob.screenshot({ type: 'png' });
    const big = await toWebp(buf, path.join(dir, 'mobile-1.webp'), 780);
    await toWebp(buf, path.join(dir, 'mobile-1-720.webp'), 390);
    images.push({ src: `projects/${p.slug}/mobile-1.webp`, alt: `${p.title} en móvil`, width: big.w, height: big.h, kind: 'mobile' });
    await mob.close();

    // Las ilustraciones generadas (si las hay) van después de las capturas reales
    p.images = [...images, ...(p.images ?? []).filter((i) => i.generated)];
    report.push(`OK   ${p.slug}: ${images.length} capturas`);
  } catch (e) {
    report.push(`FALLO ${p.slug}: ${e.message.split('\n')[0]}`);
  }
}
await browser.close();
await fs.writeFile(DATA, JSON.stringify(projects, null, 2) + '\n');
console.log(report.join('\n'));
