import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { authApi } from '@/features/auth/api'
import { renderApp, startMockServer, stopMockServer } from '@/test/app-harness'

let current: Awaited<ReturnType<typeof renderApp>> | null = null

beforeAll(async () => {
  await startMockServer()
})
afterAll(() => {
  stopMockServer()
})
afterEach(() => {
  current?.unmount()
  current = null
})

describe('Carteiras (app real + servidor simulado)', () => {
  it('edita a principal e cadastra a secundária copiando os dados', async () => {
    current = await renderApp('/')
    await current.app.session.signedIn(await authApi.login({ email: 'bruno@example.test', password: 'Jungle#2026' }))
    await current.app.router.navigate({ to: '/account/wallets' })

    const primary = await screen.findByRole('region', { name: /Carteira principal/ }, { timeout: 5000 })
    const nickname = within(primary).getByLabelText('Apelido da carteira')
    await userEvent.type(nickname, 'Cofre')
    await userEvent.click(within(primary).getByRole('button', { name: 'Salvar carteira' }))
    expect(await within(primary).findByText('Carteira salva.')).toBeInTheDocument()

    const secondary = screen.getByRole('region', { name: 'Carteira secundária' })
    expect(within(secondary).getByText('Você ainda não adicionou uma carteira secundária.')).toBeInTheDocument()
    await userEvent.click(within(secondary).getByRole('button', { name: 'Adicionar' }))
    await userEvent.click(within(secondary).getByRole('checkbox', { name: /Igual à carteira principal/ }))
    expect(within(secondary).getByLabelText(/Nome de exibição/)).toHaveValue('Reserva')
    await userEvent.click(within(secondary).getByRole('button', { name: 'Adicionar carteira' }))
    expect(await within(secondary).findByText('Desconectada')).toBeInTheDocument()
  })
})
