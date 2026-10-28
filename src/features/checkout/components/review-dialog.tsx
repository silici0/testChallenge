import type { Buyer, Quote, Wallet } from '@/contracts'
import { NETWORK_LABELS, PROVIDER_LABELS } from '@/features/wallets/components/labels'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EthAmount,
} from '@/shared/ui'

import type { QuoteChange } from '../quote-diff'
import { QuoteChangesNotice } from './quote-items'

export interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buyer: Buyer
  wallet: Wallet
  quote: Quote
  changes: QuoteChange[]
  onConfirm: () => void
  /** Aceita a cotação atual como nova base de revisão (após mudança de preço/disponibilidade). */
  onAcceptChanges: () => void
  isSubmitting: boolean
  error: string | undefined
}

/** Revisão antes do envio (§3.3): confirmação só com a cotação revisada ainda válida. */
export function ReviewDialog(props: ReviewDialogProps) {
  const { open, onOpenChange, buyer, wallet, quote, changes, onConfirm, onAcceptChanges, isSubmitting, error } = props
  const stale = changes.length > 0
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Revisar pedido</DialogTitle>
          <DialogDescription>Confira os dados antes de confirmar a compra.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-label">
          <dt className="text-foreground-secondary">Colecionador</dt>
          <dd className="text-foreground">
            {buyer.displayName} ({buyer.email})
          </dd>
          <dt className="text-foreground-secondary">Carteira</dt>
          <dd className="text-foreground">
            {wallet.displayName} · {PROVIDER_LABELS[wallet.provider]}
          </dd>
          <dt className="text-foreground-secondary">Rede</dt>
          <dd className="text-foreground">{NETWORK_LABELS[quote.network]}</dd>
          <dt className="text-foreground-secondary">Itens</dt>
          <dd className="text-foreground">{quote.items.reduce((sum, item) => sum + item.quantity, 0)}</dd>
          <dt className="text-foreground-secondary">Total</dt>
          <dd>
            <EthAmount value={quote.totalEth} size="sm" />
          </dd>
        </dl>
        <QuoteChangesNotice changes={changes} />
        {stale && (
          <Button variant="outline" onClick={onAcceptChanges}>
            Revisar com os novos valores
          </Button>
        )}
        {wallet.connection !== 'connected' && (
          <p role="alert" className="text-label text-danger-text">
            A carteira foi desconectada. Volte e conecte-a para confirmar.
          </p>
        )}
        {error && (
          <p role="alert" className="text-label text-danger-text">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            fullWidth
            size="lg"
            onClick={onConfirm}
            isLoading={isSubmitting}
            loadingText="Confirmando…"
            aria-disabled={stale || wallet.connection !== 'connected' || undefined}
          >
            Confirmar compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
