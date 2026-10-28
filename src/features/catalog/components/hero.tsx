import { type ReactNode, useState } from 'react'

import type { NftSummary } from '@/contracts'
import { cn } from '@/shared/lib/cn'
import { NftImage, Skeleton } from '@/shared/ui'

export interface HeroProps {
  slides: NftSummary[] | undefined
  /** CTA “EXPLORAR” (âncora para o catálogo). */
  cta: ReactNode
}

/** Hero da Início. Carrossel sem autoplay (WCAG 2.2.2): o usuário troca o destaque pelos indicadores. */
export function Hero({ slides, cta }: HeroProps) {
  const [active, setActive] = useState(0)
  const current = slides?.[active]
  return (
    <section
      aria-labelledby="hero-title"
      className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-4 rounded-xl bg-surface p-4 md:grid-cols-[1fr_450px] md:gap-8 md:bg-transparent md:p-0 md:pl-10"
    >
      <div className="flex flex-col gap-3 md:gap-5">
        <p className="text-caption text-foreground md:text-label">Bem-vindo à Kurio</p>
        <h1 id="hero-title" className="text-title font-bold tracking-wide text-foreground uppercase md:text-display">
          Seja dono do futuro da arte digital
        </h1>
        <p className="line-clamp-3 max-w-xl text-caption text-foreground-secondary md:line-clamp-none md:text-label md:leading-6">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas
          e tenha uma parte da cultura da internet.
        </p>
        <div>{cta}</div>
        {slides && slides.length > 1 && (
          <div role="group" aria-label="Destaques" className="flex gap-2 self-center md:self-end">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Destaque ${index + 1} de ${slides.length}: ${slide.name}`}
                aria-pressed={index === active}
                onClick={() => {
                  setActive(index)
                }}
                className={cn(
                  'size-3 rounded-pill transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  index === active ? 'bg-primary' : 'bg-primary/40 hover:bg-primary/70',
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        {current ? (
          <NftImage image={current.image} priority sizes="(min-width: 768px) 450px, 120px" className="rounded-xl" />
        ) : (
          <Skeleton className="aspect-square w-full rounded-xl" />
        )}
      </div>
    </section>
  )
}
