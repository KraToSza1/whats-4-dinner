import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.spoonacular\.com\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'spoonacular-api' },
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'images' },
          },
        ],
      },
      manifest: {
        name: "What's 4 Dinner?",
        short_name: 'W4D',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [{ src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
    }),
  ],
  build: {
    sourcemap: false, // Disable source maps to reduce warnings
  },
  esbuild: {
    sourcemap: false, // Disable source maps in esbuild
  },
});
