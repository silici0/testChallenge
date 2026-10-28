import { Link } from '@tanstack/react-router'

import { useCartCount } from '@/features/cart/use-cart'
import { Icon, type IconName } from '@/shared/ui'

const item =
  'flex flex-col items-center gap-1 rounded-sm px-3 py-1 text-tiny text-foreground-secondary focus-visible:outline-2 focus-visible:outline-ring data-[status=active]:text-primary'

function NavIcon({ icon, label, count }: { icon: IconName; label: string; count?: number }) {
  return (
    <>
      <span className="relative">
        <Icon name={icon} size={22} />
        {count !== undefined && count > 0 && (
          <span className="absolute -top-1.5 -right-2 rounded-pill bg-primary px-1 text-tiny font-bold text-on-primary">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      {label}
      {count !== undefined && count > 0 && <span className="sr-only">, {count} itens</span>}
    </>
  )
}

/** Barra inferior do mobile (Figma: Mobile / Início). */
export function MobileNav() {
  const cartCount = useCartCount()
  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around py-2">
        <li>
          <Link to="/" className={item} activeOptions={{ exact: true, includeHash: false }}>
            <NavIcon icon="home" label="Início" />
          </Link>
        </li>
        <li>
          <Link to="/account/favorites" className={item}>
            <NavIcon icon="heart" label="Favoritos" />
          </Link>
        </li>
        <li>
          <Link to="/" hash="catalogo" className={item} activeOptions={{ exact: true, includeHash: true }}>
            <NavIcon icon="search" label="Explorar" />
          </Link>
        </li>
        <li>
          <Link to="/cart" className={item}>
            <NavIcon icon="cart" label="Carrinho" count={cartCount} />
          </Link>
        </li>
        <li>
          <Link to="/account/profile" className={item}>
            <NavIcon icon="user" label="Conta" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
