import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FilterGroup } from './filter-group'
import { PriceRangeFilter } from './price-range-filter'

describe('FilterGroup', () => {
  it('checkboxes rotulados com contagem; alternar notifica', async () => {
    const onToggle = vi.fn()
    render(
      <FilterGroup
        legend="Coleções"
        selected={['musica']}
        onToggle={onToggle}
        options={[
          { id: 'arte-digital', label: 'Arte digital', count: 33 },
          { id: 'musica', label: 'Música', count: 65 },
        ]}
      />,
    )
    expect(screen.getByRole('group', { name: 'Coleções' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Música.*65/ })).toBeChecked()
    await userEvent.click(screen.getByRole('checkbox', { name: /Arte digital/ }))
    expect(onToggle).toHaveBeenCalledWith('arte-digital', true)
  })
})

describe('PriceRangeFilter', () => {
  const bounds = { minEth: '0.02', maxEth: '12.3' }

  it('aplica a faixa digitada; limites iguais aos extremos não viram filtro', async () => {
    const onApply = vi.fn()
    render(<PriceRangeFilter bounds={bounds} value={{}} onApply={onApply} />)
    const min = screen.getByRole('textbox', { name: 'Mínimo (ETH)' })
    await userEvent.clear(min)
    await userEvent.type(min, '1,5')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onApply).toHaveBeenCalledWith({ min: '1.5', max: undefined })
    expect(screen.getByText('Preço: 1,5 - 12,3 ETH')).toBeInTheDocument()
  })

  it('valida mínimo maior que máximo', async () => {
    const onApply = vi.fn()
    render(<PriceRangeFilter bounds={bounds} value={{ min: '5', max: '2' }} onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('O mínimo deve ser menor que o máximo')
    expect(onApply).not.toHaveBeenCalled()
  })

  it('alças do slider têm nome acessível', () => {
    render(<PriceRangeFilter bounds={bounds} value={{}} onApply={vi.fn()} />)
    expect(screen.getByRole('slider', { name: 'Preço mínimo' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Preço máximo' })).toBeInTheDocument()
  })
})
