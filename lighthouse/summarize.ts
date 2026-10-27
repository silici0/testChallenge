/**
 * Lê os relatórios JSON do LHCI e gera docs/performance/reports/<data>/summary.md com a mediana
 * de cada categoria e de LCP, CLS e TBT por página e perfil, além de versões e ambiente (§10).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

interface LighthouseResult {
  requestedUrl: string
  lighthouseVersion: string
  fetchTime: string
  environment: { hostUserAgent: string; benchmarkIndex: number }
  configSettings: { formFactor: string; throttlingMethod: string }
  categories: Record<'performance' | 'accessibility' | 'best-practices' | 'seo', { score: number | null }>
  audits: Record<string, { numericValue?: number }>
}

const PROFILES = ['mobile', 'desktop'] as const
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const
const reportDate = process.env.LH_REPORT_DATE ?? new Date().toISOString().slice(0, 10)
const reportDir = path.join('docs/performance/reports', reportDate)

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? (sorted[middle] ?? Number.NaN) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}

const loadResults = (profile: string): LighthouseResult[] => {
  const dir = path.join(reportDir, profile)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith('.report.json'))
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), 'utf-8')) as LighthouseResult)
}

const groupByPage = (results: LighthouseResult[]) => {
  const groups = new Map<string, LighthouseResult[]>()
  for (const result of results) {
    const page = new URL(result.requestedUrl).pathname
    groups.set(page, [...(groups.get(page) ?? []), result])
  }
  return groups
}

const score = (runs: LighthouseResult[], category: (typeof CATEGORIES)[number]) =>
  Math.round(median(runs.map((run) => (run.categories[category].score ?? 0) * 100)))

const audit = (runs: LighthouseResult[], id: string) =>
  median(runs.map((run) => run.audits[id]?.numericValue ?? Number.NaN))

const rows: string[] = []
let sample: LighthouseResult | undefined
for (const profile of PROFILES) {
  for (const [page, runs] of groupByPage(loadResults(profile))) {
    sample ??= runs[0]
    const scores = CATEGORIES.map((category) => score(runs, category))
    const lcp = `${(audit(runs, 'largest-contentful-paint') / 1000).toFixed(2)} s`
    const cls = audit(runs, 'cumulative-layout-shift').toFixed(3)
    const tbt = `${Math.round(audit(runs, 'total-blocking-time'))} ms`
    rows.push(`| ${page} | ${profile} | ${runs.length} | ${scores.join(' | ')} | ${lcp} | ${cls} | ${tbt} |`)
  }
}

if (!sample) {
  console.error(`Nenhum relatório encontrado em ${reportDir}. Rode pnpm lighthouse:mobile e pnpm lighthouse:desktop.`)
  process.exit(1)
}

const markdown = `# Lighthouse — ${reportDate}

Mediana de ${PROFILES.length} perfis × páginas, 3 execuções cada. Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

| Página | Perfil | Execuções | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.join('\n')}

## Ambiente

| Item | Valor |
| --- | --- |
| Lighthouse | ${sample.lighthouseVersion} |
| Navegador | ${sample.environment.hostUserAgent} |
| Benchmark index | ${sample.environment.benchmarkIndex} |
| Throttling | ${sample.configSettings.throttlingMethod} |
| Node | ${process.version} |
| SO | ${os.type()} ${os.release()} (${os.arch()}) |
| CPU | ${os.cpus()[0]?.model ?? 'desconhecida'} × ${os.cpus().length} |
| RAM | ${Math.round(os.totalmem() / 1024 ** 3)} GB |
| Build | \`pnpm build\` com \`VITE_ENABLE_MOCKS=true\`, cenário \`default\`, servido por \`pnpm preview\` |
`

writeFileSync(path.join(reportDir, 'summary.md'), markdown)
console.log(`Resumo gravado em ${path.join(reportDir, 'summary.md')}`)
