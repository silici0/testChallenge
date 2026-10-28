import type { NftListParams } from '@/contracts'

export const TAB_LABELS: Record<NftListParams['tab'], string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

export const SORT_LABELS: Record<NftListParams['sort'], string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  'name-asc': 'Nome (A–Z)',
  popular: 'Mais populares',
}
