import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { useSession } from '@/features/auth/use-session'
import { useCartCount } from '@/features/cart/use-cart'
import { SearchField } from '@/features/catalog/components/search-field'
import { cn } from '@/shared/lib/cn'
import { Button, Icon, IconButton, UnavailableAction } from '@/shared/ui'

const navLinkClass = (active: boolean) =>
  cn(
    'inline-block border-b-2 pb-4 text-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    active ? 'border-primary font-bold text-primary' : 'border-transparent text-foreground hover:text-primary',
  )

export function Logo() {
  return (
    <Link
      to="/"
      className="text-label font-bold tracking-wide text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      KURIO
      <span className="sr-only"> — página inicial</span>
    </Link>
  )
}

/** Cabeçalho único em todas as telas, com divisor (comentário #11 do Figma). */
export function SiteHeader() {
  const { pathname, href } = useLocation()
  const navigate = useNavigate()
  const cartCount = useCartCount()
  const { user } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const isMarket = pathname.startsWith('/nfts') || pathname === '/cart' || pathname === '/checkout'

  return (
    <header className="border-b border-border-soft">
      <div className="flex h-16 items-center justify-between gap-6 pt-4">
        <Logo />
        <nav aria-label="Principal" className="hidden self-end lg:block">
          <ul className="flex gap-10">
            <li>
              <Link
                to="/"
                className={navLinkClass(pathname === '/')}
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                Início
              </Link>
            </li>
            <li>
              <Link to="/" hash="catalogo" className={navLinkClass(isMarket)}>
                Mercado
              </Link>
            </li>
            <li className="pb-4">
              <UnavailableAction appearance="text" className="text-body text-foreground">
                Criadores
              </UnavailableAction>
            </li>
            <li className="pb-4">
              <UnavailableAction appearance="text" className="text-body text-foreground">
                Aprenda
              </UnavailableAction>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <IconButton
            icon="search"
            label={searchOpen ? 'Fechar busca' : 'Buscar'}
            aria-expanded={searchOpen}
            aria-controls="header-search"
            className="hidden lg:inline-flex"
            onClick={() => {
              setSearchOpen((open) => !open)
            }}
          />
          <IconButton
            icon="cart"
            label="Carrinho"
            count={cartCount}
            onClick={() => {
              void navigate({ to: '/cart' })
            }}
          />
          {user ? (
            <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
              <Link to="/account/profile">
                <Icon name="user" size={18} />
                <span className="max-w-32 truncate">{user.displayName}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/login" search={{ redirect: href }}>
                <Icon name="logout" size={18} />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
      {searchOpen && (
        <div id="header-search" className="hidden pb-4 lg:block">
          <SearchField
            value=""
            onSearch={(term, { commit }) => {
              void navigate({
                to: '/',
                search: (previous) => ({ ...previous, q: term || undefined, page: undefined }),
                replace: !commit,
                hash: 'catalogo',
              })
            }}
          />
        </div>
      )}
    </header>
  )
}
