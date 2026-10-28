import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@/shared/ui'

import { BlogSection, FeaturedBanner, PromoCard } from './editorial'
import { sampleNfts } from './fixtures'
import { Hero } from './hero'

const link = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <a href="#detalhe" className={className}>
    {children}
  </a>
)

const meta = {
  title: 'Catalog/Editorial',
  component: Hero,
  tags: ['visual'],
  parameters: { layout: 'padded' },
  args: { slides: sampleNfts.slice(0, 3), cta: <Button uppercase>Explorar</Button> },
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

export const HeroDesktop: Story = { name: 'Hero' }
export const HeroLoading: Story = { name: 'Hero carregando', args: { slides: undefined } }

export const Featured: Story = {
  name: 'NFT em destaque',
  render: () => (
    <div className="w-sidebar">
      <FeaturedBanner nft={sampleNfts[0]} renderLink={link} />
    </div>
  ),
}

export const Promo: Story = {
  name: 'Card de promoção',
  render: () => (
    <div className="w-[586px]">
      <PromoCard
        title="Lançamentos gênesis de edição limitada"
        description="Colecione edições escassas diretamente dos criadores antes da revelação pública."
        nft={sampleNfts[0]}
        cta={<Button>Explorar</Button>}
      />
    </div>
  ),
}

export const Blog: Story = { name: 'Diário da Cunhagem', render: () => <BlogSection covers={sampleNfts} /> }
