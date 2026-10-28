import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

import { test } from './fixtures'

const { Given, When, Then } = createBdd(test)
const PASSWORD = 'Jungle#2026'
const dialog = (page: Page) => page.getByRole('dialog')
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Campo pelo rótulo (o “*” de obrigatório é visual), dentro do diálogo aberto ou do conteúdo principal. */
async function field(page: Page, label: string) {
  const scope = (await dialog(page).isVisible()) ? dialog(page) : page.locator('#conteudo')
  return scope.getByLabel(new RegExp(`^${escape(label)}\\*?$`))
}

async function submitLogin(page: Page, email: string, password: string) {
  await dialog(page).getByLabel('E-mail').fill(email)
  await dialog(page).getByLabel('Senha', { exact: true }).fill(password)
  await dialog(page).getByRole('button', { name: 'Entrar', exact: true }).click()
}

Given('que estou autenticado como {string}', async ({ page }, email: string) => {
  await page.goto('/login?reset=1')
  await submitLogin(page, email, PASSWORD)
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeHidden()
})

When('navego para {string}', async ({ page }, path: string) => {
  await page.goto(path)
})

When('entro com {string} e senha {string}', async ({ page }, email: string, password: string) => {
  await submitLogin(page, email, password)
})

When('entro pela página de login com {string} e senha {string}', async ({ page }, email: string, password: string) => {
  await page.goto('/login')
  await submitLogin(page, email, password)
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeHidden()
})

When(
  'envio o cadastro com usuário {string}, e-mail {string} e senha {string}',
  async ({ page }, username: string, email: string, password: string) => {
    const form = dialog(page)
    await form.getByLabel('Nome de usuário').fill(username)
    await form.getByLabel('E-mail').fill(email)
    await form.getByLabel('Senha', { exact: true }).fill(password)
    await form.getByLabel('Confirmar senha').fill(password)
    await form.getByRole('button', { name: 'Criar conta', exact: true }).click()
  },
)

Then('estou na tela de login', async ({ page }) => {
  await expect(page.getByRole('dialog', { name: 'Entrar na Kurio' })).toBeVisible()
})

Then('estou autenticado como {string}', async ({ page }, name: string) => {
  // No desktop o nome aparece no cabeçalho; no mobile, “Entrar” some do cabeçalho.
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeHidden()
  if ((page.viewportSize()?.width ?? 1440) >= 1024)
    await expect(page.getByRole('banner').getByRole('link', { name })).toBeVisible()
})

Then('vejo o botão de entrar no cabeçalho', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
})

When('saio da conta', async ({ page }) => {
  await page.getByRole('navigation', { name: 'Minha conta' }).getByRole('button', { name: 'Sair' }).click()
})

Then('o campo {string} mostra o erro {string}', async ({ page }, label: string, message: string) => {
  await expect(await field(page, label)).toHaveAccessibleDescription(new RegExp(escape(message)))
})

Then('o campo {string} contém {string}', async ({ page }, label: string, value: string) => {
  await expect(await field(page, label)).toHaveValue(value)
})

When('preencho {string} com {string}', async ({ page }, label: string, value: string) => {
  await (await field(page, label)).fill(value)
})

Then('vejo o anúncio {string}', async ({ page }, message: string) => {
  await expect(page.getByRole('status').filter({ hasText: message }).first()).toBeAttached()
})

Then('vejo {int} NFTs na lista de interesse', async ({ page }, count: number) => {
  await expect(page.getByRole('list', { name: 'Resultados do catálogo' }).getByRole('listitem')).toHaveCount(count)
})

When('envio o avatar {string} como PNG', async ({ page }, _path: string) => {
  // PNG 1x1 válido gerado em memória (o mock valida tipo e tamanho).
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )
  await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png })
})

Then('vejo a imagem {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('img', { name })).toBeVisible()
})

When('favorito o NFT {string}', async ({ page }, name: string) => {
  await page.getByRole('button', { name: `Favoritar ${name}` }).click()
})

Then('o NFT {string} aparece como favorito', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name: `Favoritar ${name}` })).toHaveAttribute('aria-pressed', 'true')
})

Then('o NFT {string} não aparece como favorito', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name: `Favoritar ${name}` })).toHaveAttribute('aria-pressed', 'false')
})
