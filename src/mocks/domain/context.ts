import type { ApiErrorCode, RealtimeEvent } from '@/contracts'

import type { DbState } from '../db/schema'

/** Erro de regra de negócio do servidor simulado; o adaptador HTTP o converte no envelope padrão. */
export class DomainError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly extra: { fieldErrors?: Record<string, string[]>; details?: Record<string, unknown> } = {},
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export type DomainEvent = Omit<RealtimeEvent, 'eventId' | 'occurredAt'>

/** Dependências das regras de domínio (inversão de dependência: sem MSW, storage ou socket aqui). */
export interface DomainContext {
  db: DbState
  emit: (event: DomainEvent) => void
}

export function fail(...args: ConstructorParameters<typeof DomainError>): never {
  throw new DomainError(...args)
}

export function requireFound<T>(value: T | undefined, what: string): T {
  if (value === undefined) fail('NOT_FOUND', `${what} não encontrado`)
  return value
}
