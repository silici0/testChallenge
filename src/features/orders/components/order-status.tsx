import type { ReactNode } from 'react'

import type { Order } from '@/contracts'
import { NETWORK_LABELS } from '@/features/wallets/components/labels'
import { EthAmount, Icon, NftImage, Spinner } from '@/shared/ui'

const shortHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso),
  )

function Card({ children, labelledBy }: { children: ReactNode; labelledBy: string }) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="mx-auto flex w-full max-w-[580px] flex-col overflow-hidden rounded-sm bg-surface"
    >
      {children}
    </section>
  )
}

export function OrderPending({ order }: { order: Order }) {
  return (
    <Card labelledBy="order-title">
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <Spinner size={40} className="text-primary" label="Aguardando confirmação" />
        <h1 id="order-title" className="text-title font-bold text-foreground">
          Aguardando confirmação da rede
        </h1>
        <p className="text-label text-foreground-secondary">
          Pedido {order.id}. Você pode sair desta página: o estado será recuperado quando voltar.
        </p>
      </div>
    </Card>
  )
}

export function OrderDeclined({ order, action }: { order: Order; action: ReactNode }) {
  return (
    <Card labelledBy="order-title">
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <Icon name="alert-triangle" size={48} className="text-danger-text" />
        <h1 id="order-title" className="text-title font-bold text-foreground">
          Pagamento recusado
        </h1>
        <p className="text-label text-foreground-secondary">{order.declineReason}</p>
        <p className="text-label text-foreground">Seus itens continuam no carrinho.</p>
        {action}
      </div>
    </Card>
  )
}

/** Recibo (Figma: Confirmação de Pedido): snapshot gravado no pedido — mudanças no catálogo não o alteram. */
export function OrderReceipt({ order, explorerLink }: { order: Order; explorerLink: ReactNode }) {
  const { receipt } = order
  return (
    <Card labelledBy="order-title">
      <div className="flex flex-col items-center gap-4 border-b border-primary p-8 text-center">
        <Icon name="wallet" size={48} className="text-primary" />
        <h1 id="order-title" className="text-title font-bold text-primary">
          Seus NFTs agora estão na sua carteira
        </h1>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-b border-primary px-8 py-4 text-label sm:grid-cols-4">
        <div>
          <dt className="font-bold text-foreground">ID da transação</dt>
          <dd className="text-foreground-secondary">{order.transaction ? shortHash(order.transaction.hash) : '—'}</dd>
        </div>
        <div>
          <dt className="font-bold text-foreground">Data</dt>
          <dd className="text-foreground-secondary">{formatDate(order.updatedAt)}</dd>
        </div>
        <div>
          <dt className="font-bold text-foreground">Total</dt>
          <dd className="text-foreground-secondary">{receipt.totalEth} ETH</dd>
        </div>
        <div>
          <dt className="font-bold text-foreground">Carteira</dt>
          <dd className="text-foreground-secondary">{shortHash(receipt.walletAddress)}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-4 p-8">
        <h2 className="text-body font-bold text-foreground">Detalhes da transação</h2>
        <ul className="flex flex-col gap-3" aria-label="Itens comprados">
          {receipt.items.map((item) => (
            <li
              key={`${item.nftId}-${item.editionId}`}
              className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-3"
            >
              <NftImage image={{ ...item.image, alt: '' }} sizes="56px" className="rounded-sm" />
              <span className="flex flex-col">
                <span className="text-label font-bold text-foreground">{item.name}</span>
                <span className="text-caption text-foreground-secondary">
                  ID do token: {item.tokenId} · Edição {item.editionLabel}
                </span>
              </span>
              <span className="text-label text-foreground-secondary">(x {item.quantity})</span>
              <EthAmount value={item.lineTotalEth} size="sm" />
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-border-soft pt-4 text-label">
          {receipt.discountEth !== '0' && (
            <div className="flex justify-between">
              <dt className="text-foreground">Desconto{receipt.coupon ? ` (${receipt.coupon})` : ''}</dt>
              <dd>
                <EthAmount value={receipt.discountEth} negative tone="default" size="sm" />
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-foreground">Taxa de rede</dt>
            <dd>
              <EthAmount value={receipt.networkFeeEth} tone="default" size="sm" />
            </dd>
          </div>
          <div className="flex justify-between font-bold">
            <dt className="text-foreground">Total</dt>
            <dd>
              <EthAmount value={receipt.totalEth} size="md" />
            </dd>
          </div>
        </dl>
        <p className="text-center text-label text-foreground-secondary">
          Transação confirmada na {NETWORK_LABELS[receipt.network]} (simulada). A propriedade foi transferida para sua
          carteira conectada.
        </p>
        <div className="self-center">{explorerLink}</div>
      </div>
    </Card>
  )
}
