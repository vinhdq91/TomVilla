// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import icon from 'astro-icon';
import node from '@astrojs/node';

// `npm run admin` sets KEYSTATIC=1: the site runs on Node with the admin panel at
// /keystatic, saving files to disk (Cloudflare's local dev runtime can't do that).
// `npm run dev` previews the site in the Cloudflare runtime, without the admin.
// `npm run build` includes the admin, which runs online in GitHub mode (keystatic.config.ts).
const isAdmin = process.env.KEYSTATIC === '1';
const isPlainDev = process.argv.includes('dev') && !isAdmin;

// https://astro.build/config
export default defineConfig({
  // site: 'https://your-domain.com', // set when the domain is chosen (canonical URLs, sitemap)
  vite: {
    plugins: [tailwindcss()],
  },

  // Pages are pre-built as static files. The adapter is here from day one so
  // booking pages (Cloudflare D1) can be added later without restructuring.
  adapter: isAdmin ? node({ mode: 'standalone' }) : cloudflare({ imageService: 'compile' }),
  integrations: [
    react(),
    markdoc(),
    icon({ include: { lucide: ['*'] } }),
    ...(isPlainDev ? [] : [keystatic()]),
  ],
});
