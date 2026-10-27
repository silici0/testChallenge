// Configuração comum da auditoria (enunciado §10, ADR-0015).
const { chromium } = require('@playwright/test')

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

/** Páginas auditadas. O detalhe usa um NFT fixo das fixtures (cenário `default`). */
const PAGES = ['/', '/nfts/nft_emerald-ape-042']

const reportDate = process.env.LH_REPORT_DATE ?? new Date().toISOString().slice(0, 10)

/** Metas do enunciado como `warn`: resultados abaixo devem ser reportados e justificados, não escondidos. */
const assertions = {
  'categories:performance': ['warn', { minScore: 0.9, aggregationMethod: 'median-run' }],
  'categories:accessibility': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
  'categories:best-practices': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
  'categories:seo': ['warn', { minScore: 0.9, aggregationMethod: 'median-run' }],
}

/** @param {'mobile' | 'desktop'} profile */
function createConfig(profile, settings = {}) {
  return {
    ci: {
      collect: {
        startServerCommand: `pnpm preview --port ${PORT} --strictPort`,
        startServerReadyPattern: 'Local',
        url: PAGES.map((page) => `${BASE_URL}${page}`),
        numberOfRuns: 3,
        chromePath: chromium.executablePath(),
        settings: { chromeFlags: '--headless=new --no-sandbox', ...settings },
      },
      assert: { assertions },
      upload: {
        target: 'filesystem',
        outputDir: `docs/performance/reports/${reportDate}/${profile}`,
        reportFilenamePattern: 'page_%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
      },
    },
  }
}

module.exports = { createConfig, reportDate }
