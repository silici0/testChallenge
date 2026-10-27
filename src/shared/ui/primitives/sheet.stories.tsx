import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet'

/** Drawer usado para filtros e navegação no mobile. */
const meta = {
  title: 'Primitives/Sheet',
  component: Sheet,
  tags: ['visual', 'visual:page'],
  parameters: { layout: 'fullscreen' },
  args: { defaultOpen: true },
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const FiltersLeft: Story = {
  name: 'Filtros (esquerda)',
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <Button variant="outline" leadingIcon="filter">
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Coleções, faixa de preço e rede.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}
