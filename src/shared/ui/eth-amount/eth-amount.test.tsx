import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EthAmount } from './eth-amount'

describe('EthAmount', () => {
  it('exibe o valor exato sem zeros à direita', () => {
    render(<EthAmount value="1.190" />)
    expect(screen.getByText('1.19 ETH')).toBeInTheDocument()
  })

  it('preserva todas as casas significativas', () => {
    render(<EthAmount value="26.846000000000000001" />)
    expect(screen.getByText('26.846000000000000001 ETH')).toBeInTheDocument()
  })

  it('expõe o valor bruto em <data> para máquinas', () => {
    render(<EthAmount value="0.016" />)
    expect(screen.getByText('0.016 ETH')).toHaveAttribute('value', '0.016')
  })

  it('mostra o valor anterior riscado com contexto para leitores de tela', () => {
    render(<EthAmount value="0.95" previousValue="0.80" />)
    expect(screen.getByRole('deletion')).toHaveTextContent('Antes: 0.8 ETH')
    expect(screen.getByText(/Agora:/)).toBeInTheDocument()
  })

  it('formata descontos com sinal', () => {
    render(<EthAmount value="0.5" negative />)
    expect(screen.getByText('− 0.5 ETH')).toBeInTheDocument()
  })
})
