// @vitest-environment node
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ApiError } from './api-error'
import { createHttpClient } from './http-client'

const BASE = 'http://api.test/api/v1'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const setup = (auth: { token?: string; guestCartId?: string } = {}) => {
  const onSessionExpired = vi.fn()
  const client = createHttpClient({ baseURL: BASE, timeoutMs: 200, getAuth: () => auth, onSessionExpired })
  return { client, onSessionExpired }
}

const errorBody = (code: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message: code, retryable: false, requestId: 'req_1', ...extra },
})

describe('createHttpClient', () => {
  it('envia o token de sessão e valida a resposta com o contrato', async () => {
    let authorization: string | null = null
    server.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    const { client } = setup({ token: 'sess_1' })

    await expect(
      client.request({ method: 'GET', url: '/ping', schema: z.object({ ok: z.boolean() }) }),
    ).resolves.toEqual({ ok: true })
    expect(authorization).toBe('Bearer sess_1')
  })

  it('envia o carrinho de visitante quando não há sessão', async () => {
    let guest: string | null = null
    server.use(
      http.get(`${BASE}/cart`, ({ request }) => {
        guest = request.headers.get('x-guest-cart-id')
        return HttpResponse.json({})
      }),
    )
    await setup({ guestCartId: 'guest_1' }).client.request({ method: 'GET', url: '/cart', schema: z.object({}) })
    expect(guest).toBe('guest_1')
  })

  it('converte o envelope de erro da API em ApiError com fieldErrors', async () => {
    server.use(
      http.post(`${BASE}/auth/register`, () =>
        HttpResponse.json(errorBody('EMAIL_TAKEN', { fieldErrors: { email: ['Já cadastrado'] } }), { status: 409 }),
      ),
    )
    const error = await setup()
      .client.request({ method: 'POST', url: '/auth/register', data: {}, schema: z.unknown() })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
      fieldErrors: { email: ['Já cadastrado'] },
      retryable: false,
    })
  })

  it('sessão expirada notifica uma única vez, mesmo com requisições concorrentes', async () => {
    server.use(http.get(`${BASE}/me/profile`, () => HttpResponse.json(errorBody('SESSION_EXPIRED'), { status: 401 })))
    const { client, onSessionExpired } = setup({ token: 'sess_old' })
    const call = () => client.request({ method: 'GET', url: '/me/profile', schema: z.unknown() }).catch(() => undefined)

    await Promise.all([call(), call(), call()])
    expect(onSessionExpired).toHaveBeenCalledOnce()
  })

  it('classifica timeout, falha de rede e 5xx como retryable', async () => {
    server.use(
      http.get(`${BASE}/slow`, async () => {
        await delay(1000)
        return HttpResponse.json({})
      }),
      http.get(`${BASE}/offline`, () => HttpResponse.error()),
      http.get(`${BASE}/boom`, () =>
        HttpResponse.json(errorBody('TRANSIENT_FAILURE', { retryable: true }), { status: 503 }),
      ),
      http.get(`${BASE}/html`, () => new HttpResponse('<h1>bad gateway</h1>', { status: 502 })),
    )
    const { client } = setup()
    const fail = (url: string) =>
      client.request({ method: 'GET', url, schema: z.unknown() }).catch((caught: unknown) => caught)

    await expect(fail('/slow')).resolves.toMatchObject({ code: 'TIMEOUT', retryable: true })
    await expect(fail('/offline')).resolves.toMatchObject({ code: 'NETWORK_ERROR', retryable: true })
    await expect(fail('/boom')).resolves.toMatchObject({ code: 'TRANSIENT_FAILURE', status: 503, retryable: true })
    await expect(fail('/html')).resolves.toMatchObject({ code: 'INTERNAL_ERROR', status: 502, retryable: true })
  })

  it('resposta fora do contrato vira CONTRACT_ERROR (não retryable)', async () => {
    server.use(http.get(`${BASE}/ping`, () => HttpResponse.json({ ok: 'sim' })))
    const error = await setup()
      .client.request({ method: 'GET', url: '/ping', schema: z.object({ ok: z.boolean() }) })
      .catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: 'CONTRACT_ERROR', retryable: false })
  })

  it('cancelamento por AbortSignal vira CANCELED', async () => {
    server.use(
      http.get(`${BASE}/slow`, async () => {
        await delay(1000)
        return HttpResponse.json({})
      }),
    )
    const controller = new AbortController()
    const pending = setup()
      .client.request({ method: 'GET', url: '/slow', schema: z.unknown(), signal: controller.signal })
      .catch((caught: unknown) => caught)
    controller.abort()
    await expect(pending).resolves.toMatchObject({ code: 'CANCELED', retryable: false })
  })

  it('serializa arrays na query como parâmetros repetidos', async () => {
    let query = ''
    server.use(
      http.get(`${BASE}/nfts`, ({ request }) => {
        query = new URL(request.url).search
        return HttpResponse.json({})
      }),
    )
    await setup().client.request({
      method: 'GET',
      url: '/nfts',
      params: { category: ['musica', 'jogos'], page: 2, q: undefined },
      schema: z.unknown(),
    })
    expect(query).toBe('?category=musica&category=jogos&page=2')
  })
})
