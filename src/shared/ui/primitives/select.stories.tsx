import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

/** Ordenação do catálogo e seleção de rede/carteira. Testado no navegador (jsdom não suporta o posicionamento do Radix Select). */
const meta = {
  title: 'Primitives/Select',
  component: Select,
  tags: ['visual'],
  args: { defaultValue: 'recent', onValueChange: fn() },
  render: (args) => (
    <Select {...args}>
      <SelectTrigger aria-label="Ordenar por" className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">Listados recentemente</SelectItem>
        <SelectItem value="price-asc">Menor preço</SelectItem>
        <SelectItem value="price-desc">Maior preço</SelectItem>
        <SelectItem value="name-asc">Nome (A–Z)</SelectItem>
      </SelectContent>
    </Select>
  ),
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Sort: Story = {
  name: 'Ordenação',
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Ordenar por' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Menor preço' }))
    await expect(args.onValueChange).toHaveBeenCalledWith('price-asc')
    // O Radix mantém aria-hidden no restante da página até a animação de fechamento terminar.
    await waitFor(() => expect(canvas.getByRole('combobox')).toHaveTextContent('Menor preço'))
  },
}

export const Open: Story = {
  tags: ['visual:page'],
  args: { defaultOpen: true },
  parameters: {
    layout: 'fullscreen',
    // Com o listbox aberto, o Radix aplica aria-hidden ao restante da página e prende o foco no listbox;
    // o gatilho fica inacessível por design. A regra é desativada só neste estado estático.
    a11y: { config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] } },
  },
}
