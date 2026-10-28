import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { When, Then } = createBdd(test)

const edition = (page: Page, label: string) =>
  page.getByRole('group', { name: 'Edição:' }).getByRole('radio', { name: new RegExp(`^${label.replace('/', '\\/')}`) })

When(
  'a edição {string} do NFT {string} fica com {int} unidades',
  async ({ mock }, editionId: string, nftId: string, available: number) => {
    await mock.updateNft(nftId, { editionId, available })
  },
)

When('seleciono a edição {string}', async ({ page }, label: string) => {
  // O rádio nativo é visualmente oculto; o usuário clica no rótulo (“pílula”).
  await page
    .getByRole('group', { name: 'Edição:' })
    .locator('label', { hasText: new RegExp(`^${label.replace('/', '\\/')}$`) })
    .click()
  await expect(edition(page, label)).toBeChecked()
})

Then('a edição {string} está selecionada', async ({ page }, label: string) => {
  await expect(edition(page, label)).toBeChecked()
})

Then('a edição {string} está desabilitada como esgotada', async ({ page }, label: string) => {
  // O evento nft.updated chega pelo Socket.IO e atualiza o cache do detalhe.
  await expect(page.getByRole('radio', { name: new RegExp(`${label.replace('/', '\\/')}.*esgotada`) })).toBeDisabled()
})

When('aumento a quantidade {int} vezes', async ({ page }, times: number) => {
  for (let index = 0; index < times; index++) {
    const button = page.getByRole('button', { name: 'Aumentar quantidade' })
    if (await button.isEnabled()) await button.click()
  }
})

Then('a quantidade é {int}', async ({ page }, quantity: number) => {
  await expect(page.getByRole('spinbutton', { name: /Quantidade de/ })).toHaveValue(String(quantity))
})

Then('não consigo aumentar mais a quantidade', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
})
