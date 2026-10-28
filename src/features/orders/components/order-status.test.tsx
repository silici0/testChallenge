import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { sampleOrder } from './fixtures'
import { OrderDeclined, OrderPending, OrderReceipt } from './order-status'

describe('estados do pedido', () => {
  it('pendente não mostra recibo e anuncia a espera', () => {
    render(<OrderPending order={{ ...sampleOrder, status: 'pending', transaction: null }} />)
    expect(screen.getByRole('heading', { name: 'Aguardando confirmação da rede' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Aguardando confirmação')
    expect(screen.queryByText('Detalhes da transação')).not.toBeInTheDocument()
  })

  it('recibo confirmado com transação, itens, taxa e total', () => {
    render(<OrderReceipt order={sampleOrder} explorerLink={<a href="/explorer">Ver no explorador</a>} />)
    expect(screen.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeInTheDocument()
    expect(screen.getByText('0xa91f…e82c')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Itens comprados' })).toHaveTextContent('Emerald Ape #042')
    expect(screen.getByText('2.396 ETH', { selector: 'data' })).toBeInTheDocument()
  })

  it('recusado mostra o motivo', () => {
    render(
      <OrderDeclined
        order={{ ...sampleOrder, status: 'declined', declineReason: 'Saldo insuficiente' }}
        action={null}
      />,
    )
    expect(screen.getByText('Saldo insuficiente')).toBeInTheDocument()
  })
})
