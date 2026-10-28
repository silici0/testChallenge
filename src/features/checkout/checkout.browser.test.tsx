import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { authApi } from '@/features/auth/api'
import { cartApi } from '@/features/cart/api'
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
  sessionStorage.clear()
})

const control = (path: string, body: unknown, method = 'POST') => fetch(path, { method, body: JSON.stringify(body) })

async function checkoutWithItem({ scenario }: { scenario?: string } = {}) {
  current = await renderApp('/')
  if (scenario) await control('/__mock/scenario', { id: scenario }, 'PUT')
  await current.app.session.signedIn(await authApi.login({ email: 'ana@example.test', password: 'Jungle#2026' }))
  await cartApi.add({ nftId: 'nft_emerald-ape-042', editionId: 'ed_emerald-ape-042_aberta', quantity: 1 })
  await current.app.queryClient.invalidateQueries()
  await current.app.router.navigate({ to: '/checkout' })
  return screen.findByRole('heading', { level: 1, name: 'Pagamento' }, { timeout: 5000 })
}

describe('Pagamento (app real + servidor simulado)', () => {
  it('fluxo completo: conectar, revisar, confirmar e ver o recibo após a confirmação', async () => {
    await checkoutWithItem()
    await userEvent.click(await screen.findByRole('button', { name: 'Conectar MetaMask' }, { timeout: 5000 }))
    expect(await screen.findByText('Conectada')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }))
    const review = await screen.findByRole('dialog', { name: 'Revisar pedido' })
    expect(within(review).getByText(/Ana Collector/)).toBeInTheDocument()
    await userEvent.click(within(review).getByRole('button', { name: 'Confirmar compra' }))

    expect(
      await screen.findByRole('heading', { name: 'Aguardando confirmação da rede' }, { timeout: 5000 }),
    ).toBeInTheDocument()
    const orderId = current?.app.router.state.location.pathname.split('/').pop() ?? ''
    await control(`/__mock/orders/${orderId}/resolve`, { status: 'confirmed' })
    expect(
      await screen.findByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(sessionStorage.getItem('checkout:attempt')).toBeNull()
  })

  it('revisão exige carteira conectada', async () => {
    await checkoutWithItem()
    await screen.findByRole('button', { name: 'Conectar MetaMask' }, { timeout: 5000 })
    await userEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }))
    expect(await screen.findByText('Conecte uma carteira para continuar.')).toBeInTheDocument()
  })

  it('conexão recusada pela carteira (simulada)', async () => {
    await checkoutWithItem({ scenario: 'wallet-rejected' })
    await userEvent.click(await screen.findByRole('button', { name: 'Conectar MetaMask' }, { timeout: 5000 }))
    expect(await screen.findByText(/A conexão foi recusada na carteira/)).toBeInTheDocument()
  })

  it('tentativa interrompida pode ser retomada com a mesma chave', async () => {
    await checkoutWithItem()
    sessionStorage.setItem(
      'checkout:attempt',
      JSON.stringify({
        idempotencyKey: '00000000-0000-4000-8000-000000000001',
        body: {
          quoteId: 'qt_inexistente',
          walletId: 'wal_ana-primary',
          network: 'ethereum',
          buyer: {
            displayName: 'Ana',
            username: 'ana.collector',
            email: 'ana@example.test',
            referralCode: null,
            note: null,
          },
        },
        orderId: null,
      }),
    )
    await current?.app.router.navigate({ to: '/cart' })
    await current?.app.router.navigate({ to: '/checkout' })
    expect(
      await screen.findByText('Você tem um pedido em andamento que não foi concluído.', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('carrinho vazio não permite finalizar', async () => {
    current = await renderApp('/')
    await current.app.session.signedIn(await authApi.login({ email: 'bruno@example.test', password: 'Jungle#2026' }))
    await current.app.router.navigate({ to: '/checkout' })
    expect(await screen.findByText('Seu carrinho está vazio', {}, { timeout: 5000 })).toBeInTheDocument()
  })
})
