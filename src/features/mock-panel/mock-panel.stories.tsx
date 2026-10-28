import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { MockPanelView } from './mock-panel'

const meta = {
  title: 'Demo/MockPanel',
  component: MockPanelView,
  tags: ['autodocs'],
  args: {
    scenarios: [
      { id: 'default', description: 'Sucesso, latência fixa de 150 ms, pedidos confirmam em 3 s' },
      { id: 'slow-network', description: '+2500 ms em todas as respostas' },
      { id: 'payment-declined', description: 'Pagamento recusado pela rede simulada' },
    ],
    active: 'default',
    isPending: false,
    onActivate: fn(),
    onDropSocket: fn(),
    onRestoreSocket: fn(),
    onReset: fn(),
  },
} satisfies Meta<typeof MockPanelView>

export default meta
type Story = StoryObj<typeof meta>

/** Fechado: só o botão flutuante “Mock”. */
export const Closed: Story = {}

/** Aberto, com o cenário ativo selecionado (captura de página: o sheet usa portal). */
export const Open: Story = {
  tags: ['visual', 'visual:page'],
  args: { defaultOpen: true },
}

export const ApplyScenario: Story = {
  args: { defaultOpen: true },
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cenário' }), 'slow-network')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar cenário' }))
    await expect(args.onActivate).toHaveBeenCalledWith('slow-network')
  },
}
