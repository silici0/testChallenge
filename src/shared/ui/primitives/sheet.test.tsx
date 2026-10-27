import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './sheet'

describe('Sheet (drawer de filtros no mobile)', () => {
  it('abre como diálogo, fecha com Esc e devolve o foco', async () => {
    render(
      <Sheet>
        <SheetTrigger>Filtros</SheetTrigger>
        <SheetContent side="left">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Refine o catálogo.</SheetDescription>
        </SheetContent>
      </Sheet>,
    )
    const trigger = screen.getByRole('button', { name: 'Filtros' })
    await userEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
