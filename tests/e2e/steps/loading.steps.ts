import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { Given, When, Then } = createBdd(test)

Given('que prefiro movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

When('o conteúdo termina de carregar', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 })
})

Then('depois vejo o título {string}', async ({ page }, title: string) => {
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible({ timeout: 15_000 })
})

Then('o deslocamento acumulado de layout é menor que {float}', async ({ page }, limit: number) => {
  // CLS como o Lighthouse: soma dos layout-shift sem interação recente do usuário (buffered desde a navegação).
  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[])
            if (!entry.hadRecentInput) total += entry.value
        }).observe({ type: 'layout-shift', buffered: true })
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(total)))
      }),
  )
  expect(cls).toBeLessThan(limit)
})

Then('os skeletons estão estáticos', async ({ page }) => {
  const skeletons = page.locator('[data-slot="skeleton"]')
  await expect(skeletons.first()).toBeAttached()
  const animations = await skeletons.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).animationName),
  )
  expect(animations.every((name) => name === 'none')).toBe(true)
})
