import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallback: 'index.html', // ← PWA redireciona para index em qualquer rota
        // As aulas animadas são páginas próprias (public/aulas-animadas): não trocar pelo app.
        navigateFallbackDenylist: [/^\/aulas-animadas\//],
        // Guarda tambem as fontes e imagens do proprio site (as aulas animadas usam a fonte Lexend):
        // assim elas abrem iguais mesmo sem internet.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
      },
      manifest: {
        name: 'Chronos Academy - História e Tecnologia',
        short_name: 'Chronos',
        description: 'Apoio Escolar e Conteúdo Didático',
        theme_color: '#e87c00',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})