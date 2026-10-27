import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton, SkeletonRegion } from './skeleton'

describe('Skeleton', () => {
  it('é ignorado por tecnologias assistivas e usa shimmer', () => {
    render(<Skeleton className="h-4 w-20" data-testid="skeleton" />)
    const block = screen.getByTestId('skeleton')
    expect(block).toHaveAttribute('aria-hidden', 'true')
    expect(block).toHaveClass('shimmer', 'h-4', 'w-20')
  })

  it('SkeletonRegion anuncia o carregamento uma vez', () => {
    render(
      <SkeletonRegion label="Carregando catálogo">
        <Skeleton />
        <Skeleton />
      </SkeletonRegion>,
    )
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(region).toHaveTextContent('Carregando catálogo')
  })
})
