import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Wallet, WalletInput } from '@/contracts'
import { announce } from '@/shared/a11y'
import { queryKeys } from '@/shared/query'

import { walletsApi } from './api'

/** Cadastro/edição: a carteira retornada substitui a da lista; cotações dependem dela. */
export function useWalletMutations(userId: string) {
  const queryClient = useQueryClient()
  const onWallet = (wallet: Wallet) => {
    queryClient.setQueryData<{ items: Wallet[] }>(queryKeys.user.wallets(userId), (data) => {
      const items = data?.items.filter((item) => item.id !== wallet.id) ?? []
      return { items: [...items, wallet].sort((a, b) => a.role.localeCompare(b.role)) }
    })
    void queryClient.invalidateQueries({ queryKey: [...queryKeys.user.scope(userId), 'quote'] })
    announce('Carteira salva.', 'polite')
  }
  return {
    create: useMutation({ mutationFn: (input: WalletInput) => walletsApi.create(input), onSuccess: onWallet }),
    update: useMutation({
      mutationFn: ({ walletId, input }: { walletId: string; input: WalletInput }) => walletsApi.update(walletId, input),
      onSuccess: onWallet,
    }),
    connect: useMutation({
      mutationFn: ({ walletId, network }: { walletId: string; network: Wallet['network'] }) =>
        walletsApi.connect(walletId, network),
      onSuccess: onWallet,
    }),
    disconnect: useMutation({ mutationFn: (walletId: string) => walletsApi.disconnect(walletId), onSuccess: onWallet }),
  }
}
