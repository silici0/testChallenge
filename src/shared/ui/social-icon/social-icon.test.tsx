import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SocialIcon } from './social-icon'

describe('SocialIcon', () => {
  it.each(['facebook', 'instagram', 'x', 'linkedin', 'youtube'] as const)(
    '%s é decorativo e herda a cor do texto',
    (network) => {
      render(<SocialIcon network={network} data-testid="icon" />)
      const svg = screen.getByTestId('icon')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).toHaveAttribute('fill', 'currentColor')
      expect(svg).not.toBeEmptyDOMElement()
    },
  )

  it('aceita tamanho e classes', () => {
    render(<SocialIcon network="x" width={24} height={24} className="text-primary" data-testid="icon" />)
    expect(screen.getByTestId('icon')).toHaveAttribute('width', '24')
    expect(screen.getByTestId('icon')).toHaveClass('text-primary')
  })
})
