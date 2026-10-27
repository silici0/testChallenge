import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { QuantityStepper } from './quantity-stepper'

const setup = (props: Partial<Parameters<typeof QuantityStepper>[0]> = {}) => {
  const onChange = vi.fn()
  render(<QuantityStepper label="Quantidade" max={3} onChange={onChange} {...props} />)
  return {
    onChange,
    input: screen.getByRole('spinbutton', { name: 'Quantidade' }),
    increment: screen.getByRole('button', { name: 'Aumentar quantidade' }),
    decrement: screen.getByRole('button', { name: 'Diminuir quantidade' }),
  }
}

describe('QuantityStepper', () => {
  it('começa no mínimo com o decremento desabilitado', () => {
    const { input, decrement } = setup()
    expect(input).toHaveValue(1)
    expect(decrement).toBeDisabled()
  })

  it('incrementa até o máximo e notifica cada mudança', async () => {
    const { input, increment, onChange } = setup()
    await userEvent.click(increment)
    await userEvent.click(increment)
    expect(input).toHaveValue(3)
    expect(increment).toBeDisabled()
    expect(onChange).toHaveBeenLastCalledWith(3)
  })

  it('liga a explicação do limite ao campo', () => {
    const { input } = setup({ limitHint: 'Máximo de 3 por pedido' })
    expect(input).toHaveAccessibleDescription('Máximo de 3 por pedido')
  })

  it('funciona controlado', async () => {
    const { input, increment, onChange } = setup({ value: 2 })
    await userEvent.click(increment)
    expect(onChange).toHaveBeenCalledWith(3)
    expect(input).toHaveValue(2)
  })

  it('desabilita tudo quando a edição está indisponível', () => {
    const { input, increment, decrement } = setup({ max: 0 })
    expect(input).toBeDisabled()
    expect(increment).toBeDisabled()
    expect(decrement).toBeDisabled()
  })
})
