import type { Category, Edition, Image, Network } from '@/contracts'
import { formatEth, parseEth } from '@/shared/lib/money'

import { createPrng } from '../db/runtime'
import type { NftRecord } from '../db/schema'

/** 9 nomes do Figma + combinações determinísticas até 63 NFTs (7 páginas de 9). */
const FIGMA_NAMES = [
  'Emerald Ape #042',
  'Cosmic Bloom #118',
  'Golden Beat #207',
  'Sage Nomad #009',
  'Violet Nomad #314',
  'Golden Frequency #071',
  'Neon Vessel #552',
  'Ivory Baron #088',
  'Golden Signal #160',
]
const ADJECTIVES = [
  'Amber',
  'Crimson',
  'Silver',
  'Midnight',
  'Jade',
  'Copper',
  'Solar',
  'Lunar',
  'Velvet',
  'Onyx',
  'Coral',
  'Saffron',
]
const NOUNS = ['Oracle', 'Drifter', 'Monk', 'Pilot', 'Echo', 'Warden', 'Sprite', 'Atlas', 'Muse']

const CATEGORIES: Category[] = [
  'arte-digital',
  'musica',
  'arte-3d',
  'colecionaveis',
  'fotografia',
  'generativa',
  'jogos',
  'utilidade',
  'assinaturas',
]
const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']
const COLLECTIONS = [
  { id: 'col_kurio-apes', name: 'Kurio Apes' },
  { id: 'col_kurio-editions', name: 'Kurio Editions' },
  { id: 'col_golden-hour', name: 'Golden Hour' },
  { id: 'col_neon-district', name: 'Neon District' },
  { id: 'col_sage-collective', name: 'Sage Collective' },
  { id: 'col_cosmic-garden', name: 'Cosmic Garden' },
]
const CREATORS = [
  { id: 'cr_nova-sato', name: 'Nova Sato' },
  { id: 'cr_ines-moura', name: 'Inês Moura' },
  { id: 'cr_kai-ferraz', name: 'Kai Ferraz' },
  { id: 'cr_lia-tanaka', name: 'Lia Tanaka' },
]

/** As 4 artes exportadas do Figma (public/images/nfts). */
const ARTWORKS = ['nft-01', 'nft-02', 'nft-03', 'nft-04']
const BASE_DATE = Date.UTC(2026, 6, 29, 12)

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/#/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function pick<T>(list: readonly T[], index: number): T {
  const item = list[index % list.length]
  if (item === undefined) throw new Error('Lista de fixtures vazia')
  return item
}

const image = (artwork: string, alt: string): Image => ({
  url: `/images/nfts/${artwork}.png`,
  alt,
  width: 1254,
  height: 1254,
})

function buildNames(): string[] {
  const names = [...FIGMA_NAMES]
  const random = createPrng(7)
  for (let index = 0; names.length < 63; index++) {
    const adjective = pick(ADJECTIVES, index)
    const noun = pick(NOUNS, Math.floor(index / ADJECTIVES.length))
    const number = String(Math.floor(random() * 900) + 100).padStart(3, '0')
    names.push(`${adjective} ${noun} #${number}`)
  }
  return names
}

/** Preço base entre 0.02 e 12.30 ETH (faixa do Figma), com 2–3 casas. */
function basePrice(random: () => number): string {
  const cents = Math.floor(2 + random() * (1230 - 2))
  const thousandths = random() > 0.6 ? Math.floor(random() * 10) : 0
  return formatEth(parseEth(`${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}${thousandths}`))
}

const ACCESSORIES = ['Óculos', 'Boné', 'Fones', 'Colar']
const PALETTES = ['Esmeralda', 'Âmbar', 'Violeta', 'Marfim']

const buildAttributes = (index: number) => [
  { trait: 'Acessório', value: ACCESSORIES[index % ACCESSORIES.length] ?? 'Óculos' },
  { trait: 'Paleta', value: PALETTES[index % PALETTES.length] ?? 'Esmeralda' },
  { trait: 'Raridade', value: index % 5 === 0 ? 'Raro' : 'Comum' },
]

