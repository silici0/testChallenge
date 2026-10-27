/**
 * Valores em ETH trafegam como string decimal (ADR-0011) e são calculados em wei (bigint).
 * Nunca converta para Number: 0.1 + 0.2 !== 0.3.
 */

export type EthString = string

const DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(DECIMALS)
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthString(value: string): boolean {
  return ETH_PATTERN.test(value)
}

export function parseEth(value: string): bigint {
  if (!isEthString(value)) throw new RangeError(`Valor ETH inválido: "${value}"`)
  const [integer = '0', fraction = ''] = value.split('.')
  return BigInt(integer) * WEI_PER_ETH + BigInt(fraction.padEnd(DECIMALS, '0'))
}

export interface FormatEthOptions {
  /** Casas decimais mínimas exibidas (preenche com zeros). Padrão: 0. */
  minDecimals?: number
}

export function formatEth(wei: bigint, { minDecimals = 0 }: FormatEthOptions = {}): EthString {
  const sign = wei < 0n ? '-' : ''
  const absolute = wei < 0n ? -wei : wei
  const integer = absolute / WEI_PER_ETH
  const fraction = (absolute % WEI_PER_ETH)
    .toString()
    .padStart(DECIMALS, '0')
    .replace(/0+$/, '')
    .padEnd(minDecimals, '0')
  return fraction ? `${sign}${integer}.${fraction}` : `${sign}${integer}`
}

export function addEth(...values: EthString[]): EthString {
  return formatEth(values.reduce((total, value) => total + parseEth(value), 0n))
}

export function multiplyEth(value: EthString, quantity: number): EthString {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantidade inválida: ${quantity}. Use um inteiro não negativo.`)
  }
  return formatEth(parseEth(value) * BigInt(quantity))
}

export function compareEth(a: EthString, b: EthString): -1 | 0 | 1 {
  const difference = parseEth(a) - parseEth(b)
  if (difference === 0n) return 0
  return difference < 0n ? -1 : 1
}

/** Percentual em pontos-base (1000 = 10 %), arredondado para baixo em wei — o desconto nunca excede o valor exato. */
export function percentOfEth(value: EthString, basisPoints: number): EthString {
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new RangeError(`Pontos-base inválidos: ${basisPoints}. Use um inteiro entre 0 e 10000.`)
  }
  return formatEth((parseEth(value) * BigInt(basisPoints)) / 10_000n)
}

/** Subtração com piso em zero (ex.: total após desconto). */
export function subtractEth(value: EthString, amount: EthString): EthString {
  const difference = parseEth(value) - parseEth(amount)
  return formatEth(difference > 0n ? difference : 0n)
}
