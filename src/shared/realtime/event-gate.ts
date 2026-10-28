import type { RealtimeEvent } from '@/contracts'

export const resourceKey = (resource: { type: string; id: string }) => `${resource.type}:${resource.id}`

export interface EventGate {
  /** true se o evento deve produzir efeitos: inédito, mais novo que o estado conhecido e do usuário atual. */
  accept: (event: RealtimeEvent, currentUserId: string | null) => boolean
  /** Registra a versão vista via REST; o maior valor entre REST e eventos prevalece. */
  recordVersion: (key: string, version: number) => void
  versionOf: (key: string) => number | undefined
  rememberedCount: () => number
  /** Logout/troca de usuário: esquece ids e versões (nada da sessão anterior afeta a próxima). */
  reset: () => void
}

/**
 * Garantias de tempo real do cliente (enunciado §7): tolera duplicatas e eventos antigos sem regredir
 * estado nem reaplicar efeitos, e isola eventos privados por usuário.
 */
export function createEventGate({ maxRemembered = 500 } = {}): EventGate {
  const seen = new Set<string>()
  const versions = new Map<string, number>()

  const remember = (eventId: string) => {
    seen.add(eventId)
    if (seen.size > maxRemembered) {
      const oldest = seen.values().next().value
      if (oldest !== undefined) seen.delete(oldest)
    }
  }

  const recordVersion = (key: string, version: number) => {
    versions.set(key, Math.max(versions.get(key) ?? 0, version))
  }

  return {
    accept: (event, currentUserId) => {
      if (seen.has(event.eventId)) return false
      if (event.userId !== null && event.userId !== currentUserId) return false
      const key = resourceKey(event.resource)
      if (event.version <= (versions.get(key) ?? 0)) return false
      remember(event.eventId)
      recordVersion(key, event.version)
      return true
    },
    recordVersion,
    versionOf: (key) => versions.get(key),
    rememberedCount: () => seen.size,
    reset: () => {
      seen.clear()
      versions.clear()
    },
  }
}
