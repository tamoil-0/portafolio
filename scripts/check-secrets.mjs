// Escanea el contenido publicable del portafolio en busca de secretos antes de publicar.
// Uso: npm run check:secrets   (sale con código 1 si encuentra algo)
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIRS = ['data', 'src', 'public', 'scripts', 'dist', '.github'];
const FILES = ['README.md', 'astro.config.mjs', 'package.json'];
const TEXT = /\.(json|astro|ts|js|mjs|css|md|html|xml|txt|svg|yml|yaml)$/i;
const PATTERNS = [
  [/(api[_-]?key|secret|token|password|passwd|contraseña)\s*[:=]\s*['"][^'"\s]{6,}['"]/i, 'asignación de credencial'],
  [/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/, 'clave tipo sk-'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'token de GitHub'],
  [/github_pat_[A-Za-z0-9_]{40,}/, 'PAT de GitHub'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'clave AWS'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'clave Google'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, 'token Slack'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clave privada'],
  [/(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s'"]+:[^\s'"]+@/i, 'URL de base de datos con credenciales'],
  [/\bhf_[A-Za-z0-9]{30,}/, 'token Hugging Face'],
  [/193\.32\.204\.199/, 'IP del malware'],
];

async function* walk(dir) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (TEXT.test(e.name)) yield p;
  }
}

const hits = [];
const self = path.join(ROOT, 'scripts', 'check-secrets.mjs');
const files = [...FILES.map((f) => path.join(ROOT, f))];
for (const d of DIRS) for await (const f of walk(path.join(ROOT, d))) files.push(f);
for (const f of files) {
  if (f === self) continue;
  let txt;
  try { txt = await fs.readFile(f, 'utf8'); } catch { continue; }
  txt.split('\n').forEach((line, i) => {
    for (const [re, what] of PATTERNS) if (re.test(line)) hits.push(`${path.relative(ROOT, f)}:${i + 1}  ${what}`);
  });
}
if (hits.length) {
  console.error(`Posibles secretos encontrados (${hits.length}):\n` + hits.join('\n'));
  process.exit(1);
}
console.log(`Sin secretos en ${files.length} archivos.`);
