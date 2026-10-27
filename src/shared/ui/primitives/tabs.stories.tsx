import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

/** Abas com sublinhado laranja no item ativo (“Todos os NFTs”, “Detalhes do NFT”). */
const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
  tags: ['visual'],
  args: { defaultValue: 'all' },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const CatalogTabs: Story = {
  name: 'Abas do catálogo',
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Catálogo">
        <TabsTrigger value="all">Todos os NFTs</TabsTrigger>
        <TabsTrigger value="new">Novos lançamentos</TabsTrigger>
        <TabsTrigger value="trending">Em alta</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="pt-4 text-label text-foreground-secondary">
        63 NFTs
      </TabsContent>
      <TabsContent value="new" className="pt-4 text-label text-foreground-secondary">
        12 lançamentos
      </TabsContent>
      <TabsContent value="trending" className="pt-4 text-label text-foreground-secondary">
        9 em alta
      </TabsContent>
    </Tabs>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Em alta' }))
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('9 em alta')
  },
}
