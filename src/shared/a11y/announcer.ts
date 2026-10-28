export type Politeness = 'polite' | 'assertive'
export type Announce = (message: string, politeness: Politeness) => void

interface Announcement {
  id: number
  message: string
}

type Listener = () => void

/**
 * Anúncios para leitores de tela (mutations, tempo real, sessão), desacoplados da UI:
 * qualquer camada chama `announce`, e <LiveRegions /> renderiza as regiões aria-live.
 */
function createAnnouncer() {
  let counter = 0
  let state: Record<Politeness, Announcement | null> = { polite: null, assertive: null }
  const listeners = new Set<Listener>()

  return {
    announce: (message: string, politeness: Politeness = 'polite') => {
      state = { ...state, [politeness]: { id: ++counter, message } }
      for (const listener of listeners) listener()
    },
    getSnapshot: () => state,
    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export const announcer = createAnnouncer()
export const announce = announcer.announce
