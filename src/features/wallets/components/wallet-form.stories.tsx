import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { WalletForm } from './wallet-form'

const meta = {
  title: 'Wallets/WalletForm',
  component: WalletForm,
  tags: ['visual'],
  parameters: { layout: 'padded' },
  args: {
    walletRole: 'primary',
    initial: {
      displayName: 'Principal',
      nickname: 'Cofre da Ana',
      network: 'ethereum',
      address: '0xA91F2c3b4D5e6F708192a3B4c5D6e7F80912E82C',
      provider: 'metamask',
      ensName: 'ana',
    },
    onSubmit: fn(() => Promise.resolve()),
  },
  decorators: [(Story) => <div className="w-[794px]">{Story()}</div>],
} satisfies Meta<typeof WalletForm>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Empty: Story = {
  name: 'Nova carteira',
  args: { walletRole: 'secondary', initial: undefined, submitLabel: 'Adicionar carteira' },
}
