import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api'

import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

describe('LoginForm', () => {
  it('valida localmente antes de chamar a API', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Informe um e-mail válido')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('credenciais inválidas da API aparecem no campo de senha', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({
        code: 'INVALID_CREDENTIALS',
        message: 'x',
        retryable: false,
        fieldErrors: { password: ['E-mail ou senha incorretos'] },
      }),
    )
    render(<LoginForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.test')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('E-mail ou senha incorretos')).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith({ email: 'ana@example.test', password: 'errada' })
  })
})

describe('RegisterForm', () => {
  it('política de senha e confirmação divergente', async () => {
    render(<RegisterForm onSubmit={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Nome de usuário'), 'nova.conta')
    await userEvent.type(screen.getByLabelText('E-mail'), 'nova@example.test')
    await userEvent.type(screen.getByLabelText('Senha'), 'fraca')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'outra')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Mínimo de 8 caracteres')).toBeInTheDocument()
    expect(screen.getByText('As senhas não conferem')).toBeInTheDocument()
  })

  it('conflito de e-mail vindo da API vai para o campo e recebe foco', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({
        code: 'EMAIL_TAKEN',
        message: 'x',
        retryable: false,
        fieldErrors: { email: ['Este e-mail já está cadastrado'] },
      }),
    )
    render(<RegisterForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('Nome de usuário'), 'nova.conta')
    await userEvent.type(screen.getByLabelText('E-mail'), 'taken@example.test')
    await userEvent.type(screen.getByLabelText('Senha'), 'Jungle#2026')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'Jungle#2026')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Este e-mail já está cadastrado')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveFocus()
  })
})
