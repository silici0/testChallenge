import { Fragment, type ReactNode } from 'react'

export interface BreadcrumbItem {
  label: string
  /** Link do item (omitido no item atual). */
  render?: (props: { className: string; children: ReactNode }) => ReactNode
}

const linkClass =
  'text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Trilha de navegação (“Início / Mercado / Carrinho”); o último item é a página atual. */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-2 text-label font-bold">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          return (
            <Fragment key={item.label}>
              {index > 0 && (
                <li aria-hidden="true" className="text-foreground-muted">
                  /
                </li>
              )}
              <li>
                {isCurrent || !item.render ? (
                  <span aria-current={isCurrent ? 'page' : undefined} className="text-foreground">
                    {item.label}
                  </span>
                ) : (
                  item.render({ className: linkClass, children: item.label })
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
