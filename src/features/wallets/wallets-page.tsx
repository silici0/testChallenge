import { useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useId, useState } from 'react'

import type { Wallet, WalletInput } from '@/contracts'
import { Badge, Button, Checkbox, ErrorState, Skeleton, SkeletonRegion } from '@/shared/ui'

import { walletsQuery } from './api'
import { WalletForm } from './components/wallet-form'
import { useWalletMutations } from './use-wallet-mutations'

const toInput = ({ role, displayName, nickname, network, address, provider, ensName }: Wallet): WalletInput => ({
  role,
  displayName,
  nickname,
  network,
  address,
  provider,
  ensName,
})

function ConnectionBadge({ wallet }: { wallet: Wallet }) {
  return wallet.connection === 'connected' ? <Badge variant="success">Conectada</Badge> : <Badge>Desconectada</Badge>
}

function SectionHeader({
  id,
  title,
  wallet,
  action,
}: {
  id: string
  title: string
  wallet: Wallet | undefined
  action?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="flex items-center gap-3 text-body-lg font-bold text-foreground">
          {title}
          {wallet && <ConnectionBadge wallet={wallet} />}
        </h2>
        <p className="text-caption text-foreground-secondary">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
      </div>
      {action}
    </header>
  )
}

/** Dados iniciais da secundária: a existente, ou uma cópia editável da principal. */
function secondaryInitial(
  primary: Wallet | undefined,
  secondary: Wallet | undefined,
  copyPrimary: boolean,
): WalletInput | undefined {
  if (secondary) return toInput(secondary)
  if (copyPrimary && primary) return { ...toInput(primary), role: 'secondary', displayName: 'Reserva' }
  return undefined
}

function CopyPrimaryOption({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <label htmlFor={id} className="text-label text-foreground">
        Igual à carteira principal (copiar dados para editar)
      </label>
    </div>
  )
}

interface SecondaryWalletProps {
  primary: Wallet | undefined
  secondary: Wallet | undefined
  onSave: (input: WalletInput) => Promise<unknown>
}

function SecondaryWallet({ primary, secondary, onSave }: SecondaryWalletProps) {
  const [adding, setAdding] = useState(false)
  const [copyPrimary, setCopyPrimary] = useState(false)
  const editing = Boolean(secondary) || adding
  return (
    <section aria-labelledby="secondary-title" className="flex flex-col gap-5 border-t border-border-soft pt-8">
      <SectionHeader
        id="secondary-title"
        title="Carteira secundária"
        wallet={secondary}
        action={
          !editing && (
            <Button variant="ghost" onClick={() => setAdding(true)}>
              Adicionar
            </Button>
          )
        }
      />
      {editing ? (
        <>
          {!secondary && primary && <CopyPrimaryOption checked={copyPrimary} onChange={setCopyPrimary} />}
          <WalletForm
            key={`${secondary?.id ?? 'new'}-${String(copyPrimary)}`}
            walletRole="secondary"
            initial={secondaryInitial(primary, secondary, copyPrimary)}
            onSubmit={onSave}
            submitLabel={secondary ? 'Salvar carteira' : 'Adicionar carteira'}
          />
        </>
      ) : (
        <p className="text-label text-foreground-secondary">Você ainda não adicionou uma carteira secundária.</p>
      )}
    </section>
  )
}

/** Carteiras principal e secundária (Figma: Desktop / Carteiras). */
export function WalletsPage() {
  const { user } = useRouteContext({ from: '/account' })
  const wallets = useQuery(walletsQuery(user.id))
  const { create, update } = useWalletMutations(user.id)
  const save = (existing: Wallet | undefined) => (input: WalletInput) =>
    existing ? update.mutateAsync({ walletId: existing.id, input }) : create.mutateAsync(input)

  if (wallets.isError && !wallets.data)
    return <ErrorState title="Não foi possível carregar as carteiras" onRetry={() => void wallets.refetch()} />
  if (!wallets.data) {
    return (
      <SkeletonRegion label="Carregando carteiras" className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[70px] w-full" />
        ))}
      </SkeletonRegion>
    )
  }
  const primary = wallets.data.items.find((wallet) => wallet.role === 'primary')
  const secondary = wallets.data.items.find((wallet) => wallet.role === 'secondary')
  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">Carteiras</h1>
      <section aria-labelledby="primary-title" className="flex flex-col gap-5">
        <SectionHeader id="primary-title" title="Carteira principal" wallet={primary} />
        <WalletForm
          key={primary?.id ?? 'new'}
          walletRole="primary"
          initial={primary ? toInput(primary) : undefined}
          onSubmit={save(primary)}
        />
      </section>
      <SecondaryWallet primary={primary} secondary={secondary} onSave={save(secondary)} />
    </div>
  )
}
