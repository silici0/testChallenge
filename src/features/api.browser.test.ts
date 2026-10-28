import { QueryClient } from '@tanstack/react-query'
import { setupWorker } from 'msw/browser'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { nftListParamsSchema } from '@/contracts'
import { createMockServer } from '@/mocks/server'
import { configureHttpClient, createHttpClient } from '@/shared/api'

import { authApi, sessionQuery } from './auth/api'
import { sessionStore } from './auth/session-store'
import { cartApi, cartQuery } from './cart/api'
import { facetsQuery, featuredQuery, nftListQuery } from './catalog/api'
import { checkoutApi, quoteQuery } from './checkout/api'
import { favoritesApi, favoritesQuery } from './favorites/api'
import { nftDetailQuery } from './nft/api'
import { orderQuery, pendingOrdersQuery } from './orders/api'
import { profileApi, profileQuery } from './profile/api'
import { walletsApi, walletsQuery } from './wallets/api'

/**
 * Teste de contrato: cada função de API das features contra o servidor simulado real (MSW).
 * Garante que transporte, contratos Zod e handlers concordam.
 */
const EMERALD = 'nft_emerald-ape-042'
const EDITION = 'ed_emerald-ape-042_aberta'
const PASSWORD = 'Jungle#2026'
let worker: ReturnType<typeof setupWorker>
let queryClient: QueryClient

beforeAll(async () => {
  const server = await createMockServer({
    apiBase: '/api/v1',
    requestTimeoutMs: 3000,
    socketUrl: location.origin,
    storage: null,
    defaultScenario: 'default',
  })
  worker = setupWorker(...server.handlers)
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
  configureHttpClient(
    createHttpClient({
      baseURL: '/api/v1',
      timeoutMs: 3000,
      getAuth: () => sessionStore.getSnapshot(),
      onSessionExpired: () => undefined,
    }),
  )
})
afterAll(() => {
  worker.stop()
})
beforeEach(async () => {
  await fetch('/__mock/reset', { method: 'POST', body: '{}' })
  sessionStore.signOut()
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

async function signIn(email = 'ana@example.test') {
  const auth = await authApi.login({ email, password: PASSWORD })
  sessionStore.signIn(auth.session.token, auth.user.id)
  return auth.user.id
}

describe('APIs das features × servidor simulado', () => {
  it('catálogo: listagem, facetas, destaques e detalhe', async () => {
    const params = nftListParamsSchema.parse({ category: ['musica'] })
    const list = await queryClient.query(nftListQuery(params))
    expect(list.items.every((nft) => nft.category === 'musica')).toBe(true)
    expect((await queryClient.query(facetsQuery(params))).networks).toHaveLength(3)
    expect((await queryClient.query(featuredQuery())).items).toHaveLength(6)
    expect((await queryClient.query(nftDetailQuery(EMERALD))).name).toBe('Emerald Ape #042')
  })

  it('sessão: visitante sem token; usuário após login', async () => {
    expect(await queryClient.query(sessionQuery())).toBeNull()
    await signIn()
    queryClient.removeQueries()
    expect(await queryClient.query(sessionQuery())).toMatchObject({ username: 'ana.collector' })
  })

  it('cadastro cria conta e sessão', async () => {
    const auth = await authApi.register({
      username: 'nova.conta',
      email: 'nova@example.test',
      password: PASSWORD,
      confirmPassword: PASSWORD,
    })
    expect(auth.user.username).toBe('nova.conta')
  })

  it('carrinho: incluir, alterar, cupom e remover', async () => {
    const userId = await signIn()
    let cart = await cartApi.add({ nftId: EMERALD, editionId: EDITION, quantity: 1 })
    const itemId = cart.items[0]?.id ?? ''
    cart = await cartApi.updateQuantity(itemId, 3)
    expect(cart.items[0]?.quantity).toBe(3)
    cart = await cartApi.applyCoupon('JUNGLE10')
    expect(cart.summary.coupon?.status).toBe('applied')
    cart = await cartApi.removeCoupon()
    expect(cart.couponCode).toBeNull()
    cart = await cartApi.remove(itemId)
    expect((await queryClient.query(cartQuery({ type: 'user', userId }))).items).toEqual(cart.items)
  })

  it('favoritos', async () => {
    const userId = await signIn('bruno@example.test')
    await favoritesApi.set(EMERALD, true)
    expect((await queryClient.query(favoritesQuery(userId))).nftIds).toEqual([EMERALD])
    await favoritesApi.set(EMERALD, false)
  })

  it('checkout: cotação, pedido idempotente e consultas de pedido', async () => {
    const userId = await signIn()
    await cartApi.add({ nftId: EMERALD, editionId: EDITION, quantity: 1 })
    await walletsApi.connect('wal_ana-primary', 'ethereum')
    const quote = await queryClient.query(quoteQuery(userId, 'ethereum'))
    const body = {
      quoteId: quote.id,
      walletId: 'wal_ana-primary',
      network: 'ethereum' as const,
      buyer: {
        displayName: 'Ana',
        username: 'ana.collector',
        email: 'ana@example.test',
        referralCode: null,
        note: null,
      },
    }
    const order = await checkoutApi.createOrder(body, 'tentativa-1')
    expect((await checkoutApi.createOrder(body, 'tentativa-1')).id).toBe(order.id)
    expect((await queryClient.query(orderQuery(userId, order.id))).status).toBe('pending')
    expect((await queryClient.query(pendingOrdersQuery(userId))).items.map((item) => item.id)).toContain(order.id)
  })

  it('perfil, avatar e senha', async () => {
    const userId = await signIn('bruno@example.test')
    const profile = await queryClient.query(profileQuery(userId))
    const updated = await profileApi.update({
      displayName: 'Bruno H.',
      username: profile.username,
      email: profile.email,
      ensName: null,
      walletNickname: null,
    })
    expect(updated.displayName).toBe('Bruno H.')
    const png = new File([new Uint8Array([137, 80, 78, 71])], 'avatar.png', { type: 'image/png' })
    expect((await profileApi.uploadAvatar(png)).avatarUrl).toMatch(/^data:image\/png;base64,/)
    expect((await profileApi.removeAvatar()).avatarUrl).toBeNull()
    await expect(
      profileApi.changePassword({
        currentPassword: 'errada',
        newPassword: 'Nova#2026x',
        confirmPassword: 'Nova#2026x',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: { currentPassword: [expect.any(String)] },
    })
  })

  it('carteiras: cadastro da secundária, edição, conexão e desconexão', async () => {
    const userId = await signIn('bruno@example.test')
    const wallet = await walletsApi.create({
      role: 'secondary',
      displayName: 'Reserva',
      nickname: null,
      network: 'polygon',
      address: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      provider: 'walletconnect',
      ensName: null,
    })
    const edited = await walletsApi.update(wallet.id, { ...wallet, displayName: 'Reserva 2' })
    expect(edited.displayName).toBe('Reserva 2')
    expect((await walletsApi.connect(wallet.id, 'polygon')).connection).toBe('connected')
    expect((await walletsApi.disconnect(wallet.id)).connection).toBe('disconnected')
    expect((await queryClient.query(walletsQuery(userId))).items).toHaveLength(2)
  })
})
