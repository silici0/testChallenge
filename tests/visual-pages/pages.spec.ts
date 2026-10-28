import { expect, type Page, test } from '@playwright/test'

/** Credencial do seed do servidor simulado (src/mocks/db/seed). */
const PASSWORD = 'Jungle#2026'
/** Datas relativas e cotações dependem do relógio: fixo para capturas reprodutíveis. */
const FIXED_NOW = new Date('2026-10-27T15:00:00-03:00')

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(FIXED_NOW)
})

/** Estado final da tela: dados carregados, imagens decodificadas, sem foco nem animação. */
async function settle(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await expect(page.locator('[data-realtime-status]')).toHaveAttribute('data-realtime-status', 'connected')
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await document.fonts.ready
    // Captura de página inteira: imagens lazy fora da viewport precisam carregar antes (senão decode() não resolve).
    for (const image of document.images) image.loading = 'eager'
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
  })
}

async function signIn(page: Page) {
  await page.goto('/login?reset=1')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill('ana@example.test')
  await dialog.getByLabel('Senha', { exact: true }).fill(PASSWORD)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeHidden()
}

async function addToCart(page: Page) {
  await page.goto('/nfts/nft_emerald-ape-042?edition=ed_emerald-ape-042_aberta')
  await page.getByRole('spinbutton', { name: 'Quantidade de Emerald Ape #042' }).fill('2')
  await page.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' }).click()
  await expect(page.getByRole('banner').getByRole('button', { name: /Carrinho, 2 itens/ })).toBeVisible()
}

test('Início', async ({ page }) => {
  await page.goto('/?reset=1')
  await settle(page)
  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
})

test('Detalhe do NFT', async ({ page }) => {
  await page.goto('/nfts/nft_emerald-ape-042?reset=1')
  await settle(page)
  await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
})

test('Carrinho', async ({ page }) => {
  await page.goto('/?reset=1')
  await addToCart(page)
  await page.goto('/cart')
  await settle(page)
  await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
})

test('Pagamento', async ({ page }) => {
  await signIn(page)
  await addToCart(page)
  await page.goto('/checkout')
  await settle(page)
  await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
})
