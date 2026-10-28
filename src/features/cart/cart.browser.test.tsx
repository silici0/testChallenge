import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { sessionStore } from '@/features/auth/session-store'
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

/** Carrinho de visitante com um item (antes de montar a página). */
async function openCartWithItem() {
  current = await renderApp('/cart')
  await fetch('/api/v1/cart/items', {
    method: 'POST',
    headers: { 'X-Guest-Cart-Id': sessionStore.getSnapshot().guestCartId, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nftId: 'nft_emerald-ape-042', editionId: 'ed_emerald-ape-042_aberta', quantity: 1 }),
  })
  await current.app.queryClient.invalidateQueries()
  return screen.findByRole('listitem', { name: 'Emerald Ape #042' }, { timeout: 5000 })
}

describe('Carrinho (app real + servidor simulado)', () => {
  it('quantidade com debounce atualiza o resumo pela API', async () => {
    const row = await openCartWithItem()
    await userEvent.click(within(row).getByRole('button', { name: 'Aumentar quantidade' }))
    await userEvent.click(within(row).getByRole('button', { name: 'Aumentar quantidade' }))
    expect(within(row).getByRole('spinbutton')).toHaveValue(3)
    expect(
      await screen.findByRole(
        'button',
        { name: 'Carrinho, 3 itens' },
        {
          timeout: 4000,
        },
      ),
    ).toBeInTheDocument()
  })

  it('cupons: erro no campo e desconto aplicado', async () => {
    await openCartWithItem()
    const field = screen.getByRole('textbox', { name: 'Código promocional' })
    await userEvent.type(field, 'EXPIRED20')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    await waitFor(() => expect(field).toHaveAccessibleDescription('Este cupom expirou'))
    await userEvent.clear(field)
    await userEvent.type(field, 'jungle10')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText('Desconto (JUNGLE10)')).toBeInTheDocument()
  })

  it('remover o último item mostra o carrinho vazio', async () => {
    await openCartWithItem()
    await userEvent.click(screen.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }))
    expect(await screen.findByText('Seu carrinho está vazio')).toBeInTheDocument()
    expect(await screen.findByText('Emerald Ape #042 removido do carrinho.')).toBeInTheDocument()
  })
})
