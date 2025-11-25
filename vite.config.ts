import { defineConfig } from 'vite'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [pages()],
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      'pg-native': './pg-native-stub.js'
    }
  },
  ssr: {
    external: ['pg-native'],
    noExternal: ['pg']
  }
})
