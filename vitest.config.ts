import path from 'node:path'
import { unheadVueComposablesImports } from '@unhead/vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'
import { VueRouterAutoImports } from 'vue-router/unplugin'

export default defineConfig({
  plugins: [
    AutoImport({
      dts: false,
      imports: [
        'vue',
        '@vueuse/core',
        unheadVueComposablesImports,
        VueRouterAutoImports,
      ],
    }),
  ],
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
