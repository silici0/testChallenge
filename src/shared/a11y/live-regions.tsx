import { useSyncExternalStore } from 'react'

import { announcer } from './announcer'

/** Regiões aria-live globais. O `key` força a releitura de mensagens repetidas. */
export function LiveRegions() {
  const { polite, assertive } = useSyncExternalStore(announcer.subscribe, announcer.getSnapshot)
  return (
    <div className="sr-only">
      <div role="status" aria-live="polite" aria-atomic="true">
        {polite && <span key={polite.id}>{polite.message}</span>}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {assertive && <span key={assertive.id}>{assertive.message}</span>}
      </div>
    </div>
  )
}
