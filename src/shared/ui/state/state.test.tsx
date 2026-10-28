import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState, ErrorState } from './state'

describe('EmptyState / ErrorState', () => {
  it('estado vazio mostra título, descrição e ação', () => {
    render(
      <EmptyState
        title="Nenhum NFT encontrado"
        description="Ajuste os filtros."
        action={<button type="button">Limpar filtros</button>}
      />,
    )
    expect(screen.getByText('Nenhum NFT encontrado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument()
  })

  it('erro é anunciado e permite nova tentativa', async () => {
    const onRetry = vi.fn()
    render(<ErrorState title="Não foi possível carregar o catálogo" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o catálogo')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
