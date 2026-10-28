import { afterEach, describe, expect, it, vi } from 'vitest'

import { safeStorage } from './storage'

describe('safeStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('lê, grava e remove valores', () => {
    safeStorage.set('local', 'k', 'v')
    expect(safeStorage.get('local', 'k')).toBe('v')
    safeStorage.remove('local', 'k')
    expect(safeStorage.get('local', 'k')).toBeNull()
  })

  it('JSON: grava objetos e devolve null para conteúdo inválido', () => {
    safeStorage.setJson('session', 'draft', { step: 'wallet' })
    expect(safeStorage.getJson('session', 'draft')).toEqual({ step: 'wallet' })
    sessionStorage.setItem('broken', '{nope')
    expect(safeStorage.getJson('session', 'broken')).toBeNull()
    expect(safeStorage.getJson('session', 'missing')).toBeNull()
  })

  it('não quebra quando o storage lança (modo privado, cota)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(safeStorage.get('local', 'k')).toBeNull()
    expect(() => {
      safeStorage.set('local', 'k', 'v')
      safeStorage.remove('local', 'k')
    }).not.toThrow()
  })
})
