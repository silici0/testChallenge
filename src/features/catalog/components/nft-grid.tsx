import type { ReactNode } from 'react'

import type { NftSummary } from '@/contracts'
import { cn } from '@/shared/lib/cn'
import { SkeletonRegion } from '@/shared/ui'

import { NftCardSkeleton } from './nft-card'

export interface NftGridProps {
  items: NftSummary[] | undefined
  isLoading: boolean
  /** Atualização em segundo plano (resultados anteriores esmaecidos — keepPreviousData). */
  isFetching?: boolean
  skeletonCount?: number
  renderCard: (nft: NftSummary, index: number) => ReactNode
  className?: string
}

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:gap-x-8 lg:gap-y-12'

export function NftGrid({
  items,
  isLoading,
  isFetching = false,
  skeletonCount = 9,
  renderCard,
  className,
}: NftGridProps) {
  if (isLoading || !items) {
    return (
      <SkeletonRegion label="Carregando NFTs" className={cn(gridClass, className)}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <NftCardSkeleton key={index} />
        ))}
      </SkeletonRegion>
    )
  }
  return (
    <ul
      aria-label="Resultados do catálogo"
      aria-busy={isFetching}
      className={cn(gridClass, 'transition-opacity', isFetching && 'opacity-60', className)}
    >
      {items.map((nft, index) => (
        <li key={nft.id}>{renderCard(nft, index)}</li>
      ))}
    </ul>
  )
}
