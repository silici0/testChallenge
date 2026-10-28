/**
 * Acesso tolerante a falhas ao Web Storage (modo privado, cota, bloqueio de cookies).
 * Leituras devolvem null e escritas são ignoradas quando o storage não está disponível.
 */
type Area = 'local' | 'session'

const resolve = (area: Area): Storage | null => {
  try {
    return area === 'local' ? globalThis.localStorage : globalThis.sessionStorage
  } catch {
    return null
  }
}

export const safeStorage = {
  get(area: Area, key: string): string | null {
    try {
      return resolve(area)?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  set(area: Area, key: string, value: string): void {
    try {
      resolve(area)?.setItem(key, value)
    } catch {
      // storage indisponível: o estado continua apenas em memória
    }
  },
  remove(area: Area, key: string): void {
    try {
      resolve(area)?.removeItem(key)
    } catch {
      // idem
    }
  },
  /** JSON bruto (unknown): o chamador valida com o schema correspondente. */
  getJson(area: Area, key: string): unknown {
    const raw = this.get(area, key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as unknown
    } catch {
      return null
    }
  },
  setJson(area: Area, key: string, value: unknown): void {
    this.set(area, key, JSON.stringify(value))
  },
}
