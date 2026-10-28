import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import { Icon } from '../icon'
import { pageWindow } from './page-window'

export interface PaginationLinkProps {
  page: number
  className: string
  children: ReactNode
  'aria-label': string
  'aria-current'?: 'page'
}

export interface PaginationProps {
  page: number
  totalPages: number
  /** Renderiza o link (ex.: <Link> do TanStack Router com search.page) — navegação real, preservada no histórico. */
  renderLink: (props: PaginationLinkProps) => ReactNode
  className?: string
}

const itemClass =
  'flex size-9 items-center justify-center rounded-sm border border-border-soft text-label text-foreground transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function Pagination({ page, totalPages, renderLink, className }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação" className={className}>
      <ul className="flex flex-wrap items-center justify-end gap-2">
        {page > 1 && (
          <li>
            {renderLink({
              page: page - 1,
              className: itemClass,
              'aria-label': 'Página anterior',
              children: <Icon name="chevron-left" size={18} />,
            })}
          </li>
        )}
        {pageWindow(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-foreground-muted">
              …
            </li>
          ) : (
            <li key={item}>
              {renderLink({
                page: item,
                className: cn(
                  itemClass,
                  item === page && 'border-primary bg-primary font-bold text-on-primary hover:bg-primary-hover',
                ),
                'aria-label': `Página ${item}`,
                ...(item === page ? { 'aria-current': 'page' as const } : {}),
                children: item,
              })}
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            {renderLink({
              page: page + 1,
              className: itemClass,
              'aria-label': 'Próxima página',
              children: <Icon name="chevron-right" size={18} />,
            })}
          </li>
        )}
      </ul>
    </nav>
  )
}
