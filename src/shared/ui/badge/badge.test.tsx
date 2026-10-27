import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from './badge'

describe('Badge', () => {
  it('renderiza o conteúdo com a variante pedida', () => {
    render(<Badge variant="rare">Raro</Badge>)
    expect(screen.getByText('Raro')).toHaveClass('bg-rare')
  })

  it('usa a variante status por padrão', () => {
    render(<Badge>Esgotado</Badge>)
    expect(screen.getByText('Esgotado')).toHaveClass('border-border-field')
  })
})
