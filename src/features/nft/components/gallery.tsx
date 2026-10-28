import { useState } from 'react'

import type { Image } from '@/contracts'
import { cn } from '@/shared/lib/cn'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, Icon, NftImage } from '@/shared/ui'

export interface GalleryProps {
  name: string
  images: Image[]
}

/**
 * Galeria do detalhe: miniaturas são vistas da mesma obra (comentário #23), não edições.
 * Seletor afastado da imagem (comentário #24) e zoom em diálogo acessível.
 */
export function Gallery({ name, images }: GalleryProps) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]
  if (!current) return null
  return (
    <div className="flex flex-col-reverse gap-4 self-start md:flex-row md:gap-7">
      {images.length > 1 && (
        <div
          role="group"
          aria-label="Imagens do NFT"
          className="flex gap-3 overflow-x-auto md:w-[100px] md:flex-col md:gap-4"
        >
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              aria-label={`Imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === active}
              onClick={() => {
                setActive(index)
              }}
              className={cn(
                'w-20 shrink-0 overflow-hidden rounded-sm border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:w-full',
                index === active ? 'border-primary' : 'border-transparent hover:border-border-field',
              )}
            >
              <NftImage image={{ ...image, alt: '' }} sizes="100px" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1 rounded-sm bg-surface p-5">
        <NftImage image={current} priority sizes="(min-width: 1024px) 404px, 90vw" className="rounded-xl" />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${name}`}
              className="absolute top-6 right-6 flex size-9 items-center justify-center rounded-pill bg-background/80 text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Icon name="zoom-in" size={20} />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(90vw,900px)] p-3 sm:max-w-[min(90vw,900px)]">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <DialogDescription className="sr-only">{current.alt}</DialogDescription>
            <NftImage image={current} sizes="900px" className="rounded-sm" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
