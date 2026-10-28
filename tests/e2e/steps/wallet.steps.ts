import { expect, type Locator, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { When, Then } = createBdd(test)

/** Escolhe a opção pelo teclado (foco + Enter): estável também no mobile emulado com toque. */
async function chooseOption(page: Page, combobox: Locator, option: string) {
  await combobox.click()
  const item = page.getByRole('option', { name: option })
  await item.focus()
  await page.keyboard.press('Enter')
  await expect(combobox).toHaveText(new RegExp(option))
}

When(
  'adiciono a carteira secundária {string} na rede {string} com o endereço {string}',
  async ({ page }, name: string, network: string, address: string) => {
    const section = page.getByRole('region', { name: 'Carteira secundária' })
    await section.getByRole('button', { name: 'Adicionar', exact: true }).click()
    await section.getByLabel(/^Nome de exibição\*?$/).fill(name)
    await chooseOption(page, section.getByRole('combobox', { name: /Rede/ }), network)
    await chooseOption(page, section.getByRole('combobox', { name: /Tipo de carteira/ }), 'WalletConnect')
    await section.getByLabel(/^Endereço da carteira\*?$/).fill(address)
    await section.getByRole('button', { name: 'Adicionar carteira' }).click()
  },
)

Then('a seção {string} mostra o endereço {string}', async ({ page }, title: string, address: string) => {
  await expect(page.getByRole('region', { name: title }).getByLabel(/^Endereço da carteira\*?$/)).toHaveValue(address)
})
