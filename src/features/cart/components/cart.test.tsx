import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CartLine } from './cart-line'
import { CartSummary, CartSummarySkeleton } from './cart-summary'
import { CouponForm } from './coupon-form'
import { sampleCart } from './fixtures'

const link = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <a href="/nfts/x" className={className}>
    {children}
  </a>
)
const [first] = sampleCart.items

describe('CartLine', () => {
  it('mostra preço, total e permite remover', async () => {
    const onRemove = vi.fn()
    render(
      <ul>
        <CartLine
          item={first!}
          issue={undefined}
          quantity={2}
          onQuantityChange={vi.fn()}
          onRemove={onRemove}
          renderLink={link}
        />
      </ul>,
    )
    expect(screen.getByRole('listitem', { name: 'Emerald Ape #042' })).toBeInTheDocument()
    expect(screen.getByText('2.38 ETH')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('prévia do total durante o debounce é exata (bigint)', () => {
    render(
      <ul>
        <CartLine
          item={first!}
          issue={undefined}
          quantity={3}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
          renderLink={link}
        />
      </ul>,
    )
    expect(screen.getByText('3.57 ETH')).toBeInTheDocument()
  })

  it('preço alterado e esgotado são comunicados em texto', () => {
    const { rerender } = render(
      <ul>
        <CartLine
          item={first!}
          issue={{ type: 'PRICE_CHANGED', itemId: first!.id, previousEth: '1.19', currentEth: '1.29' }}
          quantity={2}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
          renderLink={link}
        />
      </ul>,
    )
    expect(screen.getByText('Preço alterado: 1.19 → 1.29 ETH')).toBeInTheDocument()
    rerender(
      <ul>
        <CartLine
          item={first!}
          issue={{ type: 'SOLD_OUT', itemId: first!.id }}
          quantity={2}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
          renderLink={link}
        />
      </ul>,
    )
    expect(screen.getByText(/Edição esgotada/)).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toBeDisabled()
  })
})

describe('CartSummary', () => {
  it('lista os valores da API e destaca desconto aplicado', () => {
    render(
      <CartSummary
        summary={{
          ...sampleCart.summary,
          discountEth: '2.683',
          totalEth: '24.163',
          coupon: { code: 'JUNGLE10', status: 'applied', description: '10%' },
        }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Resumo da carteira' })).toBeInTheDocument()
    expect(screen.getByText('Desconto (JUNGLE10)')).toBeInTheDocument()
    expect(screen.getByText('− 2.683 ETH')).toBeInTheDocument()
    expect(screen.getByText('24.163 ETH')).toBeInTheDocument()
  })

  it('skeleton anuncia o carregamento do resumo', () => {
    render(<CartSummarySkeleton />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando resumo do carrinho')
  })
})

describe('CouponForm', () => {
  it('envia o código em maiúsculas e mostra erro no campo', async () => {
    const onApply = vi.fn()
    const { rerender } = render(
      <CouponForm appliedCode={null} onApply={onApply} onRemove={vi.fn()} isPending={false} error={undefined} />,
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Código promocional' }), 'jungle10')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onApply).toHaveBeenCalledWith('JUNGLE10')

    rerender(
      <CouponForm
        appliedCode={null}
        onApply={onApply}
        onRemove={vi.fn()}
        isPending={false}
        error="Este cupom expirou"
      />,
    )
    expect(screen.getByRole('textbox', { name: 'Código promocional' })).toHaveAccessibleDescription(
      'Este cupom expirou',
    )
  })

  it('cupom aplicado pode ser removido', async () => {
    const onRemove = vi.fn()
    render(
      <CouponForm appliedCode="JUNGLE10" onApply={vi.fn()} onRemove={onRemove} isPending={false} error={undefined} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remover cupom' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })
})
