import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { Given, Then } = createBdd(test)

Given('que acesso a página inicial', async ({ page }) => {
  await page.goto('/')
})

Given('que acesso a rota {string}', async ({ page }, path: string) => {
  await page.goto(path)
})

Then('vejo o título {string}', async ({ page }, title: string) => {
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
})

Then('vejo a mensagem {string}', async ({ page }, message: string) => {
  await expect(page.getByText(message)).toBeVisible()
})

Then('a página não tem rolagem horizontal', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})
