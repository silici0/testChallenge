import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { authApi } from '@/features/auth/api'
import { cartApi } from '@/features/cart/api'
import { renderApp, startMockServer, stopMockServer } from '@/test/app-harness'

const PASSWORD = 'Jungle#2026'
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

const results = () => screen.findByRole('list', { name: 'Resultados do catálogo' }, { timeout: 5000 })

describe('Início (app real + servidor simulado)', () => {
  it('carrega destaques e catálogo e filtra pela URL', async () => {
    current = await renderApp('/')
    expect(await screen.findByRole('heading', { level: 1, name: /seja dono do futuro/i })).toBeInTheDocument()
    const list = await results()
    expect(within(list).getByRole('link', { name: 'Emerald Ape #042' })).toHaveAttribute(
      'href',
      '/nfts/nft_emerald-ape-042',
    )

    const sidebar = screen.getByRole('complementary', { name: 'Filtros' })
    await userEvent.click(await within(sidebar).findByRole('checkbox', { name: /Música/ }))
    await waitFor(() => expect(current?.app.router.state.location.searchStr).toBe('?category=musica'))
  })

  it('visitante é levado ao login ao favoritar; header oferece “Entrar”', async () => {
    current = await renderApp('/')
    await results()
    expect(screen.getByRole('link', { name: 'Entre para favoritar Emerald Ape #042' })).toHaveAttribute(
      'href',
      expect.stringContaining('/login?redirect='),
    )
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('usuário autenticado favorita com atualização otimista e vê o carrinho no header', async () => {
    current = await renderApp('/')
    await current.app.session.signedIn(await authApi.login({ email: 'bruno@example.test', password: PASSWORD }))
    await cartApi.add({ nftId: 'nft_emerald-ape-042', editionId: 'ed_emerald-ape-042_aberta', quantity: 2 })
    await current.app.queryClient.invalidateQueries()

    expect(await screen.findByRole('link', { name: /Bruno Holder/ })).toHaveAttribute('href', '/account/profile')
    expect(await screen.findByRole('button', { name: 'Carrinho, 2 itens' })).toBeInTheDocument()

    const favorite = await screen.findByRole('button', { name: 'Favoritar Emerald Ape #042' })
    expect(favorite).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(favorite)
    expect(favorite).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText('Adicionado aos favoritos.')).toBeInTheDocument()
  })

  it('newsletter fora do escopo informa indisponibilidade em vez de simular sucesso', async () => {
    current = await renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar' }))
    expect(screen.getByText(/newsletter indisponível na demonstração/i)).toBeInTheDocument()
  })

  it('rota inexistente mostra a página de não encontrado', async () => {
    current = await renderApp('/nao-existe')
    expect(await screen.findByText('Página não encontrada.')).toBeInTheDocument()
  })
})
