import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'

import { Slider } from './slider'

/** Faixa de preço com duas alças nomeadas (0,02–12,30 ETH, em centésimos). */
const meta = {
  title: 'Primitives/Slider',
  component: Slider,
  tags: ['visual'],
  args: {
    min: 2,
    max: 1230,
    step: 1,
    defaultValue: [2, 1230],
    thumbLabels: ['Preço mínimo', 'Preço máximo'],
    onValueChange: fn(),
  },
  decorators: [(Story) => <div className="w-64">{Story()}</div>],
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const PriceRange: Story = {
  name: 'Faixa de preço',
  play: async ({ args, canvas }) => {
    canvas.getByRole('slider', { name: 'Preço máximo' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(args.onValueChange).toHaveBeenCalledWith([2, 1229])
  },
}

export const Single: Story = { args: { defaultValue: [50], min: 0, max: 100, thumbLabels: ['Volume'] } }
