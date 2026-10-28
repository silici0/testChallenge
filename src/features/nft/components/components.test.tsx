import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EditionSelector } from './edition-selector'
import { sampleDetail } from './fixtures'
import { Gallery } from './gallery'
import { Rating } from './rating'

describe('EditionSelector', () => {
  it('grupo de rádio rotulado; esgotada desabilitada e anunciada', async () => {
    const onChange = vi.fn()
    render(<EditionSelector editions={sampleDetail.editions} value="ed_1-50" onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Edição:' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1/50' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /1\/1.*esgotada/ })).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: 'Aberta' }))
    expect(onChange).toHaveBeenCalledWith('ed_aberta')
  })
})

describe('Gallery', () => {
  it('troca a imagem principal pelas miniaturas e permite ampliar', async () => {
    render(<Gallery name={sampleDetail.name} images={sampleDetail.gallery} />)
    const second = screen.getByRole('button', { name: 'Imagem 2 de 4' })
    await userEvent.click(second)
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: 'Emerald Ape #042, vista 2 de 4' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ampliar imagem de Emerald Ape #042' }))
    expect(screen.getByRole('dialog', { name: 'Emerald Ape #042' })).toBeInTheDocument()
  })
})

describe('Rating', () => {
  it('nota acessível em texto, estrelas decorativas', () => {
    render(<Rating average={4.8} count={19} />)
    expect(screen.getByText(/Nota 4,8 de 5/)).toBeInTheDocument()
    expect(screen.getByText(/19 avaliações de colecionadores/)).toBeInTheDocument()
  })
})
