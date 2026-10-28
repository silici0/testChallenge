import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { Given, When, Then } = createBdd(test)

/** Primeira navegação: aplica o cenário pendente pela URL e espera o app montar. */
async function openApp(page: Page, path: string, scenario: string | null) {
  const url = new URL(path, 'http://app')
  url.searchParams.set('reset', '1')
  if (scenario) url.searchParams.set('scenario', scenario)
  await page.goto(`${url.pathname}${url.search}${url.hash}`)
}

Given('que o cenário de simulação {string} está ativo', ({ world }, scenario: string) => {
  world.pendingScenario = scenario
})

Given('que acesso a página inicial', async ({ page, world }) => {
  await openApp(page, '/', world.pendingScenario)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

When('acesso a página inicial sem esperar os dados', async ({ page, world }) => {
  await openApp(page, '/', world.pendingScenario)
})

Given('que acesso a rota {string}', async ({ page, world }, path: string) => {
  await openApp(page, path, world.pendingScenario)
})

When('o cenário de simulação muda para {string}', async ({ mock }, scenario: string) => {
  await mock.setScenario(scenario)
})

When('recarrego a página', async ({ page }) => {
  await page.reload()
})

When('volto no histórico do navegador', async ({ page }) => {
  await page.goBack()
})

When('clico em {string}', async ({ page }, name: string) => {
  await page.getByRole('button', { name, exact: true }).click()
})

Then('vejo o título {string}', async ({ page }, title: string) => {
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
})

Then('vejo a mensagem {string}', async ({ page }, message: string) => {
  await expect(page.getByText(message).first()).toBeVisible()
})

Then('vejo o alerta {string}', async ({ page }, message: string) => {
  // A mesma mensagem pode estar na tela e na região aria-live: basta uma visível.
  await expect(page.getByRole('alert').filter({ hasText: message }).first()).toBeVisible()
})

Then('vejo o indicador {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible()
})

// Reconexão do Socket.IO com backoff (até 5 s + 50 % de aleatoriedade).
Then('depois vejo o indicador {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible({ timeout: 15_000 })
})

Then('vejo o indicador de carregamento {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('status').filter({ hasText: text })).toBeAttached()
})

Then('a URL contém {string}', async ({ page }, fragment: string) => {
  await expect(page).toHaveURL(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})

Then('a URL não contém {string}', async ({ page }, fragment: string) => {
  await expect(page).not.toHaveURL(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})

Then('a página não tem rolagem horizontal', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

/** UnavailableAction (enunciado §3): focável, `aria-disabled`, descrição “Indisponível na demonstração”, sem efeito. */
Then('as ações indisponíveis declaram a indisponibilidade e não fazem nada', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached()
  // Com um diálogo aberto, o resto da página é inerte: só as ações do diálogo estão disponíveis ao usuário.
  const dialog = page.getByRole('dialog')
  const scope = (await dialog.count()) > 0 ? dialog : page.locator('body')
  const actions = scope.locator('button[aria-disabled="true"]').filter({ visible: true })
  const unavailable = []
  for (const action of await actions.all()) {
    const description = await action.evaluate((element) =>
      (element.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent ?? '')
        .join(' '),
    )
    if (description.includes('Indisponível na demonstração')) unavailable.push(action)
  }
  expect(unavailable.length).toBeGreaterThan(0)

  const apiCalls: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiCalls.push(request.url())
  })
  const url = page.url()
  for (const action of unavailable) await action.click({ force: true })
  await page.waitForTimeout(300)
  expect(page.url()).toBe(url)
  expect(apiCalls).toEqual([])
})
