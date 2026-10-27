import { defineConfig, devices } from '@playwright/test'

const PORT = 6007

/** Regressão visual por componente: uma captura por story marcada com a tag `visual`. */
export default defineConfig({
  testDir: 'tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report/visual' }], ['list']],
  // Renderização determinística no container: nenhum pixel divergente é tolerado (só variação de cor por antialiasing).
  expect: { toHaveScreenshot: { maxDiffPixels: 0, threshold: 0.2, animations: 'disabled' } },
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'visual', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  webServer: {
    command: `pnpm storybook:build --quiet && pnpm exec vite preview --outDir storybook-static --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
