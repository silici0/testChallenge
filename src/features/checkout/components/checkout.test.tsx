import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Quote, Wallet } from '@/contracts'

import { diffQuotes } from '../quote-diff'
import { QuoteChangesNotice } from './quote-items'
import { WalletPicker } from './wallet-picker'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const quote: Quote = {
  id: 'qt_1',
  cartVersion: 1,
  network: 'ethereum',
  items: [{ itemId: 'i1', nftId: 'n1', editionId: 'e1', quantity: 2, unitPriceEth: '1', lineTotalEth: '2' }],
  subtotalEth: '2',
  discountEth: '0',
  networkFeeEth: '0.016',
  totalEth: '2.016',
  coupon: null,
  issues: [],
  expiresAt: '2099-01-01T00:00:00.000Z',
}

describe('diffQuotes', () => {
  it('detecta preço, total e itens indisponíveis', () => {
    const changed = {
      ...quote,
      id: 'qt_2',
      items: [{ ...quote.items[0]!, unitPriceEth: '1.5', lineTotalEth: '3' }],
      subtotalEth: '3',
      totalEth: '3.016',
    }
    expect(diffQuotes(quote, changed, { i1: 'Emerald' })).toEqual([
      { label: 'Emerald: preço', previous: '1 ETH', current: '1.5 ETH' },
      { label: 'Total', previous: '2.016 ETH', current: '3.016 ETH' },
    ])
    expect(diffQuotes(quote, { ...quote, items: [] }, { i1: 'Emerald' })[0]?.label).toBe('Emerald: indisponível')
    expect(diffQuotes(quote, quote, {})).toEqual([])
  })

  it('aviso é anunciado como alerta', () => {
    render(<QuoteChangesNotice changes={[{ label: 'Total', previous: '1 ETH', current: '2 ETH' }]} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Total: 1 ETH → 2 ETH')
  })
})

const wallet: Wallet = {
  id: 'w1',
  role: 'primary',
  displayName: 'Principal',
  nickname: null,
  network: 'ethereum',
  address: '0xA91F2c3b4D5e6F708192a3B4c5D6e7F80912E82C',
  provider: 'metamask',
  ensName: 'ana',
  connection: 'disconnected',
  version: 1,
}

describe('WalletPicker', () => {
  it('mostra status em texto e conecta a carteira selecionada', async () => {
    const onConnect = vi.fn()
    render(
      <WalletPicker
        wallets={[wallet]}
        selectedId="w1"
        onSelect={vi.fn()}
        onConnect={onConnect}
        onDisconnect={vi.fn()}
        isConnecting={false}
        error={undefined}
      />,
    )
    expect(screen.getByText('Desconectada')).toBeInTheDocument()
    expect(screen.getByText(/ana\.eth · 0xA91F…E82C/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Conectar MetaMask' }))
    expect(onConnect).toHaveBeenCalledWith(wallet)
  })

  it('sem carteiras, oferece o cadastro', () => {
    render(
      <WalletPicker
        wallets={[]}
        selectedId={undefined}
        onSelect={vi.fn()}
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
        isConnecting={false}
        error={undefined}
      />,
    )
    expect(screen.getByRole('link', { name: 'Cadastrar carteira' })).toHaveAttribute('href', '/account/wallets')
  })
})
