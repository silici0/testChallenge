import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { When } = createBdd(test)

const panel = (page: Page) => page.getByRole('dialog', { name: 'Simulação (demonstração)' })

async function openPanel(page: Page) {
  await page.getByRole('button', { name: 'Mock: painel de simulação' }).click()
  await expect(panel(page)).toBeVisible()
}

/** Fecha e espera a animação de saída: antes disso o sheet ainda “existe” e intercepta cliques. */
async function closePanel(page: Page) {
  await page.keyboard.press('Escape')
  await expect(panel(page)).toBeHidden()
}

When('aplico o cenário {string} pelo painel', async ({ page }, scenario: string) => {
  await openPanel(page)
  await panel(page).getByRole('combobox', { name: 'Cenário' }).selectOption(scenario)
  await panel(page).getByRole('button', { name: 'Aplicar cenário' }).click()
  await expect(panel(page).getByRole('combobox', { name: 'Cenário' })).toContainText(`${scenario} (ativo)`)
  await closePanel(page)
})

When('reseto os dados pelo painel', async ({ page }) => {
  await openPanel(page)
  await panel(page).getByRole('button', { name: 'Resetar dados' }).click()
})

When('uso {string} no painel', async ({ page }, action: string) => {
  await openPanel(page)
  await panel(page).getByRole('button', { name: action }).click()
  await closePanel(page)
})
