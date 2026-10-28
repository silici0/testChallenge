import { http, HttpResponse } from 'msw'
import { z } from 'zod'

import { ethSchema } from '@/contracts'

import { nftUpdatedEvent } from '../domain/catalog'
import { resolveOrder } from '../domain/orders'
import type { MockServices } from '../http/responder'
import { SCENARIOS } from '../scenarios/catalog'
import { SCENARIO_IDS } from '../scenarios/definitions'
import type { RealtimeServer } from '../socket/server'

const scenarioBody = z.object({ id: z.enum(SCENARIO_IDS), reset: z.boolean().optional() })
const nftPatchBody = z.object({
  editionId: z.string(),
  priceEth: ethSchema.optional(),
  available: z.number().int().nonnegative().optional(),
})
const resolveBody = z.object({ status: z.enum(['confirmed', 'declined']), reason: z.string().nullable().optional() })

/**
 * Endpoints de controle da simulação (painel e Playwright). Não passam pela simulação de rede:
 * funcionam mesmo no cenário `offline`. A UI de negócio nunca os chama.
 */
export function controlRoutes(services: MockServices, realtime: RealtimeServer) {
  const { db, scenarios } = services
  const base = '*/__mock'
  const body = async <T>(request: Request, schema: z.ZodType<T>) => schema.parse(await request.json().catch(() => ({})))

  return [
    http.get(`${base}/scenario`, () =>
      HttpResponse.json({ id: scenarios.scenario.id, description: scenarios.scenario.description }),
    ),
    http.get(`${base}/scenarios`, () =>
      HttpResponse.json({
        active: scenarios.scenario.id,
        items: SCENARIO_IDS.map((id) => ({ id, description: SCENARIOS[id].description })),
      }),
    ),
    http.put(`${base}/scenario`, async ({ request }) => {
      const { id, reset } = await body(request, scenarioBody)
      if (reset) await db.reset()
      scenarios.activate(id)
      return HttpResponse.json({ id })
    }),
    http.post(`${base}/reset`, async ({ request }) => {
      const { id } = await body(request, scenarioBody.partial())
      await db.reset()
      scenarios.activate(id ?? 'default')
      realtime.restore()
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${base}/nfts/:nftId`, async ({ request, params }) => {
      const patch = await body(request, nftPatchBody)
      const updated = await db.transaction((context) => {
        const nft = context.db.nfts.find((candidate) => candidate.id === params.nftId)
        const edition = nft?.editions.find((candidate) => candidate.id === patch.editionId)
        if (!nft || !edition) return false
        if (patch.priceEth) edition.priceEth = patch.priceEth
        if (patch.available !== undefined) {
          edition.available = patch.available
          edition.status = patch.available > 0 ? 'available' : 'sold-out'
        }
        nft.version += 1
        context.emit(nftUpdatedEvent(nft))
        return true
      })
      return updated ? new HttpResponse(null, { status: 204 }) : new HttpResponse(null, { status: 404 })
    }),
    http.post(`${base}/orders/:orderId/resolve`, async ({ request, params }) => {
      const { status, reason } = await body(request, resolveBody)
      await db.transaction((context) =>
        resolveOrder(context, { orderId: String(params.orderId), status, reason: reason ?? null }),
      )
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${base}/events/replay`, async ({ request }) => {
      const { resource } = await body(request, z.object({ resource: z.string() }))
      return new HttpResponse(null, { status: realtime.replay(resource) ? 204 : 404 })
    }),
    http.post(`${base}/socket/drop`, () => {
      realtime.drop()
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${base}/socket/restore`, () => {
      realtime.restore()
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}
