import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'

import { Button, Icon } from '@/shared/ui'

import { sampleDetail } from './fixtures'
import { Gallery } from './gallery'
import { NftFacts, NftTabs } from './nft-info'
import { PurchasePanel } from './purchase-panel'
import { Rating } from './rating'

const meta = {
  title: 'Nft/Detail',
  component: PurchasePanel,
  tags: ['visual'],
  parameters: { layout: 'padded' },
  args: {
    nftName: sampleDetail.name,
    editions: sampleDetail.editions,
    edition: sampleDetail.editions[2],
    onEditionChange: fn(),
    quantity: 1,
    onQuantityChange: fn(),
    onBuy: fn(),
    onAddToCart: fn(),
    isSubmitting: false,
    error: undefined,
    favorite: (
      <Button variant="outline">
        <Icon name="heart" size={18} /> Favoritar
      </Button>
    ),
  },
  decorators: [(Story) => <div className="w-[595px]">{Story()}</div>],
} satisfies Meta<typeof PurchasePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Purchase: Story = {
  name: 'Painel de compra',
  render: (args) => {
    const [editionId, setEditionId] = useState(args.edition?.id)
    return (
      <PurchasePanel
        {...args}
        edition={sampleDetail.editions.find((edition) => edition.id === editionId)}
        onEditionChange={setEditionId}
      />
    )
  },
}
export const SoldOut: Story = { name: 'Edição esgotada', args: { edition: sampleDetail.editions[0] } }
export const WithError: Story = { name: 'Erro de disponibilidade', args: { error: 'Disponível: até 3 por pedido' } }
export const Submitting: Story = { name: 'Adicionando', args: { isSubmitting: true } }

export const GalleryStory: Story = {
  name: 'Galeria',
  render: () => <Gallery name={sampleDetail.name} images={sampleDetail.gallery} />,
}
export const Info: Story = {
  name: 'Informações e abas',
  render: () => (
    <div className="flex flex-col gap-6">
      <Rating average={sampleDetail.rating.average} count={sampleDetail.rating.count} />
      <NftFacts nft={sampleDetail} />
      <NftTabs nft={sampleDetail} />
    </div>
  ),
}
