import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('combina classes condicionais', () => {
    const isActive = Math.random() > 2
    expect(cn('a', isActive && 'b', undefined, 'c')).toBe('a c')
  })

  it('mantém tamanho de texto e cor de texto dos tokens juntos', () => {
    expect(cn('text-body text-foreground')).toBe('text-body text-foreground')
  })

  it('resolve conflitos dentro do mesmo grupo de token (a última vence)', () => {
    expect(cn('text-body', 'text-label')).toBe('text-label')
    expect(cn('bg-surface', 'bg-primary')).toBe('bg-primary')
    expect(cn('rounded-sm', 'rounded-pill')).toBe('rounded-pill')
  })
})
