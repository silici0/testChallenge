import type { Meta, StoryObj } from '@storybook/react-vite'

import { SocialIcon } from './social-icon'

const meta = {
  title: 'Components/SocialIcon',
  component: SocialIcon,
  tags: ['autodocs', 'visual'],
  args: { network: 'facebook' },
  argTypes: { network: { control: 'select', options: ['facebook', 'instagram', 'x', 'linkedin', 'youtube'] } },
  decorators: [(Story) => <div className="text-primary">{Story()}</div>],
} satisfies Meta<typeof SocialIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {}

/** Conjunto do rodapé (Figma). */
export const All: Story = {
  render: () => (
    <div className="flex gap-3 text-primary">
      {(['facebook', 'instagram', 'x', 'linkedin', 'youtube'] as const).map((network) => (
        <SocialIcon key={network} network={network} width={24} height={24} />
      ))}
    </div>
  ),
}
