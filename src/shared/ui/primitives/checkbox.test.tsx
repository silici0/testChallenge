import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Checkbox } from './checkbox'

describe('Checkbox (filtro combinável)', () => {
  it('alterna com clique e com espaço, notificando o estado', async () => {
    const onCheckedChange = vi.fn()
    render(
      <>
        <Checkbox id="digital-art" onCheckedChange={onCheckedChange} />
        <label htmlFor="digital-art">Arte digital</label>
      </>,
    )
    const checkbox = screen.getByRole('checkbox', { name: 'Arte digital' })

    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    await userEvent.keyboard(' ')
    expect(checkbox).not.toBeChecked()
  })
})
