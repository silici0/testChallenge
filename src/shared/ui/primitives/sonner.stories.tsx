import type { Meta, StoryObj } from '@storybook/react-vite'
import { toast } from 'sonner'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Button } from '../button'
import { Toaster } from './sonner'

/** Feedback de mutations e de eventos em tempo real (região aria-live do sonner, sem roubar o foco). */
const meta = {
  title: 'Primitives/Toaster',
  component: Toaster,
  args: { position: 'bottom-right' },
  render: (args) => (
    <>
      <Toaster {...args} />
      <div className="flex gap-3">
        <Button onClick={() => toast.success('Item adicionado ao carrinho')}>Sucesso</Button>
        <Button variant="outline" onClick={() => toast.error('Não foi possível atualizar o favorito')}>
          Erro
        </Button>
        <Button variant="ghost" onClick={() => toast.warning('Preço de Emerald Ape #042 mudou: 1.19 → 1.29 ETH')}>
          Tempo real
        </Button>
      </div>
    </>
  ),
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Feedback: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Sucesso' })
    await userEvent.click(trigger)
    const message = await screen.findByText('Item adicionado ao carrinho')
    await waitFor(() => expect(message).toBeVisible()) // aguarda a animação de entrada
    await expect(trigger).toHaveFocus()
  },
}
