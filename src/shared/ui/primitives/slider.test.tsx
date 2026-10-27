import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Slider } from './slider'

describe('Slider (faixa de preço)', () => {
  it('nomeia cada alça e ajusta pelo teclado', async () => {
    const onValueChange = vi.fn()
    render(
      <Slider
        defaultValue={[2, 1230]}
        min={2}
        max={1230}
        step={1}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        onValueChange={onValueChange}
      />,
    )
    const min = screen.getByRole('slider', { name: 'Preço mínimo' })
    expect(screen.getByRole('slider', { name: 'Preço máximo' })).toHaveAttribute('aria-valuenow', '1230')

    min.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith([3, 1230])
  })
})
