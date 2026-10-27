import type { Meta, StoryObj } from '@storybook/react-vite'

import { EthAmount } from './eth-amount'

const meta = {
  title: 'Components/EthAmount',
  component: EthAmount,
  tags: ['visual'],
  args: { value: '1.19' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['accent', 'default', 'muted'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof EthAmount>

export default meta
type Story = StoryObj<typeof meta>

export const Price: Story = {}
export const Large: Story = { args: { size: 'lg', value: '26.846' } }
export const PriceChanged: Story = {
  name: 'Preço alterado (tempo real)',
  args: { value: '0.95', previousValue: '0.80' },
}
export const Discount: Story = { args: { value: '2.683', negative: true, tone: 'default' } }
export const HighPrecision: Story = { args: { value: '0.000000000000000001', tone: 'muted' } }
