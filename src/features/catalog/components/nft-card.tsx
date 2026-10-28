import type { ReactNode } from 'react'

import type { NftSummary } from '@/contracts'
import { cn } from '@/shared/lib/cn'
import { Badge, EthAmount, NftImage, Skeleton } from '@/shared/ui'

export interface NftCardProps {
  nft: NftSummary
  /** Link para o detalhe (ex.: <Link> do router); recebe o nome como conteúdo acessível. */
  renderLink: (props: { className: string; children: ReactNode }) => ReactNode
  /** Ação sobreposta (ex.: botão de favorito), fora do link para não aninhar elementos interativos. */
  action?: ReactNode
  /** Imagem acima da dobra (LCP). */
  priority?: boolean
  className?: string
}

/** Card do catálogo (Figma: 258 px, imagem 1:1 em painel, nome e preço em destaque). */
export function NftCard({ nft, renderLink, action, priority = false, className }: NftCardProps) {
  const soldOut = nft.available === 0
  return (
    <article className={cn('group relative flex flex-col gap-3', className)}>
      <div className="relative rounded-sm bg-surface p-1.5 transition-colors group-hover:bg-surface-raised">
        <NftImage image={nft.image} priority={priority} className={cn('rounded-xl', soldOut && 'opacity-60')} />
        <div className="absolute top-3 left-3 flex gap-2">
          {nft.badge === 'rare' && <Badge variant="rare">Raro</Badge>}
          {soldOut && <Badge variant="status">Esgotado</Badge>}
        </div>
        {action && <div className="absolute top-3 right-3 z-10">{action}</div>}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-body text-foreground">
          {renderLink({
            className:
              'after:absolute after:inset-0 after:content-[""] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring focus-visible:after:rounded-sm',
            children: nft.name,
          })}
        </h3>
        <EthAmount value={nft.priceFromEth} size="md" />
      </div>
    </article>
  )
}

/** Mesmas dimensões do card final (sem deslocamento de layout). */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="rounded-sm bg-surface p-1.5">
        <Skeleton className="aspect-square w-full rounded-xl" />
      </div>
      <Skeleton className="h-[22px] w-3/4" />
      <Skeleton className="h-6 w-1/3" />
    </div>
  )
}
