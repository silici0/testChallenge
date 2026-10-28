import { safeStorage } from '@/shared/lib/storage'

const TOKEN_KEY = 'auth:token'
const GUEST_KEY = 'cart:guestId'

export interface SessionSnapshot {
  token: string | null
  userId: string | null
  guestCartId: string
}

type Listener = () => void

const newGuestId = () => `guest_${crypto.randomUUID()}`

/**
 * Estado mínimo de sessão no cliente: token (persistido para sobreviver a refresh) e id do carrinho de
 * visitante. Os dados do usuário ficam no TanStack Query (['session']); aqui fica só o necessário para o transporte.
 */
export function createSessionStore() {
  const listeners = new Set<Listener>()
  let snapshot: SessionSnapshot = {
    token: safeStorage.get('local', TOKEN_KEY),
    userId: null,
    guestCartId: safeStorage.get('local', GUEST_KEY) ?? newGuestId(),
  }
  safeStorage.set('local', GUEST_KEY, snapshot.guestCartId)

  const update = (patch: Partial<SessionSnapshot>) => {
    snapshot = { ...snapshot, ...patch }
    for (const listener of listeners) listener()
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    signIn: (token: string, userId: string) => {
      safeStorage.set('local', TOKEN_KEY, token)
      update({ token, userId })
    },
    setUser: (userId: string | null) => {
      update({ userId })
    },
    signOut: () => {
      safeStorage.remove('local', TOKEN_KEY)
      update({ token: null, userId: null })
    },
    /** Novo carrinho de visitante (após o merge no login ou no logout). */
    rotateGuestCart: () => {
      const guestCartId = newGuestId()
      safeStorage.set('local', GUEST_KEY, guestCartId)
      update({ guestCartId })
    },
  }
}

export const sessionStore = createSessionStore()
export type SessionStore = ReturnType<typeof createSessionStore>
