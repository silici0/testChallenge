import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NftImage } from './nft-image'
import { buildSrcSet } from './src-set'

const image = { url: '/images/nfts/nft-01.webp', alt: 'Emerald Ape #042', width: 1024, height: 1024 }

describe('NftImage', () => {
  it('gera srcset por largura para WebP', () => {
    expect(buildSrcSet(image.url)).toBe(
      '/images/nfts/nft-01-320.webp 320w, /images/nfts/nft-01-640.webp 640w, /images/nfts/nft-01.webp 1024w',
    )
    expect(buildSrcSet('/a.png')).toBeUndefined()
  })

  it('tem texto alternativo e dimensões explícitas (sem CLS)', () => {
    render(<NftImage image={image} />)
    const img = screen.getByRole('img', { name: 'Emerald Ape #042' })
    expect(img).toHaveAttribute('width', '1024')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('imagem prioritária (LCP) carrega imediatamente', () => {
    render(<NftImage image={image} priority />)
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'eager')
  })
})
