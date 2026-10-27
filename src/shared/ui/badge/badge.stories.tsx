import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './badge'

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['visual'],
  args: { children: 'Raro', variant: 'rare' },
  argTypes: { variant: { control: 'inline-radio', options: ['rare', 'count', 'status', 'success', 'danger'] } },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Rare: Story = {}
export const Count: Story = { args: { variant: 'count', children: '6' } }
export const Status: Story = { args: { variant: 'status', children: 'Esgotado' } }
export const Success: Story = { args: { variant: 'success', children: 'Confirmado' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Recusado' } }
