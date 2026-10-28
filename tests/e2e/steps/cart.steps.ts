import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { When, Then } = createBdd(test)

const line = (page: Page, name: string) => page.getByRole('listitem', { name })
const ethOf = async (locator: ReturnType<Page['locator']>) =>
  Number(await locator.locator('data').last().getAttribute('value'))

When('defino a quantidade de {string} para {int}', async ({ page }, name: string, quantity: number) => {
  const input = line(page, name).getByRole('spinbutton')
  await input.fill(String(quantity))
  // A API recebe a quantidade após o debounce (400 ms); os passos seguintes aguardam o total recalculado.
})

Then('a quantidade de {string} é {int}', async ({ page }, name: string, quantity: number) => {
  await expect(line(page, name).getByRole('spinbutton')).toHaveValue(String(quantity))
})

Then('o total de {string} corresponde a {int} unidades', async ({ page }, name: string, quantity: number) => {
  const row = line(page, name)
  await expect
    .poll(async () => {
      const values = await row
        .locator('data')
        .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('value'))))
      const unit = values[0] ?? 0
      const total = values.at(-1) ?? 0
      return Math.abs(total - unit * quantity) < 1e-9
    })
    .toBe(true)
})

Then('o resumo mostra subtotal igual à soma das linhas', async ({ page }) => {
  await expect
    .poll(
      async () => {
        const lineTotals = await page
          .getByRole('listitem')
          .filter({ has: page.getByRole('spinbutton') })
          .evaluateAll((rows) =>
            rows.map((row) => Number([...row.querySelectorAll('data')].at(-1)?.getAttribute('value') ?? 0)),
          )
        const summary = page.getByLabel('Resumo do pedido')
        const subtotal = await ethOf(summary.getByRole('definition').first())
        return Math.abs(subtotal - lineTotals.reduce((sum, value) => sum + value, 0)) < 1e-9
      },
      { timeout: 5000 },
    )
    .toBe(true)
})

When('removo {string} do carrinho', async ({ page }, name: string) => {
  await page.getByRole('button', { name: `Remover ${name} do carrinho` }).click()
})

When('aplico o cupom {string}', async ({ page }, code: string) => {
  const field = page.getByRole('textbox', { name: 'Código promocional' })
  await field.fill(code)
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
})

Then('o campo de cupom mostra o erro {string}', async ({ page }, message: string) => {
  await expect(page.getByRole('textbox', { name: 'Código promocional' })).toHaveAccessibleDescription(message)
})

When(
  'o preço da edição {string} do NFT {string} muda para {string}',
  async ({ page, mock }, editionId: string, nftId: string, priceEth: string) => {
    await expect(page.getByText('Tempo real conectado')).toBeVisible()
    await mock.updateNft(nftId, { editionId, priceEth })
  },
)

Then('vejo o item {string} no carrinho', async ({ page }, name: string) => {
  await expect(line(page, name)).toBeVisible()
})
