// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Pages render on the server (as Vercel functions) so every page knows who is signed in.
  output: 'server',
  adapter: vercel(),

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
