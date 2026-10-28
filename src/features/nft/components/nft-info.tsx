import { useState } from 'react'

import type { NftDetail } from '@/contracts'
import { Icon, SocialIcon, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
const NETWORK = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const

export function NftFacts({ nft }: { nft: NftDetail }) {
  return (
    <dl className="flex flex-col gap-2 text-label text-foreground-secondary">
      <div className="flex gap-2">
        <dt>ID do token:</dt>
        <dd>{nft.tokenId}</dd>
      </div>
      <div className="flex gap-2">
        <dt>Coleção:</dt>
        <dd>{nft.collection.name}</dd>
      </div>
      <div className="flex gap-2">
        <dt>Atributos:</dt>
        <dd>{nft.attributes.map((attribute) => attribute.value).join(', ')}</dd>
      </div>
    </dl>
  )
}

/** Compartilhamento real: links externos (nova aba) e “copiar link” com confirmação. */
export function ShareLinks({ name }: { name: string }) {
  const [copied, setCopied] = useState(false)
  const url = globalThis.location.href
  const text = encodeURIComponent(`${name} na Kurio`)
  const external = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      network: 'linkedin' as const,
    },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
      network: 'x' as const,
    },
  ]
  const linkClass =
    'text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-label font-bold text-foreground">Compartilhar este NFT:</span>
      <a
        href={`mailto:?subject=${text}&body=${encodeURIComponent(url)}`}
        className={linkClass}
        aria-label="Compartilhar por e-mail"
      >
        <Icon name="mail" size={18} />
      </a>
      {external.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label={`Compartilhar no ${item.label} (abre em nova aba)`}
        >
          <SocialIcon network={item.network} width={18} height={18} />
        </a>
      ))}
      <button
        type="button"
        className={`${linkClass} text-label underline-offset-4 hover:underline`}
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true)
          })
        }}
      >
        {copied ? 'Link copiado' : 'Copiar link'}
      </button>
      <span className="sr-only" role="status">
        {copied ? 'Link copiado para a área de transferência.' : ''}
      </span>
    </div>
  )
}

export function NftTabs({ nft }: { nft: NftDetail }) {
  return (
    <Tabs defaultValue="details">
      <TabsList
        aria-label="Informações do NFT"
        className="h-auto w-full justify-start gap-6 border-b border-border-soft"
      >
        <TabsTrigger
          value="details"
          className="flex-none px-0 pb-3 text-left text-body whitespace-normal sm:text-body-lg"
        >
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="flex-1 px-0 pb-3 text-left text-body whitespace-normal sm:flex-none sm:text-body-lg"
        >
          Avaliações de colecionadores ({nft.rating.count})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="flex flex-col gap-5 pt-5 text-label text-foreground-secondary">
        <p className="leading-6">{nft.longDescription}</p>
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>Cunhado na {NETWORK[nft.network]} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos
              mercados compatíveis.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              {shortAddress(nft.contract.address)} • Contrato inteligente {nft.contract.standard} verificado.
            </dd>
          </div>
        </dl>
      </TabsContent>
      <TabsContent value="reviews" className="pt-5">
        <ul className="flex flex-col gap-4">
          {nft.reviews.map((review) => (
            <li key={`${review.author}-${review.createdAt}`} className="rounded-sm bg-surface p-4">
              <p className="text-label font-bold text-foreground">
                {review.author}{' '}
                <span className="font-regular text-foreground-secondary">— nota {review.rating} de 5</span>
              </p>
              <p className="text-label text-foreground-secondary">{review.text}</p>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  )
}
