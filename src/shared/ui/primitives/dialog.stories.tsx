import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'

import { Button } from '../button'
import { TextField } from '../text-field'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

/** Primitiva shadcn/ui adaptada: backdrop a 60 % (comentário #58 do Figma), foco preso, Esc fecha e devolve o foco. */
const meta = {
  title: 'Primitives/Dialog',
  component: Dialog,
  tags: ['visual', 'visual:page'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

const LoginDialog = (args: Story['args']) => (
  <Dialog {...args}>
    <DialogTrigger asChild>
      <Button>Entrar</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Criar conta</DialogTitle>
        <DialogDescription>Entre para gerenciar sua carteira, coleção e perfil de criador.</DialogDescription>
      </DialogHeader>
      <TextField label="E-mail" type="email" placeholder="contato@email.com" />
      <DialogFooter>
        <Button fullWidth>Entrar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export const Open: Story = { args: { defaultOpen: true }, render: LoginDialog }

export const KeyboardFlow: Story = {
  name: 'Fluxo por teclado',
  tags: ['!visual'],
  render: LoginDialog,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Entrar' })
    await userEvent.click(trigger)
    await expect(await screen.findByRole('dialog', { name: 'Criar conta' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await expect(trigger).toHaveFocus()
  },
}
