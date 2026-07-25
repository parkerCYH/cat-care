import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // Phase 0 scope (see GitHub issue #5 resolution): app-shell precaching only.
      // No offline write queue, no background sync — failed mutations are retried
      // manually by the user re-triggering the TanStack Query mutation.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            // Cache-first with background revalidate so the cats list appears instantly
            // on repeat opens; the fresh response is stashed for next time, not pushed
            // back into the current render (see cat-care-sw-cache-first ticket 02).
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && url.pathname === '/api/v1/cat-care/cats',
            handler: 'StaleWhileRevalidate',
          },
        ],
      },
      manifest: {
        name: 'Cat Care',
        short_name: 'Cat Care',
        description: 'A personal health tracker for a cat’s bowel movements and weight.',
        theme_color: '#ea9f80',
        background_color: '#ea9f80',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
