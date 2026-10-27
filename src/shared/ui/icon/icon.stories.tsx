import type { Meta, StoryObj } from '@storybook/react-vite'

import { Icon } from './icon'
import { iconNames } from './icon-registry'

const meta = {
  title: 'Foundations/Icon',
  component: Icon,
  tags: ['visual'],
  args: { name: 'cart', size: 24, className: 'text-primary' },
  argTypes: {
    name: { control: 'select', options: iconNames },
    size: { control: { type: 'range', min: 12, max: 64, step: 2 } },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithLabel: Story = { args: { name: 'heart', label: 'Favorito' } }

export const Gallery: Story = {
  render: (args) => (
    <ul className="grid grid-cols-6 gap-4">
      {iconNames.map((name) => (
        <li key={name} className="flex flex-col items-center gap-2 text-caption text-foreground-secondary">
          <Icon {...args} name={name} />
          <span>{name}</span>
        </li>
      ))}
    </ul>
  ),
}
