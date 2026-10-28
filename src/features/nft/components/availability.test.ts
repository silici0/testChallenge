import { describe, expect, it } from 'vitest'

import { availability } from './availability'
import { sampleDetail } from './fixtures'

const [oneOfOne, oneOfTen, , open] = sampleDetail.editions

describe('availability', () => {
  it('esgotada: limite zero com texto', () => {
    expect(availability(oneOfOne)).toEqual({ limit: 0, hint: 'Edição esgotada' })
  })
  it('poucas unidades: limite pelo disponível', () => {
    expect(availability({ ...oneOfTen!, available: 2 })).toEqual({ limit: 2, hint: 'Restam 2 nesta edição' })
  })
  it('estoque amplo: limite por pedido', () => {
    expect(availability(open)).toEqual({ limit: 20, hint: 'Máximo de 20 por pedido' })
  })
  it('sem edição selecionada', () => {
    expect(availability(undefined).limit).toBe(0)
  })
})
