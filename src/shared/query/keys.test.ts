import { describe, expect, it } from 'vitest'

import { nftListParamsSchema } from '@/contracts'

import { queryKeys } from './keys'

describe('queryKeys', () => {
  it('URLs equivalentes compartilham a mesma key (padrões removidos, arrays ordenados)', () => {
    const a = queryKeys.nfts.list(nftListParamsSchema.parse({ category: ['musica', 'jogos'], page: 1 }))
    const b = queryKeys.nfts.list(nftListParamsSchema.parse({ category: ['jogos', 'musica'] }))
    expect(a).toEqual(b)
  })

  it('parâmetros diferentes geram keys diferentes (isolamento por consulta)', () => {
    expect(queryKeys.nfts.list(nftListParamsSchema.parse({ page: 2 }))).not.toEqual(
      queryKeys.nfts.list(nftListParamsSchema.parse({})),
    )
  })

  it('dados privados ficam sob o escopo do usuário', () => {
    expect(queryKeys.user.cart('usr_ana').slice(0, 2)).toEqual(queryKeys.user.scope('usr_ana'))
    expect(queryKeys.user.order('usr_ana', 'ord_1').slice(0, 2)).toEqual(['user', 'usr_ana'])
  })
})
