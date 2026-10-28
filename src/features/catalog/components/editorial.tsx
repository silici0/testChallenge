import type { ReactNode } from 'react'

import type { NftSummary } from '@/contracts'
import { Icon, NftImage, Skeleton, UnavailableAction } from '@/shared/ui'

/** Banner lateral “NFT em destaque · Oferta limitada”. Círculos decorativos do Figma ficam ocultos (comentário #66). */
export function FeaturedBanner({
  nft,
  renderLink,
}: {
  nft: NftSummary | undefined
  renderLink: (props: { className: string; children: ReactNode }) => ReactNode
}) {
  return (
    <section aria-labelledby="featured-title" className="flex flex-col gap-4 rounded-sm bg-surface-strong/40 pt-6">
      <h2 id="featured-title" className="px-5 text-h2 font-bold text-primary uppercase">
        NFT em destaque
        <span className="block text-title text-foreground">Oferta limitada</span>
      </h2>
      {nft ? (
        renderLink({
          className:
            'block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          children: (
            <>
              <NftImage image={nft.image} sizes="310px" className="rounded-xl" />
              <span className="sr-only">Ver {nft.name}</span>
            </>
          ),
        })
      ) : (
        <Skeleton className="aspect-square w-full rounded-xl" />
      )}
    </section>
  )
}

export interface PromoCardProps {
  title: string
  description: string
  nft: NftSummary | undefined
  cta: ReactNode
}

export function PromoCard({ title, description, nft, cta }: PromoCardProps) {
  return (
    <article className="grid overflow-hidden rounded-sm bg-surface sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {nft ? (
        <NftImage image={{ ...nft.image, alt: '' }} sizes="290px" className="h-full rounded-xl" />
      ) : (
        <Skeleton className="aspect-square w-full" />
      )}
      <div className="flex flex-col items-start gap-3 p-6 sm:items-end sm:text-right">
        <h3 className="text-body-lg font-bold text-foreground">{title}</h3>
        <p className="text-label text-foreground-secondary">{description}</p>
        {cta}
      </div>
    </article>
  )
}

const POSTS = [
  {
    date: '12 de setembro',
    minutes: 6,
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    date: '13 de setembro',
    minutes: 2,
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    date: '15 de setembro',
    minutes: 3,
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    date: '15 de setembro',
    minutes: 2,
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

/** “Diário da Cunhagem”: conteúdo editorial fora do escopo — leitura indisponível, sem simular navegação. */
export function BlogSection({ covers }: { covers: NftSummary[] | undefined }) {
  return (
    <section aria-labelledby="blog-title" className="flex flex-col gap-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <h2 id="blog-title" className="text-h2 font-bold text-foreground">
          Diário da Cunhagem
        </h2>
        <p className="text-label text-foreground-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post, index) => {
          const cover = covers?.[index]
          return (
            <li key={post.title}>
              <article className="flex h-full flex-col overflow-hidden rounded-sm bg-surface">
                {cover ? (
                  <NftImage image={{ ...cover.image, alt: '' }} sizes="268px" className="aspect-[268/195]" />
                ) : (
                  <Skeleton className="aspect-[268/195] w-full" />
                )}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-caption-sm text-foreground-secondary">
                    {post.date} | Leitura de {post.minutes} min
                  </p>
                  <h3 className="text-body font-bold text-foreground">{post.title}</h3>
                  <p className="flex-1 text-caption text-foreground-secondary">{post.excerpt}</p>
                  <UnavailableAction appearance="text" className="text-primary">
                    Ler mais <Icon name="arrow-right" size={14} className="inline" />
                  </UnavailableAction>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
