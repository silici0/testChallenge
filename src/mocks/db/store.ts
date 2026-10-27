import type { RealtimeEvent } from '@/contracts'

import type { DomainContext, DomainEvent } from '../domain/context'
import { isoNow, nextId } from './runtime'
import type { DbState } from './schema'

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

type Listener = (event: RealtimeEvent) => void

const STORAGE_KEY = 'mock:db:v1'

/**
 * Banco do servidor simulado: estado em memória, persistência opcional (refresh) e barramento de eventos.
 * Toda escrita passa por `transaction`, que persiste e publica os eventos de domínio gerados — assim a
 * mesma mudança aparece no REST e no Socket.IO (enunciado §6).
 */
export class MockDatabase {
  private listeners = new Set<Listener>()

  private constructor(
    private state: DbState,
    private readonly storage: KeyValueStorage | null,
    private readonly createSeed: () => Promise<DbState>,
  ) {}

  static async open(options: {
    storage: KeyValueStorage | null
    createSeed: () => Promise<DbState>
  }): Promise<MockDatabase> {
    const persisted = options.storage?.getItem(STORAGE_KEY)
    const parsed = persisted ? (JSON.parse(persisted) as Partial<DbState>) : null
    // Estado persistido de outra versão do schema é descartado (reseed).
    const state = parsed?.schemaVersion === 1 ? (parsed as DbState) : await options.createSeed()
    const db = new MockDatabase(state, options.storage, options.createSeed)
    db.persist()
    return db
  }

  /** Leitura sem efeitos colaterais persistidos. */
  read<T>(reader: (state: DbState) => T): T {
    return reader(this.state)
  }

  /** Escrita atômica: aplica, persiste e só então publica os eventos. */
  async transaction<T>(writer: (context: DomainContext) => T | Promise<T>): Promise<T> {
    const pending: RealtimeEvent[] = []
    const context: DomainContext = {
      db: this.state,
      emit: (event: DomainEvent) => {
        pending.push({ ...event, eventId: nextId(this.state, 'evt'), occurredAt: isoNow() } as RealtimeEvent)
      },
    }
    const result = await writer(context)
    this.persist()
    for (const event of pending) this.publish(event)
    return result
  }

  /** Reemite um evento (cenários de duplicata/evento antigo). */
  publish(event: RealtimeEvent): void {
    for (const listener of this.listeners) listener(event)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async reset(): Promise<void> {
    this.state = await this.createSeed()
    this.persist()
  }

  private persist(): void {
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state))
  }
}
