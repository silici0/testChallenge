import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Breadcrumb } from './breadcrumb'

describe('Breadcrumb', () => {
  it('itens anteriores são links e o último é a página atual', () => {
    render(
      <Breadcrumb
        items={[
          {
            label: 'Início',
            render: (props) => (
              <a href="/" {...props}>
                {props.children}
              </a>
            ),
          },
          { label: 'Carrinho' },
        ]}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Trilha de navegação' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Carrinho')).toHaveAttribute('aria-current', 'page')
  })
})
