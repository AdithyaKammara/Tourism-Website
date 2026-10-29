// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Pages render on the server so every page knows who is signed in.
  // Swap the adapter for @astrojs/vercel or @astrojs/netlify when we pick a host.
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
