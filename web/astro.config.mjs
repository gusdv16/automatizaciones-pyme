import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

// Sitio estático. Las demos corren 100% en el navegador y reusan la lógica de ../core.
export default defineConfig({
  site: 'https://gusdv16.github.io',
  base: '/automatizaciones-pyme',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  vite: {
    // Permite importar los módulos de ../core, que viven fuera de la carpeta web/.
    server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  },
});
