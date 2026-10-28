import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Button } from '@/shared/ui'

import { CartLine } from './cart-line'
import { CartSummary, CartSummarySkeleton } from './cart-summary'
import { CouponForm } from './coupon-form'
import { sampleCart } from './fixtures'

const link = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <a href="#nft" className={className}>
    {children}
  </a>
)
const [first] = sampleCart.items

const meta = {
  title: 'Cart/Components',
  component: CartSummary,
  tags: ['visual'],
  args: { summary: sampleCart.summary },
  decorators: [(Story) => <div className="w-[332px]">{Story()}</div>],
} satisfies Meta<typeof CartSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Summary: Story = {
  name: 'Resumo',
  args: {
    coupon: <CouponForm appliedCode={null} onApply={fn()} onRemove={fn()} isPending={false} error={undefined} />,
    actions: (
      <Button fullWidth size="lg">
        Conectar e finalizar
      </Button>
    ),
  },
}
export const SummaryLoading: Story = { name: 'Resumo carregando', render: () => <CartSummarySkeleton /> }
export const CouponError: Story = {
  name: 'Cupom expirado',
  args: {
    coupon: (
      <CouponForm appliedCode={null} onApply={fn()} onRemove={fn()} isPending={false} error="Este cupom expirou" />
    ),
  },
}

const line = (issue?: Parameters<typeof CartLine>[0]['issue']) => (
  <ul className="w-[782px]">
    <CartLine
      item={first!}
      issue={issue}
      quantity={first!.quantity}
      onQuantityChange={fn()}
      onRemove={fn()}
      renderLink={link}
    />
  </ul>
)
export const Line: Story = { name: 'Linha', decorators: [(Story) => <div>{Story()}</div>], render: () => line() }
export const LinePriceChanged: Story = {
  name: 'Linha com preço alterado',
  render: () => line({ type: 'PRICE_CHANGED', itemId: first!.id, previousEth: '1.19', currentEth: '1.29' }),
}
export const LineSoldOut: Story = {
  name: 'Linha esgotada',
  render: () => line({ type: 'SOLD_OUT', itemId: first!.id }),
}
