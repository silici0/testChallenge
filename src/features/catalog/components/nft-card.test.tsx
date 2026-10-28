import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { sampleNfts } from './fixtures'
import { NftCard } from './nft-card'
import { NftGrid } from './nft-grid'

const renderLink = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <a href="/nfts/x" className={className}>
    {children}
  </a>
)
const [rare, , soldOut] = sampleNfts

describe('NftCard', () => {
  it('nome é o link acessível para o detalhe; preço e imagem com alt', () => {
    render(<NftCard nft={rare!} renderLink={renderLink} />)
    expect(screen.getByRole('link', { name: 'Emerald Ape #042' })).toHaveAttribute('href', '/nfts/x')
    expect(screen.getByText('1.19 ETH')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Emerald Ape #042/ })).toBeInTheDocument()
    expect(screen.getByText('Raro')).toBeInTheDocument()
  })

  it('indica esgotado com texto, não só com opacidade', () => {
    render(<NftCard nft={soldOut!} renderLink={renderLink} />)
    expect(screen.getByText('Esgotado')).toBeInTheDocument()
  })
})

describe('NftGrid', () => {
  it('mostra skeletons acessíveis enquanto carrega', () => {
    render(<NftGrid items={undefined} isLoading renderCard={() => null} />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando NFTs')
  })

  it('renderiza a lista e marca atualização em segundo plano', () => {
    render(<NftGrid items={sampleNfts} isLoading={false} isFetching renderCard={(nft) => <span>{nft.name}</span>} />)
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
})
