import type { ApiErrorCode } from '@/contracts'
import { addEth, percentOfEth } from '@/shared/lib/money'

import { getOrCreateCart } from '../domain/cart'
import { nftUpdatedEvent } from '../domain/catalog'
import type { DomainContext } from '../domain/context'
import type { Interception, RequestInfo, Scenario, ScenarioId } from './definitions'

const CONFIRM = { status: 'confirmed', afterMs: 3000, reason: null } as const
const BASE: Omit<Scenario, 'id' | 'description'> = { latency: 150, orderPlan: CONFIRM }

const matches = (request: RequestInfo, method: string, pattern: RegExp) =>
  request.method === method && pattern.test(request.path)
const error = (
  code: ApiErrorCode,
  extra: { message?: string; fieldErrors?: Record<string, string[]> } = {},
): Interception => ({
  kind: 'error',
  code,
  ...extra,
})

/** Altera a 1ª edição do 1º item do carrinho do usuário e publica nft.updated (REST + evento). */
function mutateFirstCartItem(
  context: DomainContext,
  userId: string,
  mutate: (edition: { priceEth: string; available: number; status: string }) => void,
) {
  const cart = getOrCreateCart(context.db, { type: 'user', id: userId })
  const first = cart.items[0]
  const nft = first ? context.db.nfts.find((candidate) => candidate.id === first.nftId) : undefined
  const edition = nft?.editions.find((candidate) => candidate.id === first?.editionId)
  if (!nft || !edition) return
  mutate(edition)
  nft.version += 1
  context.emit(nftUpdatedEvent(nft))
}

const FORM_VALIDATION: Record<string, Record<string, string[]>> = {
  '/me/profile': { username: ['Nome de usuário reservado (simulado)'] },
  '/me/password': { newPassword: ['A nova senha não pode ser igual às 5 últimas (simulado)'] },
  '/me/wallets': { address: ['Endereço bloqueado pela análise de risco (simulado)'] },
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  default: { ...BASE, id: 'default', description: 'Sucesso, latência fixa de 150 ms, pedidos confirmam em 3 s' },
  'empty-catalog': { ...BASE, id: 'empty-catalog', description: 'Catálogo e destaques vazios', emptyCatalog: true },
  'slow-network': { ...BASE, id: 'slow-network', description: '+2500 ms em todas as respostas', latency: 2650 },
  'variable-latency': {
    ...BASE,
    id: 'variable-latency',
    description: 'Latência determinística entre 100 e 1800 ms',
    latency: [100, 1800],
  },
  'out-of-order': {
    ...BASE,
    id: 'out-of-order',
    description: 'Listagem responde em ordem inversa à das requisições',
    extraDelay: (request) => (matches(request, 'GET', /^\/nfts$/) ? Math.max(0, 1500 - request.listSequence * 600) : 0),
  },
  offline: { ...BASE, id: 'offline', description: 'Sem conexão: REST e socket indisponíveis', offline: true },
  'server-error': {
    ...BASE,
    id: 'server-error',
    description: '503 nas 2 primeiras tentativas de cada GET, depois sucesso',
    intercept: (request) => (request.method === 'GET' && request.attempt < 2 ? error('TRANSIENT_FAILURE') : null),
  },
  'http-errors': {
    ...BASE,
    id: 'http-errors',
    description: '500 permanente na listagem, destaques e detalhe',
    intercept: (request) =>
      request.method === 'GET' && request.path.startsWith('/nfts') ? error('INTERNAL_ERROR') : null,
  },
  'session-expired': {
    ...BASE,
    id: 'session-expired',
    description: 'A sessão expira na próxima requisição privada',
    intercept: (request) => (request.isPrivate ? { kind: 'expire-session' } : null),
  },
  unauthorized: {
    ...BASE,
    id: 'unauthorized',
    description: '403 em recursos privados',
    intercept: (request) => (request.isPrivate && request.path !== '/auth/session' ? error('FORBIDDEN') : null),
  },
  'register-conflict': {
    ...BASE,
    id: 'register-conflict',
    description: 'Cadastro sempre retorna 409 EMAIL_TAKEN',
    intercept: (request) =>
      matches(request, 'POST', /^\/auth\/register$/)
        ? error('EMAIL_TAKEN', { fieldErrors: { email: ['Este e-mail já está cadastrado'] } })
        : null,
  },
  'form-validation': {
    ...BASE,
    id: 'form-validation',
    description: '422 com erros por campo em perfil, senha e carteiras',
    intercept: (request) => {
      if (request.method === 'GET') return null
      const key = Object.keys(FORM_VALIDATION).find((path) => request.path.startsWith(path))
      return key ? error('VALIDATION_ERROR', { fieldErrors: FORM_VALIDATION[key] ?? {} }) : null
    },
  },
  'favorite-failure': {
    ...BASE,
    id: 'favorite-failure',
    description: 'Mutations de favorito retornam 500 (rollback otimista)',
    intercept: (request) =>
      request.method !== 'GET' && request.path.startsWith('/me/favorites/') ? error('INTERNAL_ERROR') : null,
  },
  'price-change-checkout': {
    ...BASE,
    id: 'price-change-checkout',
    description: 'Após a 1ª cotação, o preço do 1º item sobe 15 %',
    afterFirstQuote: (context, userId) => {
      mutateFirstCartItem(context, userId, (edition) => {
        edition.priceEth = addEth(edition.priceEth, percentOfEth(edition.priceEth, 1500))
      })
    },
  },
  'sold-out-checkout': {
    ...BASE,
    id: 'sold-out-checkout',
    description: 'Após a 1ª cotação, a edição do 1º item esgota',
    afterFirstQuote: (context, userId) => {
      mutateFirstCartItem(context, userId, (edition) => {
        edition.available = 0
        edition.status = 'sold-out'
      })
    },
  },
  'order-timeout': {
    ...BASE,
    id: 'order-timeout',
    description: 'A 1ª criação de pedido é efetivada, mas a resposta chega depois do timeout do Axios',
    responseDelay: (request, timeoutMs) =>
      matches(request, 'POST', /^\/orders$/) && request.attempt === 0 ? timeoutMs + 2000 : 0,
  },
  'payment-confirmed': { ...BASE, id: 'payment-confirmed', description: 'Pedido confirmado após 3 s' },
  'payment-declined': {
    ...BASE,
    id: 'payment-declined',
    description: 'Pedido recusado após 3 s',
    orderPlan: { status: 'declined', afterMs: 3000, reason: 'Saldo insuficiente na carteira (simulado)' },
  },
  'socket-drop-pending': {
    ...BASE,
    id: 'socket-drop-pending',
    description: 'O socket cai com o pedido pendente; a confirmação ocorre durante a queda',
    orderPlan: { status: 'confirmed', afterMs: 2000, reason: null },
    socketDropAfterOrder: { dropAfterMs: 500, confirmAfterMs: 2000, restoreAfterMs: 5000 },
  },
  'duplicate-events': {
    ...BASE,
    id: 'duplicate-events',
    description: 'Todo evento chega duas vezes e uma versão antiga é reenviada',
    duplicateEvents: true,
  },
  'wallet-rejected': {
    ...BASE,
    id: 'wallet-rejected',
    description: 'A conexão da carteira é recusada',
    rejectWalletConnection: true,
  },
  'wallet-disconnect': {
    ...BASE,
    id: 'wallet-disconnect',
    description: 'A carteira desconecta 2 s após conectar',
    disconnectWalletAfterMs: 2000,
  },
}
