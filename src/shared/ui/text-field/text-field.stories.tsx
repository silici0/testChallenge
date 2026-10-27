import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'

import { TextField } from './text-field'

const meta = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['visual'],
  args: { label: 'E-mail', placeholder: 'contato@email.com', type: 'email' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'E-mail' })
    await userEvent.type(input, 'ana@example.test')
    await expect(input).toHaveValue('ana@example.test')
  },
}

export const Required: Story = { args: { label: 'Nome de exibição', required: true, type: 'text', placeholder: '' } }

export const WithHint: Story = {
  args: {
    label: 'Senha',
    type: 'password',
    hint: 'Mínimo de 8 caracteres, com maiúscula, número e símbolo',
    placeholder: '',
  },
}

export const WithError: Story = {
  args: { label: 'E-mail', defaultValue: 'taken@example.test', error: 'Este e-mail já está cadastrado' },
}

export const WithSuffix: Story = {
  args: {
    label: 'Nome ENS',
    type: 'text',
    placeholder: 'seunome',
    endAdornment: <span className="text-label text-foreground-muted">.eth</span>,
  },
}
