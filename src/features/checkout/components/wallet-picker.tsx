import { Link } from '@tanstack/react-router'

import type { Wallet } from '@/contracts'
import { NETWORK_LABELS, PROVIDER_LABELS } from '@/features/wallets/components/labels'
import { cn } from '@/shared/lib/cn'
import { Badge, Button } from '@/shared/ui'

export interface WalletPickerProps {
  wallets: Wallet[]
  selectedId: string | undefined
  onSelect: (walletId: string) => void
  onConnect: (wallet: Wallet) => void
  onDisconnect: (wallet: Wallet) => void
  isConnecting: boolean
  error: string | undefined
}

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

/** Carteiras cadastradas (Figma mobile: “Carteira conectada”); rede vem da carteira escolhida. */
export function WalletPicker({
  wallets,
  selectedId,
  onSelect,
  onConnect,
  onDisconnect,
  isConnecting,
  error,
}: WalletPickerProps) {
  if (wallets.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-sm bg-surface p-4">
        <p className="text-label text-foreground">Você ainda não cadastrou uma carteira.</p>
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to="/account/wallets">Cadastrar carteira</Link>
        </Button>
      </div>
    )
  }
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-body-lg font-bold text-foreground">Carteira e rede</legend>
      {wallets.map((wallet) => {
        const selected = wallet.id === selectedId
        const connected = wallet.connection === 'connected'
        return (
          <div
            key={wallet.id}
            className={cn(
              'flex flex-col gap-3 rounded-sm border bg-surface p-4',
              selected ? 'border-primary' : 'border-border-soft',
            )}
          >
            <div className="flex items-start gap-3">
              <input
                id={`wallet-${wallet.id}`}
                type="radio"
                name="checkout-wallet"
                checked={selected}
                onChange={() => onSelect(wallet.id)}
                className="mt-1 accent-[var(--color-primary)]"
              />
              <label htmlFor={`wallet-${wallet.id}`} className="flex flex-1 cursor-pointer flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 text-body font-bold text-foreground">
                  {wallet.displayName}
                  {connected ? <Badge variant="success">Conectada</Badge> : <Badge>Desconectada</Badge>}
                </span>
                <span className="text-caption text-foreground-secondary">
                  {wallet.ensName ? `${wallet.ensName}.eth · ` : ''}
                  {shortAddress(wallet.address)}
                </span>
                <span className="text-caption text-foreground-secondary">
                  Rede {NETWORK_LABELS[wallet.network]} · {PROVIDER_LABELS[wallet.provider]}
                </span>
              </label>
            </div>
            {selected && (
              <div className="flex flex-wrap items-center gap-3">
                {connected ? (
                  <Button size="sm" variant="ghost" onClick={() => onDisconnect(wallet)}>
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onConnect(wallet)}
                    isLoading={isConnecting}
                    loadingText="Aguardando a carteira…"
                  >
                    Conectar {PROVIDER_LABELS[wallet.provider]}
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      })}
      {error && (
        <p role="alert" className="text-label text-danger-text">
          {error}
        </p>
      )}
      <Link
        to="/account/wallets"
        className="self-start text-label text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        Usar outra carteira?
      </Link>
    </fieldset>
  )
}
