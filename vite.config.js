import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import { nodePolyfills } from 'vite-plugin-polyfill';

export default defineConfig({
  plugins: [
    react(),
    // Polyfills for Node.js modules (if needed)
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // Legacy browser support (IE11, older Safari, etc.)
    legacy({
      targets: ['defaults', 'not IE 11', 'not dead', '> 0.5%'],
      modernPolyfills: true,
      renderLegacyChunks: true,
      polyfills: [
        'es.symbol',
        'es.array.filter',
        'es.promise',
        'es.promise.finally',
        'es/map',
        'es/set',
        'es.array.for-each',
        'es.object.define-properties',
        'es.object.define-property',
        'es.object.get-own-property-descriptor',
        'es.object.get-own-property-descriptors',
        'es.object.keys',
        'es.object.to-string',
        'web.dom-collections.for-each',
        'esnext.global-this',
        'esnext.string.match-all',
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate', // Auto-update service worker, install prompt handled by InstallPWA component
      // Enable service worker in production, disable in dev
      devOptions: {
        enabled: false,
        type: 'module',
      },
      // Enable service worker in production builds
      includeAssets: ['logo.svg', 'favicon.ico'],
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
        // Ensure service worker is generated
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
      manifest: {
        name: "What's 4 Dinner?",
        short_name: 'W4D',
        description: 'Smart recipe finder and meal planning app',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        categories: ['food', 'lifestyle', 'health'],
        shortcuts: [
          {
            name: 'Search Recipes',
            short_name: 'Search',
            description: 'Search for recipes',
            url: '/?shortcut=search',
            icons: [{ src: '/logo.svg', sizes: 'any' }],
          },
          {
            name: 'Meal Planner',
            short_name: 'Plan',
            description: 'Plan your meals',
            url: '/meal-planner',
            icons: [{ src: '/logo.svg', sizes: 'any' }],
          },
        ],
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
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'], // Support modern browsers
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        ecma: 2015, // Support ES2015
      },
      format: {
        ecma: 2015, // Support ES2015
      },
    },
    cssTarget: ['chrome87', 'safari14'], // CSS compatibility
    polyfillModulePreload: true, // Polyfill module preload
  },
  esbuild: {
    sourcemap: false, // Disable source maps in esbuild
    target: 'es2015', // Support older browsers
    legalComments: 'none', // Remove comments
  },
  define: {
    // Ensure global is defined for older browsers
    'global': 'globalThis',
  },
});
