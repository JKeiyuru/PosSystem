/* eslint-disable no-undef */
// client/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'Bekhal Animal Feeds POS',
        short_name: 'Bekhal POS',
        description: 'Point of Sale system for Bekhal Animal Feeds',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // Added: Increased from 2MB to 3MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // Added: Build configuration for better chunking
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Create separate chunks for better optimization
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-antd'
            }
            if (id.includes('jspdf') || id.includes('pdf')) {
              return 'vendor-pdf'
            }
            if (id.includes('chart') || id.includes('recharts')) {
              return 'vendor-charts'
            }
            // Group remaining node_modules
            return 'vendor-other'
          }
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000, // 1000KB = 1MB
  }
})