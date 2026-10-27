import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const renderTabs = () =>
  render(
    <Tabs defaultValue="details">
      <TabsList aria-label="Informações do NFT">
        <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
        <TabsTrigger value="reviews">Avaliações (19)</TabsTrigger>
      </TabsList>
      <TabsContent value="details">Descrição completa</TabsContent>
      <TabsContent value="reviews">Lista de avaliações</TabsContent>
    </Tabs>,
  )

describe('Tabs (shadcn/ui)', () => {
  it('expõe tablist, aba selecionada e painel associado', () => {
    renderTabs()
    expect(screen.getByRole('tablist', { name: 'Informações do NFT' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Detalhes do NFT', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: 'Detalhes do NFT' })).toHaveTextContent('Descrição completa')
  })

  it('navega entre abas pelas setas do teclado', async () => {
    renderTabs()
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Avaliações (19)', selected: true })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Lista de avaliações')
  })
})
