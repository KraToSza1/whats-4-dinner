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
  server: {
    port: 5173,
    // No proxy needed - vercel dev handles /api routes automatically
    // For npm run dev, API calls will use the deployed Vercel URL
  },
  build: {
    sourcemap: false, // Disable source maps to reduce warnings
  },
  esbuild: {
    sourcemap: false, // Disable source maps in esbuild
  },
});
