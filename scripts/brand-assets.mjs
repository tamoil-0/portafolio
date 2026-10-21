// Genera public/og.png (1200x630) y public/apple-touch-icon.png (180x180).
// Uso: node scripts/brand-assets.mjs
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const profile = JSON.parse(await fs.readFile(path.join(ROOT, 'data/profile.json'), 'utf8'));
// Fuentes incrustadas en base64: una página about:blank no puede leer file://
const font = async (f) => 'data:font/woff2;base64,' + (await fs.readFile(path.join(ROOT, 'node_modules', f))).toString('base64');
const serif = await font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2');
const sans = await font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Serif;src:url("${serif}")}
@font-face{font-family:Sans;src:url("${sans}");font-weight:100 900}
body{margin:0;width:1200px;height:630px;background:#fafaf9;color:#141414;font-family:Sans;display:flex;flex-direction:column;justify-content:space-between;padding:72px 80px;box-sizing:border-box;
background-image:linear-gradient(#e7e5e4 1px,transparent 1px),linear-gradient(90deg,#e7e5e4 1px,transparent 1px);background-size:40px 40px}
.top{display:flex;align-items:center;gap:16px;font-size:22px;letter-spacing:.12em;text-transform:uppercase;color:#57534e}
.top i{width:28px;height:2px;background:#b03a0c}
h1{font-family:Serif;font-weight:400;font-size:104px;line-height:1;margin:0;letter-spacing:-1px}
p{font-size:30px;color:#57534e;margin:20px 0 0;max-width:900px;line-height:1.35}
.foot{display:flex;justify-content:space-between;font-size:24px;color:#141414}
.foot b{color:#b03a0c;font-weight:600}
</style></head><body>
<div class="top"><i></i>Portafolio · ${profile.location}</div>
<div><h1>${profile.name}</h1><p>${profile.role}</p></div>
<div class="foot"><span>IA · Web · Móvil · Comunidad</span><b>tamoil-0.github.io/portafolio</b></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(ROOT, 'public/og.png') });
await browser.close();
await sharp(await fs.readFile(path.join(ROOT, 'public/og.png'))).png({ compressionLevel: 9, palette: true }).toFile(path.join(ROOT, 'public/og.tmp.png'));
await fs.rename(path.join(ROOT, 'public/og.tmp.png'), path.join(ROOT, 'public/og.png'));

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="#141414"/><text x="90" y="116" text-anchor="middle" font-family="Arial,sans-serif" font-size="76" font-weight="700" fill="#fafaf9" letter-spacing="-3">JA</text></svg>`;
await sharp(Buffer.from(icon)).png().toFile(path.join(ROOT, 'public/apple-touch-icon.png'));
console.log('og.png y apple-touch-icon.png generados');
