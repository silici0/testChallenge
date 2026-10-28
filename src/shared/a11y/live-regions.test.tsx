import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { announce } from './announcer'
import { LiveRegions } from './live-regions'

describe('LiveRegions', () => {
  it('anuncia mensagens educadas e urgentes em regiões separadas', () => {
    render(<LiveRegions />)
    act(() => {
      announce('Item adicionado ao carrinho')
      announce('Sua sessão expirou', 'assertive')
    })
    expect(screen.getByRole('status')).toHaveTextContent('Item adicionado ao carrinho')
    expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou')
  })
})
