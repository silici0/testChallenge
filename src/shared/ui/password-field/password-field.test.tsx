import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PasswordField } from './password-field'

describe('PasswordField', () => {
  it('oculta por padrão e alterna a visibilidade com estado anunciado', async () => {
    render(<PasswordField label="Senha" />)
    const input = screen.getByLabelText('Senha')
    expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
  })
})
