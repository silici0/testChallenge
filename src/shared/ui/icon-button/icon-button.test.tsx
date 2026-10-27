import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IconButton } from './icon-button'

describe('IconButton', () => {
  it('exige e expõe o nome acessível', () => {
    render(<IconButton icon="search" label="Buscar" />)
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument()
  })

  it('inclui o contador no nome acessível e limita a exibição a 99+', () => {
    render(<IconButton icon="cart" label="Carrinho" count={120} />)
    expect(screen.getByRole('button', { name: 'Carrinho, 120 itens' })).toBeInTheDocument()
    expect(screen.getByText('99+')).toHaveAttribute('aria-hidden', 'true')
  })

  it('não mostra badge com contador zero', () => {
    render(<IconButton icon="cart" label="Carrinho" count={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('expõe estado de alternância com aria-pressed', () => {
    render(<IconButton icon="heart" label="Favoritar" pressed />)
    expect(screen.getByRole('button', { name: 'Favoritar', pressed: true })).toBeInTheDocument()
  })
})
