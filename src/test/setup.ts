import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// APIs ausentes no jsdom e usadas pelas primitivas Radix (Slider, Select, Dialog).
// Implementações simples (não vi.fn), para não serem zeradas pelo `restoreMocks` entre testes.
class ResizeObserverStub {
  observe() {
    // no-op: o layout não é medido no jsdom
  }
  unobserve() {
    // no-op
  }
  disconnect() {
    // no-op
  }
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub)

const noop = () => undefined
// Testes com `@vitest-environment node` (ex.: mocks de rede) não têm DOM.
if ('Element' in globalThis) {
  Object.assign(Element.prototype, {
    hasPointerCapture: () => false,
    setPointerCapture: noop,
    releasePointerCapture: noop,
    scrollIntoView: noop,
  })
}

afterEach(() => {
  cleanup()
})
