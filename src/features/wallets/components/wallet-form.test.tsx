import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api'

import { WalletForm } from './wallet-form'

const primary = {
  displayName: 'Principal',
  nickname: null,
  network: 'ethereum' as const,
  address: '0xA91F2c3b4D5e6F708192a3B4c5D6e7F80912E82C',
  provider: 'metamask' as const,
  ensName: 'ana',
}

describe('WalletForm', () => {
  it('valida o endereço conforme a rede', async () => {
    const onSubmit = vi.fn()
    render(<WalletForm walletRole="primary" initial={{ ...primary, address: '0x123' }} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar carteira' }))
    expect(await screen.findByText('Endereço 0x inválido (0x + 40 hexadecimais)')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envia os dados válidos e confirma', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<WalletForm walletRole="primary" initial={primary} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar carteira' }))
    expect(await screen.findByText('Carteira salva.')).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'primary', network: 'ethereum', ensName: 'ana' }),
    )
  })

  it('ENS só aparece para Ethereum', () => {
    render(
      <WalletForm
        walletRole="secondary"
        initial={{ ...primary, network: 'polygon', ensName: null }}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText(/Nome ENS/)).not.toBeInTheDocument()
  })

  it('erro de campo retornado pela API', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'x',
        retryable: false,
        fieldErrors: { address: ['Endereço bloqueado'] },
      }),
    )
    render(<WalletForm walletRole="primary" initial={primary} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar carteira' }))
    expect(await screen.findByText('Endereço bloqueado')).toBeInTheDocument()
  })
})
