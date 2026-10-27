import type { Network, QuoteSummary } from '@/contracts'
import { addEth, compareEth, percentOfEth, subtractEth } from '@/shared/lib/money'

import type { CouponRecord, DbState } from '../db/schema'
import { fail } from './context'

/** Taxa de rede simulada por pedido. */
export const NETWORK_FEES: Record<Network, string> = { ethereum: '0.016', polygon: '0.0004', solana: '0.00025' }

export type CouponStatus = 'applied' | 'invalid' | 'expired'

export function evaluateCoupon(coupon: CouponRecord | undefined, subtotalEth: string, nowIso: string): CouponStatus {
  if (!coupon) return 'invalid'
  if (coupon.expiresAt <= nowIso) return 'expired'
  if (compareEth(subtotalEth, coupon.minSubtotalEth) < 0) return 'invalid'
  return 'applied'
}

/** Valida um código para aplicação explícita (PUT /cart/coupon): erros distintos para inválido e expirado. */
export function assertCouponApplicable(
  db: DbState,
  { code, subtotalEth, nowIso }: { code: string; subtotalEth: string; nowIso: string },
): CouponRecord {
  const coupon = db.coupons.find((candidate) => candidate.code === code)
  const status = evaluateCoupon(coupon, subtotalEth, nowIso)
  if (status === 'expired') fail('COUPON_EXPIRED', 'Cupom expirado', { fieldErrors: { code: ['Este cupom expirou'] } })
  if (status === 'invalid' || !coupon) {
    const message = coupon ? `Disponível para pedidos a partir de ${coupon.minSubtotalEth} ETH` : 'Cupom inválido'
    return fail('COUPON_INVALID', message, { fieldErrors: { code: [message] } })
  }
  return coupon
}

interface SummaryInput {
  db: DbState
  lineTotals: string[]
  couponCode: string | null
  network: Network
  nowIso: string
}

export function computeSummary({ db, lineTotals, couponCode, network, nowIso }: SummaryInput): QuoteSummary {
  const subtotalEth = addEth('0', ...lineTotals)
  const coupon = couponCode ? db.coupons.find((candidate) => candidate.code === couponCode) : undefined
  const status = couponCode ? evaluateCoupon(coupon, subtotalEth, nowIso) : null
  const discountEth = status === 'applied' && coupon ? percentOfEth(subtotalEth, coupon.basisPoints) : '0'
  const networkFeeEth = lineTotals.length > 0 ? NETWORK_FEES[network] : '0'
  return {
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth: addEth(subtractEth(subtotalEth, discountEth), networkFeeEth),
    coupon:
      couponCode && status ? { code: couponCode, status, description: coupon?.description ?? 'Cupom inválido' } : null,
  }
}
