/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: 'src/routes',
      generatedRouteTree: 'src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    svgr(),
  ],
  resolve: { alias: { '@': path.resolve(dirname, 'src') } },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Rotas e bootstrap são cobertos pelo E2E (Playwright); o dicionário de tokens é só documentação.
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.generated.ts',
        'src/routeTree.gen.ts',
        'src/mocks/**',
        'src/main.tsx',
        'src/app/**',
        'src/routes/**',
        'src/shared/design-tokens/token-dictionary.tsx',
      ],
      reporter: ['text-summary', 'html', 'lcov'],
      // Medida sobre unit + stories (pnpm test:coverage). Lógica pura exige mais.
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 85,
        lines: 85,
        'src/shared/lib/**': { statements: 95, branches: 95, functions: 95, lines: 95 },
        'src/shared/hooks/**': { statements: 95, branches: 90, functions: 95, lines: 95 },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.{ts,tsx}'],
          setupFiles: ['src/test/setup.ts'],
          restoreMocks: true,
        },
      },
      {
        // Integração no navegador real: MSW (service worker + interceptação de WebSocket) e socket.io-client.
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
})
