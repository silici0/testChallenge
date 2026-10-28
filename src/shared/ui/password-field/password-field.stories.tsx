import type { Meta, StoryObj } from '@storybook/react-vite'

import { PasswordField } from './password-field'

const meta = {
  title: 'Components/PasswordField',
  component: PasswordField,
  tags: ['visual'],
  args: { label: 'Senha', placeholder: 'Senha' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof PasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithError: Story = { args: { error: 'E-mail ou senha incorretos', defaultValue: 'errada' } }
