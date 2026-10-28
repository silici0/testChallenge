import type { Meta, StoryObj } from '@storybook/react-vite'

import { IconButton } from '@/shared/ui'

import { sampleNfts } from './fixtures'
import { NftCard } from './nft-card'
import { NftGrid } from './nft-grid'

const renderLink = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <a href="#detalhe" className={className}>
    {children}
  </a>
)

const meta = {
  title: 'Catalog/NftCard',
  component: NftCard,
  tags: ['visual'],
  args: { nft: sampleNfts[0]!, renderLink },
  decorators: [(Story) => <div className="w-card">{Story()}</div>],
} satisfies Meta<typeof NftCard>

export default meta
type Story = StoryObj<typeof meta>

export const Rare: Story = {}
export const Regular: Story = { args: { nft: sampleNfts[1]! } }
export const SoldOut: Story = { name: 'Esgotado', args: { nft: sampleNfts[2]! } }
export const WithFavorite: Story = {
  name: 'Com favorito',
  args: {
    action: <IconButton icon="heart" label="Favoritar Emerald Ape #042" size="sm" className="bg-background/80" />,
  },
}

export const Grid: Story = {
  name: 'Grid (3 colunas)',
  decorators: [(Story) => <div className="w-[842px]">{Story()}</div>],
  render: () => (
    <NftGrid items={sampleNfts} isLoading={false} renderCard={(nft) => <NftCard nft={nft} renderLink={renderLink} />} />
  ),
}

export const GridLoading: Story = {
  name: 'Grid carregando (skeleton)',
  decorators: [(Story) => <div className="w-[842px]">{Story()}</div>],
  render: () => <NftGrid items={undefined} isLoading skeletonCount={3} renderCard={() => null} />,
}
