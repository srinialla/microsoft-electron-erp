import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'favicon.ico'],
      manifest: {
        name: 'Fluent ERP',
        short_name: 'Fluent ERP',
        description: 'Modern ERP System with Microsoft Office-style interface',
        theme_color: '#0078d4',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Increase file size limit to accommodate large bundles (15.8 MB bundle)
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB
        // Exclude large JS bundles from precaching, use runtime caching instead
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Cache large JS bundles at runtime instead of precaching
          {
            urlPattern: /\.js$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  root: 'src/renderer',
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    // Let Vite handle automatic code splitting to avoid circular dependency issues
    // Manual chunks removed to prevent "Cannot access 'gc' before initialization" errors
    rollupOptions: {
      output: {
        // Use automatic code splitting - Vite will handle chunking intelligently
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit to accommodate large bundles
    chunkSizeWarningLimit: 2000, // 2 MB (larger chunks are acceptable for this app)
    // Ensure proper module order and transformation
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['scheduler'],
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@preload': path.resolve(__dirname, 'src/preload'),
      '@': path.resolve(__dirname, 'src/renderer'),
      '@components': path.resolve(__dirname, 'src/renderer/components'),
      '@ui': path.resolve(__dirname, 'src/renderer/components/ui'),
      '@hooks': path.resolve(__dirname, 'src/renderer/hooks'),
      '@services': path.resolve(__dirname, 'src/renderer/services'),
      '@utils': path.resolve(__dirname, 'src/renderer/utils'),
      '@types': path.resolve(__dirname, 'src/renderer/types'),
      '@config': path.resolve(__dirname, 'src/renderer/config'),
      '@store': path.resolve(__dirname, 'src/renderer/store'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}));
