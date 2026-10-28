import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SearchField } from './search-field'

describe('SearchField', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounce durante a digitação (replace) e commit no Enter', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onSearch = vi.fn()
    render(<SearchField value="" onSearch={onSearch} debounceMs={300} />)
    const input = screen.getByRole('searchbox', { name: 'Buscar NFTs, coleções ou criadores' })

    await userEvent.type(input, 'ape')
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onSearch).toHaveBeenLastCalledWith('ape', { commit: false })

    await userEvent.type(input, '{Enter}')
    expect(onSearch).toHaveBeenLastCalledWith('ape', { commit: true })
  })

  it('acompanha o valor externo (voltar no histórico)', () => {
    const { rerender } = render(<SearchField value="ape" onSearch={vi.fn()} />)
    rerender(<SearchField value="nomad" onSearch={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('nomad')
  })
})
