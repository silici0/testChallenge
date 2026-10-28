import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { When, Then } = createBdd(test)

/** O catálogo da Início (grid de cards). */
const catalog = (page: Page) => page.locator('#catalogo')
const results = (page: Page) => page.getByRole('list', { name: 'Resultados do catálogo' })
const cardLinks = (page: Page) => results(page).getByRole('heading', { level: 3 }).getByRole('link')
const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024

/** No mobile os filtros ficam no drawer; no desktop, na barra lateral. */
async function filterGroup(page: Page, group: string) {
  if (isMobile(page)) {
    const dialog = page.getByRole('dialog', { name: 'Filtros' })
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    await expect(dialog).toBeVisible()
    return dialog.getByRole('group', { name: group })
  }
  return page.getByRole('complementary', { name: 'Filtros' }).getByRole('group', { name: group })
}

async function closeDrawer(page: Page) {
  if (!isMobile(page)) return
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeHidden()
}

When('marco o filtro {string} em {string}', async ({ page }, option: string, group: string) => {
  await (await filterGroup(page, group)).getByRole('checkbox', { name: new RegExp(option) }).check()
  await closeDrawer(page)
})

Then('o filtro {string} em {string} está marcado', async ({ page }, option: string, group: string) => {
  await expect((await filterGroup(page, group)).getByRole('checkbox', { name: new RegExp(option) })).toBeChecked()
  await closeDrawer(page)
})

When('vou para a página {int} do catálogo', async ({ page }, number: number) => {
  await page
    .getByRole('navigation', { name: 'Paginação' })
    .getByRole('link', { name: `Página ${number}`, exact: true })
    .click()
  await expect(page).toHaveURL(new RegExp(`page=${number}`))
})

Then('a página atual do catálogo é {int}', async ({ page }, number: number) => {
  await expect(
    page.getByRole('navigation', { name: 'Paginação' }).getByRole('link', { name: `Página ${number}`, exact: true }),
  ).toHaveAttribute('aria-current', 'page')
})

When('ordeno por {string}', async ({ page }, label: string) => {
  await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
  await page.getByRole('option', { name: label }).click()
})

When('busco por {string}', async ({ page }, term: string) => {
  const field = catalog(page).getByRole('searchbox')
  if (await field.isVisible()) {
    await field.fill(term)
    await field.press('Enter')
    return
  }
  const headerField = page.locator('#header-search')
  if (!(await headerField.isVisible())) await page.getByRole('button', { name: 'Buscar' }).click()
  const header = page.locator('#header-search').getByRole('searchbox')
  await header.fill(term)
  await header.press('Enter')
})

Then('vejo o NFT {string} no catálogo', async ({ page }, name: string) => {
  await expect(cardLinks(page).filter({ hasText: name })).toBeVisible()
})

Then('depois vejo o NFT {string} no catálogo', async ({ page }, name: string) => {
  await expect(cardLinks(page).filter({ hasText: name })).toBeVisible({ timeout: 15_000 })
})

Then('todos os cards exibidos pertencem ao catálogo filtrado', async ({ page }) => {
  await expect(results(page)).not.toHaveAttribute('aria-busy', 'true')
  expect(await cardLinks(page).count()).toBeGreaterThan(0)
  await expect(page.getByText(/Filtros: .*Música.*polygon/)).toBeVisible()
})

const visiblePrices = async (page: Page) => {
  await expect(results(page)).not.toHaveAttribute('aria-busy', 'true')
  return catalog(page)
    .locator('data')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('value'))))
}

Then('os preços estão em ordem crescente', async ({ page }) => {
  await expect
    .poll(async () => {
      const prices = await visiblePrices(page)
      return prices.length > 0 && prices.every((price, index) => index === 0 || price >= (prices[index - 1] ?? 0))
    })
    .toBe(true)
})

Then('os nomes estão em ordem alfabética', async ({ page }) => {
  await expect
    .poll(
      async () => {
        await expect(results(page)).not.toHaveAttribute('aria-busy', 'true')
        const names = await cardLinks(page).allTextContents()
        return (
          names.length > 0 &&
          names.every((name, index) => index === 0 || name.localeCompare(names[index - 1] ?? '', 'pt-BR') >= 0)
        )
      },
      { timeout: 10_000 },
    )
    .toBe(true)
})
