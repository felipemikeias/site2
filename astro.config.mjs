import { defineConfig } from 'astro/config';
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap"; // Importar sitemap

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: node({
    mode: 'standalone'
  }),
  site: 'https://justpcs.com.br', // URL de produção do seu site
  integrations: [sitemap()] // Adicionar integração de sitemap
});
