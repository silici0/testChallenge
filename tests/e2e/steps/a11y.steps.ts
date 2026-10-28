import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { When, Then } = createBdd(test)

/** Limite de Tabs para alcançar um controle: falha em vez de girar para sempre se ele não for focável. */
const MAX_TABS = 80

const isFocused = (page: Page, name: string) =>
  page
    .getByRole('button', { name, exact: true })
    .evaluateAll((elements) => elements.some((element) => element === document.activeElement))

When('pressiono {string}', async ({ page }, key: string) => {
  await page.keyboard.press(key)
})

When('ativo pelo teclado o botão {string}', async ({ page }, name: string) => {
  const button = page.getByRole('button', { name, exact: true })
  await expect(button.first()).toBeEnabled()
  for (let tabs = 0; !(await isFocused(page, name)); tabs++) {
    if (tabs === MAX_TABS) throw new Error(`"${name}" não foi alcançado com ${MAX_TABS} Tabs`)
    await page.keyboard.press('Tab')
  }
  await page.keyboard.press('Enter')
})

Then('a página não tem violações de acessibilidade', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Analisa o estado final: sem skeletons nem transições de entrada.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  // Animações infinitas (spinner) não podem ser finalizadas; só as de entrada importam para o contraste.
  await page.evaluate(() => {
    for (const animation of document.getAnimations())
      if (animation.effect?.getComputedTiming().endTime !== Infinity) animation.finish()
  })
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target.join(' ')) }))).toEqual([])
})

Then('o foco está no link {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('link', { name })).toBeFocused()
})

Then('o foco está no conteúdo principal', async ({ page }) => {
  await expect(page.getByRole('main')).toBeFocused()
})

// O formulário fica no diálogo (login/cadastro) ou no conteúdo; o rodapé tem outro campo “E-mail”.
async function formField(page: Page, label: string) {
  const dialog = page.getByRole('dialog')
  const scope = (await dialog.count()) > 0 ? dialog : page.getByRole('main')
  return scope.getByLabel(new RegExp(`^${label}\\*?$`))
}

Then('o foco está no campo {string}', async ({ page }, label: string) => {
  await expect(await formField(page, label)).toBeFocused()
})

Then('o campo {string} está marcado como inválido', async ({ page }, label: string) => {
  await expect(await formField(page, label)).toHaveAttribute('aria-invalid', 'true')
})

Then('a carteira fica conectada', async ({ page }) => {
  await expect(page.getByText('Conectada', { exact: true }).first()).toBeVisible()
})

Then('o foco permanece no diálogo ao navegar com Tab', async ({ page }) => {
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  for (let tabs = 0; tabs < 12; tabs++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  }
})

Then('o diálogo fecha e o foco volta ao botão {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('button', { name, exact: true })).toBeFocused()
})
