import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { Given, When, Then } = createBdd(test)

const EDITIONS: Record<string, { nft: string; edition: string }> = {
  'Emerald Ape #042': { nft: 'nft_emerald-ape-042', edition: 'ed_emerald-ape-042_aberta' },
}

const reviewDialog = (page: Page) => page.getByRole('dialog', { name: 'Revisar pedido' })

/** Pedidos do usuário logado, consultados na API simulada (resultado da operação, não detalhe da UI). */
async function orderCount(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/v1/orders', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth:token') ?? ''}` },
    })
    const body = (await response.json()) as { items: { id: string }[] }
    return body.items.filter((order) => !order.id.startsWith('ord_seed')).length
  })
}

Given('tenho {int} unidades de {string} no carrinho', async ({ page }, quantity: number, name: string) => {
  const target = EDITIONS[name]
  if (!target) throw new Error(`NFT sem edição configurada: ${name}`)
  await page.goto(`/nfts/${target.nft}?edition=${target.edition}`)
  const input = page.getByRole('spinbutton', { name: `Quantidade de ${name}` })
  await input.fill(String(quantity))
  await page.getByRole('button', { name: `Adicionar ${name} ao carrinho` }).click()
  await expect(
    page.getByRole('banner').getByRole('button', { name: new RegExp(`Carrinho, ${quantity} ite`) }),
  ).toBeVisible()
})

When('vou para o pagamento', async ({ page }) => {
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { level: 1, name: 'Pagamento' })).toBeVisible()
})

When('conecto a carteira', async ({ page }) => {
  await page.getByRole('button', { name: /^Conectar / }).click()
  await expect(page.getByText('Conectada', { exact: true }).first()).toBeVisible()
})

When('reviso o pedido', async ({ page }) => {
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(reviewDialog(page)).toBeVisible()
})

When('confirmo a compra', async ({ page }) => {
  await reviewDialog(page).getByRole('button', { name: 'Confirmar compra' }).click()
})

When('concluo a compra', async ({ page }) => {
  await page.goto('/checkout')
  await page.getByRole('button', { name: /^Conectar / }).click()
  await expect(page.getByText('Conectada', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await reviewDialog(page).getByRole('button', { name: 'Confirmar compra' }).click()
})

When('clico em {string} {int} vezes rapidamente', async ({ page }, name: string, times: number) => {
  const button = reviewDialog(page).getByRole('button', { name })
  // Após o 1º clique o botão fica ocupado e a página navega: os demais cliques podem não encontrar alvo.
  for (let index = 0; index < times; index++)
    await button.click({ force: true, noWaitAfter: true, timeout: 500 }).catch(() => undefined)
})

Then('vejo o pedido aguardando confirmação', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Aguardando confirmação da rede' })).toBeVisible({ timeout: 20_000 })
})

Then('depois vejo o pedido aguardando confirmação', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /Aguardando confirmação da rede|Seus NFTs agora estão na sua carteira/ }),
  ).toBeVisible({ timeout: 25_000 })
})

Then('depois vejo o recibo confirmado com {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
    timeout: 25_000,
  })
  await expect(page.getByRole('list', { name: 'Itens comprados' })).toContainText(name)
})

Then('depois vejo a mensagem {string}', async ({ page }, message: string) => {
  await expect(page.getByText(message).first()).toBeVisible({ timeout: 25_000 })
})

Then('existe exatamente {int} pedido novo', async ({ page }, count: number) => {
  await expect.poll(() => orderCount(page), { timeout: 20_000 }).toBe(count)
})

Then('a confirmação está bloqueada', async ({ page }) => {
  await expect(reviewDialog(page).getByRole('button', { name: 'Confirmar compra' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
})

let receiptTotal = ''
When('guardo o total do recibo', async ({ page }) => {
  receiptTotal =
    (await page.locator('dl').filter({ hasText: 'Taxa de rede' }).locator('data').last().getAttribute('value')) ?? ''
  expect(receiptTotal).not.toBe('')
})

Then('o total do recibo é o mesmo', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.locator('dl').filter({ hasText: 'Taxa de rede' }).locator('data').last()).toHaveAttribute(
    'value',
    receiptTotal,
  )
})

Then('o preço unitário de {string} se mantém em {string} ETH', async ({ page }, name: string, price: string) => {
  const unit = page.getByRole('listitem', { name }).locator('data').first()
  await expect(unit).toHaveAttribute('value', price)
  // O evento antigo é reenviado ~500 ms depois: o preço não pode regredir.
  await page.waitForTimeout(1500)
  await expect(unit).toHaveAttribute('value', price)
})
