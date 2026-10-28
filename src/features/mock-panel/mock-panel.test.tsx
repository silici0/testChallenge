import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MockPanelView, type MockPanelViewProps } from './mock-panel'

const scenarios = [
  { id: 'default', description: 'Sucesso, latência fixa de 150 ms' },
  { id: 'payment-declined', description: 'Pagamento recusado pela rede' },
]

function setup(props: Partial<MockPanelViewProps> = {}) {
  const handlers = {
    onActivate: vi.fn(),
    onDropSocket: vi.fn(),
    onRestoreSocket: vi.fn(),
    onReset: vi.fn(),
  }
  render(<MockPanelView scenarios={scenarios} active="default" isPending={false} {...handlers} {...props} />)
  return handlers
}

describe('MockPanelView', () => {
  it('abre pelo botão “Mock” e mostra o cenário ativo com a descrição', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Mock: painel de simulação' }))
    expect(screen.getByRole('dialog', { name: 'Simulação (demonstração)' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Cenário' })).toHaveValue('default')
    expect(screen.getByText('Sucesso, latência fixa de 150 ms')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aplicar cenário' })).toBeDisabled()
  })

  it('aplica o cenário escolhido', async () => {
    const { onActivate } = setup({ defaultOpen: true })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Cenário' }), 'payment-declined')
    expect(screen.getByText('Pagamento recusado pela rede')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar cenário' }))
    expect(onActivate).toHaveBeenCalledWith('payment-declined')
  })

  it('controla o socket e reseta os dados', async () => {
    const { onDropSocket, onRestoreSocket, onReset } = setup({ defaultOpen: true })
    await userEvent.click(screen.getByRole('button', { name: 'Derrubar conexão' }))
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar conexão' }))
    await userEvent.click(screen.getByRole('button', { name: 'Resetar dados' }))
    expect(onDropSocket).toHaveBeenCalledOnce()
    expect(onRestoreSocket).toHaveBeenCalledOnce()
    expect(onReset).toHaveBeenCalledOnce()
  })
})
