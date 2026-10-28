import type { ComponentProps } from 'react'

import type { Image } from '@/contracts'
import { cn } from '@/shared/lib/cn'

import { buildSrcSet } from './src-set'

export interface NftImageProps extends Omit<ComponentProps<'img'>, 'src' | 'alt' | 'width' | 'height'> {
  image: Image
  /** Larguras renderizadas por breakpoint, para o navegador escolher a variação certa. */
  sizes?: string
  /** Imagem LCP: carregamento imediato e prioridade alta. */
  priority?: boolean
}

/** Imagem de NFT com dimensões explícitas (sem CLS) e srcset responsivo. */
export function NftImage({
  image,
  sizes = '(min-width: 1024px) 258px, 50vw',
  priority = false,
  className,
  ...props
}: NftImageProps) {
  return (
    <img
      src={image.url}
      srcSet={buildSrcSet(image.url)}
      sizes={sizes}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn('aspect-square h-auto w-full object-cover', className)}
      {...props}
    />
  )
}
