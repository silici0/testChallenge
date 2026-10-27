import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TextField } from './text-field'

describe('TextField', () => {
  it('associa o rótulo ao campo', () => {
    render(<TextField label="E-mail" type="email" />)
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toBeInTheDocument()
  })

  it('associa dica e erro como descrição e marca inválido', () => {
    render(<TextField label="Senha" hint="Mínimo de 8 caracteres" error="Senha fraca" />)
    const input = screen.getByLabelText('Senha')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Mínimo de 8 caracteres Senha fraca')
  })

  it('não marca inválido sem erro', () => {
    render(<TextField label="Nome" />)
    expect(screen.getByLabelText('Nome')).not.toHaveAttribute('aria-invalid')
  })

  it('indica obrigatório sem poluir o nome acessível', () => {
    render(<TextField label="Nome de exibição" required />)
    expect(screen.getByRole('textbox', { name: 'Nome de exibição' })).toBeRequired()
  })

  it('aceita digitação', async () => {
    render(<TextField label="Código promocional" />)
    const input = screen.getByLabelText('Código promocional')
    await userEvent.type(input, 'JUNGLE10')
    expect(input).toHaveValue('JUNGLE10')
  })
})
