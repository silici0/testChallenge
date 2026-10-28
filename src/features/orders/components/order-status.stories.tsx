import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@/shared/ui'

import { sampleOrder } from './fixtures'
import { OrderDeclined, OrderPending, OrderReceipt } from './order-status'

const meta = {
  title: 'Orders/Status',
  component: OrderReceipt,
  tags: ['visual'],
  parameters: { layout: 'padded' },
  args: { order: sampleOrder, explorerLink: <Button>Ver no explorador (simulado)</Button> },
} satisfies Meta<typeof OrderReceipt>

export default meta
type Story = StoryObj<typeof meta>

export const Confirmed: Story = {}
export const Pending: Story = {
  render: () => <OrderPending order={{ ...sampleOrder, status: 'pending', transaction: null }} />,
}
export const Declined: Story = {
  render: () => (
    <OrderDeclined
      order={{ ...sampleOrder, status: 'declined', declineReason: 'Saldo insuficiente na carteira (simulado)' }}
      action={<Button>Voltar ao carrinho</Button>}
    />
  ),
}
