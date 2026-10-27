import type { DbState } from './schema'

/** PRNG determinístico (mulberry32): mesma semente → mesmas sequências em dev, demo e testes. */
export function createPrng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

/** Identificadores sequenciais persistidos no estado (estáveis entre refresh e reset). */
export function nextId(db: DbState, prefix: string): string {
  const value = (db.counters[prefix] ?? 0) + 1
  db.counters[prefix] = value
  return `${prefix}_${value.toString().padStart(6, '0')}`
}

/** Relógio da simulação: usa Date.now(), controlável por page.clock nos testes. */
export const now = (): Date => new Date(Date.now())
export const isoNow = (): string => now().toISOString()
export const isoIn = (ms: number): string => new Date(Date.now() + ms).toISOString()
