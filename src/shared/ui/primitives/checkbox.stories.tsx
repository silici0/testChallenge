import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'

import { Checkbox } from './checkbox'

/** Filtros combináveis (comentário #4 do Figma): estado visível além da cor. */
const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['visual'],
  args: { onCheckedChange: fn() },
  render: (args) => (
    <div className="flex items-center gap-3 text-label text-foreground">
      <Checkbox id="category-digital-art" {...args} />
      <label htmlFor="category-digital-art">
        Arte digital <span className="text-foreground-secondary">(33)</span>
      </label>
    </div>
  ),
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('checkbox'))
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true)
  },
}
export const Checked: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
