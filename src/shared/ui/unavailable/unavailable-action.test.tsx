import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { UnavailableAction } from './unavailable-action'

describe('UnavailableAction', () => {
  it('é focável, declara indisponibilidade e não executa nada', async () => {
    render(<UnavailableAction>Continuar com Google</UnavailableAction>)
    const button = screen.getByRole('button', { name: /Continuar com Google/ })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAccessibleDescription('(Indisponível na demonstração)')
    await userEvent.tab()
    expect(button).toHaveFocus()
  })

  it('variante textual para links de rodapé', () => {
    render(<UnavailableAction appearance="text">Central de ajuda</UnavailableAction>)
    expect(screen.getByRole('button', { name: /Central de ajuda/ })).toHaveAttribute(
      'title',
      'Indisponível na demonstração',
    )
  })
})
