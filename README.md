# Portafolio · Jhon Aracayo

Sitio estático hecho con [Astro](https://astro.build): rápido, sin frameworks de JavaScript en el cliente y generado a partir de dos archivos JSON.

**En vivo:** https://tamoil-0.github.io/portafolio/

## Correrlo localmente

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev        # http://localhost:4321/portafolio/
npm run build      # genera dist/
npm run preview    # sirve dist/ para revisarlo
```

## Agregar un proyecto nuevo

1. Abre `data/projects.json` y copia un objeto existente al final de la lista.
2. Cambia los campos. Los importantes:

| Campo | Qué poner |
|---|---|
| `slug` | identificador para la URL, en minúsculas y con guiones (`mi-proyecto`) |
| `title`, `shortDescription` (máx. 120 caracteres), `longDescription` | textos del proyecto |
| `category` | `IA`, `Web`, `Móvil`, `Comunidad`, `Postulación` u `Otro` |
| `tags` | etiquetas libres; si incluyes otra categoría (p. ej. `Postulación`) también aparecerá en ese filtro |
| `stack` | tecnologías, en orden de importancia |
| `role`, `teamSize`, `period` (`{"start": "2026-05", "end": "2026-06"}`), `status`, `context` | ficha del proyecto |
| `isPrivate` | `true` muestra el candado "Proyecto privado" |
| `liveUrl` | página pública (botón "Ver página") o `null`; `repoUrl` se guarda pero no se muestra |
| `access` | si no hay `liveUrl`: `{ "type": "institucional" \| "empresa" \| "prototipo", "note": "por qué es privado" }`; si hay `liveUrl`, `null` |
| `problem`, `solution`, `howItWorks[]`, `results[]` | secciones de la página de detalle |
| `architecture[]` | líneas tipo `"App -> API -> Base de datos"` (referencia interna; la arquitectura se muestra con láminas) |
| `ai` | `null` o `{ "models": [], "technique": "", "datasets": [], "metrics": [] }` |
| `featured` | `true` para que salga en "Proyectos destacados" (ideal 3 a 6) |
| `order` | posición en la lista (menor = primero) |

3. Imágenes (la primera es la portada de la tarjeta):
   - **Página pública:** `npm run screenshots -- mi-proyecto` toma capturas de escritorio y móvil, las optimiza en WebP y actualiza `images`. Si el repo es privado pero la página es pública, o hay que difuminar fotos y nombres de personas, configúralo en `scripts/capture.json`.
   - **Proyecto privado o sin página:** crea láminas HTML en `scripts/mockups/<slug>/01-nombre.html` (copia `scripts/mockups/_ejemplo/`, usan `scripts/mockups/_kit.css`) y ejecuta `node scripts/render-mockups.mjs mi-proyecto`. Se marcan como "Ilustración" en la galería.
   - **Capturas propias:** guárdalas en `public/projects/<slug>/` como `nombre.webp` **y** `nombre-720.webp` y agrégalas a `images` con `src`, `alt`, `width`, `height` y `kind` (`desktop` o `mobile`).
4. `npm run build` para comprobar que todo compila.

Los datos personales (bio, contacto, habilidades) están en `data/profile.json`.

## Cambiar colores y tipografías

Todo está en variables CSS al inicio de `src/styles/global.css`:

- `--accent` (índigo), `--accent-2` (coral) y `--accent-3` (turquesa) son los acentos; `--grad` es el degradado de marca. Hay valores para modo claro y oscuro.
- `--c-ia`, `--c-web`, `--c-movil`… son los colores fijos de cada categoría.
- `--bg`, `--surface`, `--text`, `--muted` y `--line` son los neutros.
- Las fuentes son Bricolage Grotesque (títulos), Inter (texto) y JetBrains Mono (etiquetas), servidas desde el propio sitio con `@fontsource`.

El número de WhatsApp (botón flotante y botones de contacto) está en `whatsapp` dentro de `data/profile.json`.

Si cambias colores, regenera la imagen para redes sociales con `node scripts/brand-assets.mjs`.

## Publicar

Cada `git push` a `master` despliega el sitio en GitHub Pages con el workflow `.github/workflows/deploy.yml`, que también ejecuta `npm run check:secrets` y se detiene si encuentra claves o tokens.

Para usar un dominio propio o Vercel, cambia `site` y quita `base` en `astro.config.mjs`.

## Estructura

```
data/            projects.json y profile.json (todo el contenido)
public/          favicon, imagen OG, robots.txt y capturas en public/projects/<slug>/
scripts/         capturas (Playwright), imagen OG y escaneo de secretos
src/components/  piezas reutilizables (tarjeta, galería, menú, botón de WhatsApp, portada SVG…)
src/pages/       inicio, detalle de proyecto (/proyectos/<slug>/) y 404
```
