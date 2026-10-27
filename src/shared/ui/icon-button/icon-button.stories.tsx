import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'

import { iconNames } from '../icon'
import { IconButton } from './icon-button'

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['visual'],
  args: { icon: 'search', label: 'Buscar', onClick: fn() },
  argTypes: {
    icon: { control: 'select', options: iconNames },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Search: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Buscar' }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}
export const CartWithCount: Story = { args: { icon: 'cart', label: 'Carrinho', count: 6 } }
export const FavoritePressed: Story = { args: { icon: 'heart', label: 'Favoritar', pressed: true } }
export const Small: Story = { args: { icon: 'trash', label: 'Remover item', size: 'sm' } }
