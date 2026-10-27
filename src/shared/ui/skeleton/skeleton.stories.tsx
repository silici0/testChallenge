import type { Meta, StoryObj } from '@storybook/react-vite'

import { Skeleton, SkeletonRegion } from './skeleton'

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['visual'],
  args: { className: 'h-6 w-48' },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Line: Story = {}

export const NftCardPlaceholder: Story = {
  name: 'Card de NFT (dimensões do Figma)',
  render: () => (
    <SkeletonRegion label="Carregando NFT" className="flex w-card flex-col gap-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-6 w-1/3" />
    </SkeletonRegion>
  ),
}
