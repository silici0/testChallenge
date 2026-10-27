import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button', () => {
  it('renderiza um botão acessível com o texto', () => {
    render(<Button>Comprar</Button>)
    expect(screen.getByRole('button', { name: 'Comprar' })).toHaveAttribute('type', 'button')
  })

  it('dispara onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Comprar</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('em carregamento: anuncia ocupado, mantém foco e ignora cliques', async () => {
    const onClick = vi.fn()
    render(
      <Button isLoading loadingText="Processando" onClick={onClick}>
        Confirmar compra
      </Button>,
    )
    const button = screen.getByRole('button', { name: /processando/i })

    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()

    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('aria-disabled bloqueia ação sem remover do tab order (ações fora do escopo)', async () => {
    const onClick = vi.fn()
    render(
      <Button aria-disabled onClick={onClick}>
        Ler mais
      </Button>,
    )
    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('asChild renderiza o filho (ex.: link) com o estilo do botão', () => {
    render(
      <Button asChild variant="outline">
        <a href="/cart">Carrinho</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Carrinho' })
    expect(link).toHaveAttribute('href', '/cart')
    expect(link.className).toContain('border-primary')
  })

  it('ícones são decorativos e não alteram o nome acessível', () => {
    render(
      <Button leadingIcon="heart" trailingIcon="arrow-right">
        Favoritar
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Favoritar' })).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
