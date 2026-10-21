import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages: https://tamoil-0.github.io/portafolio/
// Si se publica en Vercel o en un dominio propio, cambia `site` y borra `base`.
export default defineConfig({
  site: 'https://tamoil-0.github.io',
  base: '/portafolio',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'always' },
});
