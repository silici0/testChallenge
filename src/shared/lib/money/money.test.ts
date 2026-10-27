import { describe, expect, it } from 'vitest'

import { addEth, compareEth, formatEth, isEthString, multiplyEth, parseEth } from './money'

describe('isEthString', () => {
  it.each(['0', '1', '0.1', '12.30', '0.000000000000000001'])('aceita %s', (value) => {
    expect(isEthString(value)).toBe(true)
  })

  it.each(['', '-1', '1.', '.5', '1e18', '0.0000000000000000001', '1,5', ' 1'])('rejeita %s', (value) => {
    expect(isEthString(value)).toBe(false)
  })
})

describe('parseEth', () => {
  it('converte ETH para wei sem perder precisão', () => {
    expect(parseEth('1')).toBe(10n ** 18n)
    expect(parseEth('0.1')).toBe(10n ** 17n)
    expect(parseEth('0.000000000000000001')).toBe(1n)
  })

  it('lança erro para valores fora do contrato', () => {
    expect(() => parseEth('1e3')).toThrow(/valor ETH inválido/i)
  })
})

describe('formatEth', () => {
  it('formata wei como string decimal sem zeros à direita', () => {
    expect(formatEth(10n ** 18n)).toBe('1')
    expect(formatEth(1_190_000_000_000_000_000n)).toBe('1.19')
    expect(formatEth(1n)).toBe('0.000000000000000001')
    expect(formatEth(0n)).toBe('0')
  })

  it('formata valores negativos (descontos)', () => {
    expect(formatEth(-(10n ** 17n))).toBe('-0.1')
  })

  it('preenche casas mínimas quando pedido', () => {
    expect(formatEth(10n ** 18n, { minDecimals: 2 })).toBe('1.00')
  })
})

describe('operações', () => {
  it('soma sem erro de ponto flutuante', () => {
    expect(addEth('0.1', '0.2')).toBe('0.3')
  })

  it('multiplica preço por quantidade inteira', () => {
    expect(multiplyEth('1.19', 2)).toBe('2.38')
    expect(multiplyEth('1.79', 9)).toBe('16.11')
  })

  it('recusa quantidade não inteira ou negativa', () => {
    expect(() => multiplyEth('1', 1.5)).toThrow(/quantidade/i)
    expect(() => multiplyEth('1', -1)).toThrow(/quantidade/i)
  })

  it('compara valores', () => {
    expect(compareEth('1.10', '1.1')).toBe(0)
    expect(compareEth('0.9', '1')).toBe(-1)
    expect(compareEth('2', '1.999999999999999999')).toBe(1)
  })
})
