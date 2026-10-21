// Renderiza las láminas HTML de scripts/mockups/<slug>/*.html a WebP en public/projects/<slug>/
// y las registra en data/projects.json (marcadas como `generated`, se muestran como ilustración).
// Uso: node scripts/render-mockups.mjs            (todas)
//      node scripts/render-mockups.mjs dermapp     (solo esos slugs)
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const MOCK = path.join(ROOT, 'scripts/mockups');
const DATA = path.join(ROOT, 'data/projects.json');
const only = process.argv.slice(2);

const projects = JSON.parse(await fs.readFile(DATA, 'utf8'));
const slugs = (await fs.readdir(MOCK, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && (!only.length || only.includes(d.name)))
  .map((d) => d.name);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const report = [];
for (const slug of slugs) {
  const project = projects.find((p) => p.slug === slug);
  if (!project) { report.push(`SIN PROYECTO ${slug}`); continue; }
  const files = (await fs.readdir(path.join(MOCK, slug))).filter((f) => f.endsWith('.html')).sort();
  const outDir = path.join(ROOT, 'public/projects', slug);
  await fs.mkdir(outDir, { recursive: true });
  const images = [];
  for (const file of files) {
    const errors = [];
    page.removeAllListeners('pageerror');
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(MOCK, slug, file)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const title = (await page.title()) || `${project.title}: ilustración`;
    const overflow = await page.evaluate(() => document.body.scrollHeight > 1002 || document.body.scrollWidth > 1602);
    const buf = await page.screenshot({ type: 'png' });
    const name = `gen-${path.basename(file, '.html')}`;
    for (const [w, suffix] of [[1600, ''], [720, '-720']]) {
      await sharp(buf).resize({ width: w }).webp({ quality: 82 }).toFile(path.join(outDir, `${name}${suffix}.webp`));
    }
    images.push({ src: `projects/${slug}/${name}.webp`, alt: title, width: 1600, height: 1000, kind: 'desktop', generated: true });
    report.push(`${errors.length || overflow ? 'REVISAR' : 'OK'}  ${slug}/${file}${overflow ? ' (desborda 1600x1000)' : ''}${errors.length ? ' ' + errors[0] : ''}`);
  }
  // Las capturas reales van primero; las ilustraciones generadas se reemplazan completas.
  project.images = [...(project.images ?? []).filter((i) => !i.generated), ...images];
}
await browser.close();
await fs.writeFile(DATA, JSON.stringify(projects, null, 2) + '\n');
console.log(report.join('\n'));
