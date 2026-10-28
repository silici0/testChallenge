import type { Meta, StoryObj } from '@storybook/react-vite'

import { UnavailableAction } from './unavailable-action'

const meta = {
  title: 'Components/UnavailableAction',
  component: UnavailableAction,
  tags: ['visual'],
  args: { children: 'Continuar com Google', variant: 'outline' },
} satisfies Meta<typeof UnavailableAction>

export default meta
type Story = StoryObj<typeof meta>

export const AsButton: Story = {}
export const AsText: Story = { args: { appearance: 'text', children: 'Central de ajuda' } }