const scale = (eth: string, basisPoints: number) => formatEth((parseEth(eth) * BigInt(basisPoints)) / 10_000n)

interface EditionSeed {
  nftId: string
  price: string
  random: () => number
  soldOut: boolean
}

function initialAvailability(supply: number | null, random: () => number): number {
  if (supply === null) return 999
  return Math.floor(random() * (supply + 1))
}

function buildEditions({ nftId, price, random, soldOut }: EditionSeed): Edition[] {
  const templates = [
    { key: '1-1', label: '1/1', supply: 1, factor: 30_000, maxPerOrder: 1 },
    { key: '1-10', label: '1/10', supply: 10, factor: 15_000, maxPerOrder: 3 },
    { key: '1-50', label: '1/50', supply: 50, factor: 10_000, maxPerOrder: 10 },
    { key: 'aberta', label: 'Aberta', supply: null, factor: 6_000, maxPerOrder: 20 },
  ]
  return templates.map((template) => {
    const available = soldOut ? 0 : initialAvailability(template.supply, random)
    return {
      id: `ed_${nftId.slice(4)}_${template.key}`,
      label: template.label,
      priceEth: scale(price, template.factor),
      supply: template.supply,
      available,
      maxPerOrder: template.maxPerOrder,
      status: available > 0 ? 'available' : 'sold-out',
    }
  })
}

const minPrice = (editions: Edition[]) =>
  editions
    .filter((edition) => edition.available > 0)
    .map((edition) => edition.priceEth)
    .sort((a, b) => (parseEth(a) < parseEth(b) ? -1 : 1))[0] ??
  editions[editions.length - 1]?.priceEth ??
  '0'

export function createNftFixtures(): NftRecord[] {
  const random = createPrng(42)
  return buildNames().map((name, index) => {
    const id = `nft_${slug(name)}`
    const artwork = pick(ARTWORKS, index)
    const collection = pick(COLLECTIONS, index)
    const creator = pick(CREATORS, index)
    const soldOut = index === 13
    const editions = buildEditions({ nftId: id, price: basePrice(random), random, soldOut })
    const number = name.split('#')[1] ?? '000'
    const alt = `${name}: ilustração de um primata colecionável em estilo pintura digital`
    return {
      id,
      name,
      tokenId: `#${number.padStart(4, '0')}`,
      collection,
      creator,
      image: image(artwork, alt),
      gallery: [0, 1, 2, 3].map((view) => image(artwork, `${name}, vista ${view + 1} de 4`)),
      category: pick(CATEGORIES, index),
      network: pick(NETWORKS, index * 7),
      badge: index % 5 === 0 ? 'rare' : null,
      description: `Um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na rede, com arte desbloqueável e acesso para colecionadores.`,
      longDescription: `${name} é uma obra digital finalizada à mão da coleção ${collection.name}. Cada atributo fica armazenado nos metadados do token. A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência. ${creator.name} recebe 5% de direitos autorais nas vendas secundárias.`,
      attributes: buildAttributes(index),
      rating: { average: Math.round((4 + random()) * 10) / 10, count: Math.floor(random() * 40) },
      reviews: [
        {
          author: 'colecionador.eth',
          rating: 5,
          text: 'Arte impecável e entrega imediata na carteira.',
          createdAt: new Date(BASE_DATE - 86_400_000 * 3).toISOString(),
        },
        {
          author: 'galeria_sul',
          rating: 4,
          text: 'Ótima procedência; gostaria de mais edições abertas.',
          createdAt: new Date(BASE_DATE - 86_400_000 * 9).toISOString(),
        },
      ],
      contract: { address: `0x7A42${String(index).padStart(36, '0')}19E8`, standard: 'ERC-721' },
      royaltyPercent: 5,
      editions,
      popularity: Math.floor(random() * 1000),
      createdAt: new Date(BASE_DATE - index * 3_600_000 * 7).toISOString(),
      version: 1,
    }
  })
}

export const nftPriceFrom = minPrice
