import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog'

const renderDialog = () =>
  render(
    <Dialog>
      <DialogTrigger>Entrar</DialogTrigger>
      <DialogContent>
        <DialogTitle>Entrar na Kurio</DialogTitle>
        <DialogDescription>Gerencie sua carteira e coleção.</DialogDescription>
        <input aria-label="E-mail" />
      </DialogContent>
    </Dialog>,
  )

describe('Dialog (shadcn/ui)', () => {
  it('abre como diálogo modal com título e descrição acessíveis', async () => {
    renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    const dialog = screen.getByRole('dialog', { name: 'Entrar na Kurio' })
    expect(dialog).toHaveAccessibleDescription('Gerencie sua carteira e coleção.')
  })

  it('prende o foco dentro do diálogo', async () => {
    renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    // Foco inicial no campo; Tab vai ao “Fechar” e o próximo Tab volta ao campo (não escapa do diálogo).
    expect(screen.getByLabelText('E-mail')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByLabelText('E-mail')).toHaveFocus()
  })

  it('fecha com Esc e devolve o foco ao gatilho', async () => {
    renderDialog()
    const trigger = screen.getByRole('button', { name: 'Entrar' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('tem botão de fechar com nome em português', async () => {
    renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
