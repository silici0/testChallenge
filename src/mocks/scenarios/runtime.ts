import { createPrng } from '../db/runtime'
import type { KeyValueStorage } from '../db/store'
import { SCENARIOS } from './catalog'
import { isScenarioId, type RequestInfo, type Scenario, type ScenarioId } from './definitions'

const STORAGE_KEY = 'mock:scenario'

/** Cenário ativo e seus contadores (tentativas por rota, sequência da listagem, gatilhos únicos). */
export class ScenarioRuntime {
  private attempts = new Map<string, number>()
  private listSequence = 0
  private random = createPrng(42)
  private triggered = new Set<string>()
  private current: Scenario

  constructor(
    private readonly storage: KeyValueStorage | null,
    defaultId: ScenarioId,
  ) {
    const persisted = storage?.getItem(STORAGE_KEY)
    this.current = SCENARIOS[isScenarioId(persisted) ? persisted : defaultId]
  }

  get scenario(): Scenario {
    return this.current
  }

  activate(id: ScenarioId): void {
    this.current = SCENARIOS[id]
    this.attempts.clear()
    this.triggered.clear()
    this.listSequence = 0
    this.random = createPrng(42)
    this.storage?.setItem(STORAGE_KEY, id)
  }

  describe(method: string, path: string, isPrivate: boolean): RequestInfo {
    const key = `${method} ${path}`
    const attempt = this.attempts.get(key) ?? 0
    this.attempts.set(key, attempt + 1)
    const isList = method === 'GET' && path === '/nfts'
    const listSequence = isList ? this.listSequence++ : this.listSequence
    return { method, path, attempt, listSequence, isPrivate }
  }

  latency(): number {
    const { latency } = this.current
    if (typeof latency === 'number') return latency
    const [min, max] = latency
    return Math.round(min + this.random() * (max - min))
  }

  /** Gatilho que dispara uma única vez por ativação do cenário. */
  once(trigger: string): boolean {
    if (this.triggered.has(trigger)) return false
    this.triggered.add(trigger)
    return true
  }
}
