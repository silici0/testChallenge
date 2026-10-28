import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { renderApp, startMockServer, stopMockServer } from '@/test/app-harness'

const NFT = 'nft_emerald-ape-042'
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

const control = (path: string, body: unknown) => fetch(path, { method: 'POST', body: JSON.stringify(body) })

describe('Detalhe do NFT (app real + servidor simulado)', () => {
  it('adiciona ao carrinho pela edição escolhida e atualiza o contador do header', async () => {
    current = await renderApp(`/nfts/${NFT}`)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' }, { timeout: 5000 }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByText('Aberta', { selector: 'label' }))
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' }))
    expect(await screen.findByRole('button', { name: 'Carrinho, 2 itens' })).toBeInTheDocument()
    expect(await screen.findByText('Item adicionado ao carrinho.')).toBeInTheDocument()
  })

  it('preço alterado no servidor chega via Socket.IO e atualiza a tela', async () => {
    current = await renderApp(`/nfts/${NFT}?edition=ed_emerald-ape-042_aberta`)
    await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' }, { timeout: 5000 })
    await screen.findByText('Tempo real conectado', {}, { timeout: 5000 })
    await control(`/__mock/nfts/${NFT}`, { editionId: 'ed_emerald-ape-042_aberta', priceEth: '0.123' })
    // Preço no cabeçalho e na barra de compra (mobile), ambos vindos do cache atualizado pelo evento.
    expect((await screen.findAllByText('0.123 ETH', {}, { timeout: 5000 })).length).toBeGreaterThan(0)
  })

  it('mostra o erro de disponibilidade da API', async () => {
    current = await renderApp(`/nfts/${NFT}?edition=ed_emerald-ape-042_aberta`)
    await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' }, { timeout: 5000 })
    await control(`/__mock/nfts/${NFT}`, { editionId: 'ed_emerald-ape-042_aberta', available: 1 })
    const addButton = screen.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' })
    await userEvent.click(addButton)
    await screen.findByRole('button', { name: 'Carrinho, 1 item' })
    await userEvent.click(addButton) // 2 > 1 disponível: a API recusa com 409
    expect(await screen.findByText('Disponível: até 1 por pedido', {}, { timeout: 4000 })).toBeInTheDocument()
  })

  it('NFT inexistente', async () => {
    current = await renderApp('/nfts/nao-existe')
    expect(await screen.findByText('NFT não encontrado', {}, { timeout: 5000 })).toBeInTheDocument()
  })
})
