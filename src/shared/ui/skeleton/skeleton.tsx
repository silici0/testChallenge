import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'

export type SkeletonProps = ComponentProps<'div'>

/**
 * Bloco de carregamento com shimmer (desativado com prefers-reduced-motion).
 * Dê ao skeleton as mesmas dimensões do conteúdo final para evitar CLS.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" data-slot="skeleton" className={cn('shimmer rounded-sm', className)} {...props} />
}

export interface SkeletonRegionProps extends ComponentProps<'div'> {
  /** Texto anunciado enquanto carrega. */
  label?: string
}

/** Região ocupada: agrupa skeletons e anuncia o carregamento uma única vez. */
export function SkeletonRegion({ label = 'Carregando…', children, className, ...props }: SkeletonRegionProps) {
  return (
    <div role="status" aria-busy="true" className={className} {...props}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
