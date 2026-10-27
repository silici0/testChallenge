import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Icon } from './icon'

describe('Icon', () => {
  it('é decorativo por padrão', () => {
    render(<Icon name="cart" data-testid="icon" />)
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true')
  })

  it('expõe nome acessível quando recebe label', () => {
    render(<Icon name="heart" label="Favorito" />)
    expect(screen.getByRole('img', { name: 'Favorito' })).toBeInTheDocument()
  })

  it('aplica o tamanho em largura e altura', () => {
    render(<Icon name="search" size={32} data-testid="icon" />)
    const svg = screen.getByTestId('icon')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })
})
