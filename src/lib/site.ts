import profileData from '../../data/profile.json';
import projectsData from '../../data/projects.json';

export type Category = 'IA' | 'Web' | 'Móvil' | 'Comunidad' | 'Postulación' | 'Otro';

export interface ProjectImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  kind?: 'desktop' | 'mobile';
  /** Ilustración generada (recreación basada en el código), no una captura real. */
  generated?: boolean;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  category: Category;
  tags: string[];
  stack: string[];
  role: string;
  teamSize: number | null;
  period: { start: string; end: string | null };
  status: string;
  isPrivate: boolean;
  repoUrl: string | null;
  liveUrl: string | null;
  context: string;
  problem: string;
  solution: string;
  howItWorks: string[];
  results: string[];
  architecture: string[];
  ai: { models: string[]; technique: string; datasets: string[]; metrics: string[] } | null;
  images: ProjectImage[];
  featured: boolean;
  order: number;
}

export const profile = profileData;
export const projects = (projectsData as unknown as Project[]).slice().sort((a, b) => a.order - b.order);

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const url = (path = '') => base + path.replace(/^\//, '');
export const projectUrl = (p: Pick<Project, 'slug'>) => url(`proyectos/${p.slug}/`);

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'IA', label: 'IA' },
  { key: 'Web', label: 'Web' },
  { key: 'Móvil', label: 'Móvil' },
  { key: 'Comunidad', label: 'Comunidad' },
  { key: 'Postulación', label: 'Postulaciones' },
  { key: 'Otro', label: 'Otros' },
];

/** Nombres canónicos de tecnologías, para agrupar variantes ("React 19", "Next.js 16", "Flutter (Riverpod)"). */
const TECH: [RegExp, string][] = [
  [/flutter/i, 'Flutter'], [/\bdart\b/i, 'Dart'], [/next\.?js/i, 'Next.js'], [/\breact\b(?! native)/i, 'React'],
  [/typescript/i, 'TypeScript'], [/javascript/i, 'JavaScript'], [/\bpython\b/i, 'Python'], [/fastapi/i, 'FastAPI'],
  [/laravel/i, 'Laravel'], [/\bphp\b/i, 'PHP'], [/node(\.js)?\b|express/i, 'Node.js'], [/tailwind/i, 'Tailwind CSS'],
  [/tensorflow|keras/i, 'TensorFlow'], [/pytorch|torch/i, 'PyTorch'], [/opencv/i, 'OpenCV'], [/supabase/i, 'Supabase'],
  [/postgres/i, 'PostgreSQL'], [/mysql|mariadb/i, 'MySQL / MariaDB'], [/sqlite/i, 'SQLite'], [/docker/i, 'Docker'],
  [/firebase/i, 'Firebase'], [/gemini|gpt|openai|groq|responses api/i, 'APIs de LLM'], [/vite\b/i, 'Vite'],
  [/faiss/i, 'FAISS'], [/streamlit/i, 'Streamlit'], [/go\b.*graphql|graphql/i, 'GraphQL'],
];
export const techsOf = (p: Pick<Project, 'stack'>) =>
  [...new Set(p.stack.flatMap((s) => TECH.filter(([re]) => re.test(s)).map(([, name]) => name)))];

/** Categoría principal + las etiquetas que coinciden con una categoría (para los filtros). */
export const categoriesOf = (p: Pick<Project, 'category' | 'tags'>) =>
  CATEGORIES.map((c) => c.key).filter((k) => k === p.category || p.tags.includes(k));

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const fmtMonth = (ym: string | null) => {
  if (!ym) return 'actualidad';
  const [y, m] = ym.split('-').map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : String(y);
};
export const fmtPeriod = (p: Project['period']) =>
  p.start === p.end || !p.end ? fmtMonth(p.start) : `${fmtMonth(p.start)} – ${fmtMonth(p.end)}`;

export const teamLabel = (n: number | null) => (n && n > 1 ? `Equipo de ${n} personas` : 'Individual');

/** Nodos y aristas a partir de líneas "A -> B" para el diagrama de arquitectura. */
export function parseArchitecture(lines: string[]) {
  const nodes: string[] = [];
  const edges: [string, string][] = [];
  for (const line of lines) {
    const parts = line.split(/\s*(?:->|→)\s*/).map((s) => s.trim()).filter(Boolean);
    parts.forEach((n) => { if (!nodes.includes(n)) nodes.push(n); });
    for (let i = 0; i < parts.length - 1; i++) edges.push([parts[i], parts[i + 1]]);
  }
  return { nodes, edges };
}
