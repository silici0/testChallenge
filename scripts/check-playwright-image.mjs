// Garante que a imagem Docker do Playwright na CI corresponde à versão instalada (evita baselines divergentes).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { version } = require('@playwright/test/package.json')
const workflow = readFileSync('.github/workflows/ci.yml', 'utf-8')
const images = [...workflow.matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-noble/g)].map((match) => match[1])

const mismatched = images.filter((imageVersion) => imageVersion !== version)
if (mismatched.length > 0) {
  console.error(`Imagem do Playwright na CI (${mismatched.join(', ')}) difere de @playwright/test ${version}.`)
  process.exit(1)
}
console.log(`Imagem do Playwright na CI alinhada com @playwright/test ${version}.`)
