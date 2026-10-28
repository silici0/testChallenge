import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

const meta = {
  title: 'Auth/Forms',
  component: LoginForm,
  tags: ['visual'],
  args: { onSubmit: fn(() => Promise.resolve()) },
  decorators: [(Story) => <div className="w-[436px] rounded-sm bg-surface p-8">{Story()}</div>],
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const Login: Story = { name: 'Entrar' }
export const Register: Story = {
  name: 'Criar conta',
  render: () => <RegisterForm onSubmit={fn(() => Promise.resolve())} />,
}
