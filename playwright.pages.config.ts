import { defineConfig, devices } from '@playwright/test'

const PORT = 4174

/** Regressão visual de página: app real (build de produção + servidor simulado) nos três viewports do Figma. */
export default defineConfig({
  testDir: 'tests/visual-pages',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report/visual-pages' }], ['list']],
  // Mesmo critério das stories: renderização no container, nenhum pixel divergente.
  expect: { toHaveScreenshot: { maxDiffPixels: 0, threshold: 0.2, animations: 'disabled' } },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { VITE_ENABLE_MOCKS: 'true' },
  },
})
