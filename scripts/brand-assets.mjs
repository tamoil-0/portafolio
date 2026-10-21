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
const display = await font('@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2');
const sans = await font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const photo = 'data:image/webp;base64,' + (await fs.readFile(path.join(ROOT, 'public', profile.photo.src))).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Display;src:url("${display}");font-weight:200 800}
@font-face{font-family:Sans;src:url("${sans}");font-weight:100 900}
body{margin:0;width:1200px;height:630px;background:#07060e;color:#f4f2ff;font-family:Sans;position:relative;overflow:hidden;display:flex;align-items:center;gap:64px;padding:0 80px;box-sizing:border-box}
.b{position:absolute;border-radius:50%;filter:blur(90px)}
.b1{width:560px;height:560px;left:-160px;top:-220px;background:#5a3cf4;opacity:.55}
.b2{width:480px;height:480px;right:-120px;bottom:-200px;background:#ee5a2f;opacity:.4}
.grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff10 1px,transparent 1px),linear-gradient(90deg,#ffffff10 1px,transparent 1px);background-size:48px 48px}
.txt{position:relative;flex:1}
.top{font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#a7a3c2}
h1{font-family:Display;font-weight:700;font-size:96px;line-height:.98;margin:22px 0 0;letter-spacing:-3px}
h1 span{background:linear-gradient(115deg,#8a76ff,#d063f0 50%,#ff8a5c);-webkit-background-clip:text;color:transparent}
p{font-size:30px;color:#c9c5e0;margin:24px 0 0;line-height:1.35}
.url{margin-top:36px;font-size:24px;font-weight:600;color:#ff8a5c}
.ph{position:relative;width:300px;height:375px;padding:6px;border-radius:44% 56% 50% 50%/46% 44% 56% 54%;background:conic-gradient(#5a3cf4,#b23cdc,#ee5a2f,#0d9bb5,#5a3cf4);flex:none}
.ph img{width:100%;height:100%;object-fit:cover;border-radius:inherit;border:5px solid #07060e;box-sizing:border-box}
</style></head><body>
<i class="b b1"></i><i class="b b2"></i><i class="grid"></i>
<div class="txt"><div class="top">Portafolio · ${profile.location}</div>
<h1>Hola, soy<br><span>${profile.shortName}</span></h1><p>${profile.role}</p><div class="url">tamoil-0.github.io/portafolio</div></div>
<div class="ph"><img src="${photo}"></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(ROOT, 'public/og.png') });
await browser.close();
await sharp(await fs.readFile(path.join(ROOT, 'public/og.png'))).png({ compressionLevel: 9 }).toFile(path.join(ROOT, 'public/og.tmp.png'));
await fs.rename(path.join(ROOT, 'public/og.tmp.png'), path.join(ROOT, 'public/og.png'));

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3cf4"/><stop offset=".5" stop-color="#b23cdc"/><stop offset="1" stop-color="#ee5a2f"/></linearGradient></defs><rect width="180" height="180" fill="url(#g)"/><text x="90" y="116" text-anchor="middle" font-family="Arial,sans-serif" font-size="76" font-weight="700" fill="#fff" letter-spacing="-3">JA</text></svg>`;
await sharp(Buffer.from(icon)).png().toFile(path.join(ROOT, 'public/apple-touch-icon.png'));
console.log('og.png y apple-touch-icon.png generados');
