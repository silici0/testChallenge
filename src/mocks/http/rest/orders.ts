import { createOrderBodySchema, orderStatusSchema } from '@/contracts'

import { fail } from '../../domain/context'
import { createOrder, findOwnOrder, toOrderDto } from '../../domain/orders'
import { createRoute, type MockServices } from '../responder'

export function orderRoutes(services: MockServices) {
  const { privateRoute } = createRoute(services)
  return [
    privateRoute('post', '/orders', async (context) => {
      const user = await context.requireUser()
      const idempotencyKey =
        context.request.headers.get('idempotency-key') ?? fail('BAD_REQUEST', 'Cabeçalho Idempotency-Key obrigatório')
      const body = createOrderBodySchema.parse(await context.json())
      const { order, created } = await services.db.transaction(({ db }) =>
        createOrder(db, user.id, { idempotencyKey, body, plan: services.scenarios.scenario.orderPlan }),
      )
      if (created) services.effects.scheduleOrderResolution(order.id)
      return { status: created ? 201 : 200, body: toOrderDto(order) }
    }),
    privateRoute('get', '/orders', async (context) => {
      const user = await context.requireUser()
      const status = orderStatusSchema
        .optional()
        .parse(new URL(context.request.url).searchParams.get('status') ?? undefined)
      return services.db.read((db) => ({
        items: db.orders
          .filter((order) => order.userId === user.id && (!status || order.status === status))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map(toOrderDto),
      }))
    }),
    privateRoute('get', '/orders/:orderId', async (context) => {
      const user = await context.requireUser()
      return services.db.read((db) => toOrderDto(findOwnOrder(db, user.id, String(context.params.orderId))))
    }),
  ]
}
