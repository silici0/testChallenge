import type { ReactNode } from 'react'

import type { NftListParams } from '@/contracts'
import { cn } from '@/shared/lib/cn'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'

import { SORT_LABELS, TAB_LABELS } from '../labels'

export interface CatalogToolbarProps {
  tab: NftListParams['tab']
  sort: NftListParams['sort']
  onSortChange: (sort: NftListParams['sort']) => void
  /** Link de cada aba (navegação real; o estado vive na URL). */
  renderTabLink: (props: {
    tab: NftListParams['tab']
    className: string
    children: ReactNode
    'aria-current'?: 'true'
  }) => ReactNode
}

/** Abas como links (filtram a mesma lista — não são painéis) e ordenação. */
export function CatalogToolbar({ tab, sort, onSortChange, renderTabLink }: CatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Seções do catálogo">
        <ul className="flex gap-5 overflow-x-auto">
          {(Object.keys(TAB_LABELS) as NftListParams['tab'][]).map((value) => (
            <li key={value} className="shrink-0">
              {renderTabLink({
                tab: value,
                className: cn(
                  'inline-block border-b-2 pb-1 text-label font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  value === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground hover:text-primary',
                ),
                children: TAB_LABELS[value],
                ...(value === tab ? { 'aria-current': 'true' as const } : {}),
              })}
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-2">
        <span id="sort-label" className="text-label text-foreground">
          Ordenar por:
        </span>
        <Select
          value={sort}
          onValueChange={(value) => {
            onSortChange(value as NftListParams['sort'])
          }}
        >
          <SelectTrigger
            aria-labelledby="sort-label"
            className="h-9 border-transparent bg-transparent px-1 text-label text-foreground"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as NftListParams['sort'][]).map((value) => (
              <SelectItem key={value} value={value}>
                {SORT_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
