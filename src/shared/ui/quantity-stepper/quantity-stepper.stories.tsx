import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent } from 'storybook/test'

import { QuantityStepper } from './quantity-stepper'

const meta = {
  title: 'Components/QuantityStepper',
  component: QuantityStepper,
  tags: ['visual'],
  args: { label: 'Quantidade de Emerald Ape #042', max: 5, defaultValue: 1, onChange: fn() },
  argTypes: { max: { control: { type: 'number', min: 0, max: 50 } }, min: { control: { type: 'number', min: 0 } } },
} satisfies Meta<typeof QuantityStepper>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Aumentar quantidade' }))
    await expect(args.onChange).toHaveBeenCalledWith(2)
    await expect(canvas.getByRole('spinbutton')).toHaveValue(2)
  },
}

export const AtLimit: Story = {
  name: 'No limite (com explicação)',
  args: { defaultValue: 3, max: 3, limitHint: 'Máximo de 3 por pedido para esta edição' },
}

export const Unavailable: Story = { name: 'Edição esgotada', args: { max: 0, limitHint: 'Edição esgotada' } }

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState(4)
    return (
      <div className="flex flex-col gap-2">
        <QuantityStepper {...args} value={value} onChange={setValue} max={9} />
        <output className="text-caption text-foreground-secondary">Valor no estado do pai: {value}</output>
      </div>
    )
  },
}
