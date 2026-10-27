import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'

import { type BadgeVariantProps, badgeVariants } from './badge.variants'

export interface BadgeProps extends ComponentProps<'span'>, BadgeVariantProps {}

/** Selo “RARO”, contador do carrinho e estados (esgotado, pendente, confirmado, recusado). */
export function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
