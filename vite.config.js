import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Disable service worker in development to avoid Chrome issues
      devOptions: {
        enabled: false,
        type: 'module',
      },
      workbox: {
        // Increase file size limit for precaching (default is 2MB)
        // Main bundle is ~2.13MB, so we set it to 3MB to allow precaching
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        // Exclude API routes from service worker navigation
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Only cache images from same origin to avoid OpaqueResponseBlocking in Chrome
            // EXCLUDE Supabase images - they cause OpaqueResponseBlocking errors
            urlPattern: ({ sameOrigin, url }) => {
              const isSupabaseImage = url.origin.includes('supabase.co');
              return (
                sameOrigin &&
                !isSupabaseImage &&
                /\.(?:png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname)
              );
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // REMOVED: Supabase image caching - causes OpaqueResponseBlocking errors
          // Supabase images will load directly without service worker interference
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
