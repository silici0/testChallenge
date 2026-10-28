import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { pageWindow } from './page-window'
import { Pagination, type PaginationLinkProps } from './pagination'

const renderLink = ({ page, children, ...props }: PaginationLinkProps) => (
  <a href={`?page=${page}`} {...props}>
    {children}
  </a>
)

describe('Pagination', () => {
  it('janela de páginas com reticências', () => {
    expect(pageWindow(1, 4)).toEqual([1, 2, 3, 4])
    expect(pageWindow(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12])
  })

  it('marca a página atual e não mostra “anterior” na primeira página', () => {
    render(<Pagination page={1} totalPages={4} renderLink={renderLink} />)
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Página anterior' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Próxima página' })).toHaveAttribute('href', '?page=2')
  })

  it('mostra “anterior” a partir da página 2 (comentário #7 do Figma)', () => {
    render(<Pagination page={2} totalPages={4} renderLink={renderLink} />)
    expect(screen.getByRole('link', { name: 'Página anterior' })).toHaveAttribute('href', '?page=1')
  })

  it('não renderiza com uma única página', () => {
    const { container } = render(<Pagination page={1} totalPages={1} renderLink={renderLink} />)
    expect(container).toBeEmptyDOMElement()
  })
})
