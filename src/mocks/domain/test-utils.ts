import type { RealtimeEvent } from '@/contracts'

import { createSeedState } from '../db/seed'
import { MockDatabase } from '../db/store'

/** Banco isolado por teste, sem persistência, com captura dos eventos publicados. */
export async function createTestDatabase() {
  const db = await MockDatabase.open({ storage: null, createSeed: createSeedState })
  const events: RealtimeEvent[] = []
  db.subscribe((event) => events.push(event))
  return { db, events }
}
