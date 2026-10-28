import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api'

import { applyApiErrors } from './apply-api-errors'

describe('applyApiErrors', () => {
  it('aplica erros de campo conhecidos e foca o primeiro', () => {
    const setError = vi.fn()
    const error = new ApiError({
      code: 'EMAIL_TAKEN',
      message: 'x',
      retryable: false,
      fieldErrors: { email: ['Já cadastrado'], outro: ['ignorado'] },
    })
    expect(applyApiErrors(error, { setError, fields: ['email', 'password'] })).toBeNull()
    expect(setError).toHaveBeenCalledExactlyOnceWith(
      'email',
      { type: 'server', message: 'Já cadastrado' },
      { shouldFocus: true },
    )
  })

  it('erro sem campo vira mensagem geral (rede ou mensagem da API)', () => {
    const setError = vi.fn()
    expect(
      applyApiErrors(new ApiError({ code: 'NETWORK_ERROR', message: 'x', retryable: true }), {
        setError,
        fields: ['email'],
      }),
    ).toMatch(/conexão/)
    expect(
      applyApiErrors(new ApiError({ code: 'FORBIDDEN', message: 'Sem permissão', retryable: false }), {
        setError,
        fields: ['email'],
      }),
    ).toBe('Sem permissão')
    expect(applyApiErrors(new Error('x'), { setError, fields: ['email'] })).toMatch(/Tente novamente/)
  })
})
