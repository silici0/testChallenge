import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { AvatarField } from './avatar-field'
import { PasswordForm } from './password-form'
import { ProfileForm } from './profile-form'

const profile = {
  id: 'usr_ana',
  displayName: 'Ana Collector',
  username: 'ana.collector',
  email: 'ana@example.test',
  ensName: 'ana',
  walletNickname: 'Cofre da Ana',
  avatarUrl: null,
  version: 1,
}

const meta = {
  title: 'Account/Forms',
  component: ProfileForm,
  tags: ['visual'],
  parameters: { layout: 'padded' },
  args: { profile, onSubmit: fn(() => Promise.resolve()) },
  decorators: [(Story) => <div className="w-[794px]">{Story()}</div>],
} satisfies Meta<typeof ProfileForm>

export default meta
type Story = StoryObj<typeof meta>

export const Profile: Story = { name: 'Dados do perfil' }
export const Password: Story = {
  name: 'Alterar senha',
  render: () => <PasswordForm onSubmit={fn(() => Promise.resolve())} />,
}
export const Avatar: Story = {
  render: () => (
    <AvatarField
      avatarUrl={null}
      onUpload={fn(() => Promise.resolve())}
      onRemove={fn(() => Promise.resolve())}
      isPending={false}
    />
  ),
}
