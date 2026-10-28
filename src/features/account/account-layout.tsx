import { Link, Outlet, useNavigate, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Icon, type IconName, UnavailableAction } from '@/shared/ui'

const linkClass =
  'flex items-center gap-3 border-l-4 border-transparent px-3 py-2.5 text-label text-primary whitespace-nowrap transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-ring data-[status=active]:border-primary data-[status=active]:font-bold'

const LINKS: { to: '/account/profile' | '/account/wallets' | '/account/favorites'; label: string; icon: IconName }[] = [
  { to: '/account/profile', label: 'Dados do perfil', icon: 'user' },
  { to: '/account/wallets', label: 'Carteiras', icon: 'location' },
  { to: '/account/favorites', label: 'Lista de interesse', icon: 'heart' },
]
const UNAVAILABLE: { label: string; icon: IconName }[] = [
  { label: 'Atividade', icon: 'cart' },
  { label: 'Ofertas', icon: 'activity' },
  { label: 'Arquivos baixados', icon: 'download' },
  { label: 'Suporte', icon: 'alert-triangle' },
]

function LogoutButton() {
  const { session } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true)
        void session.logout().then(() => navigate({ to: '/' }))
      }}
      className="flex w-full items-center gap-3 border-t border-border-soft px-3 py-3 text-label font-bold text-primary hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
    >
      <Icon name="logout" size={18} />
      {pending ? 'Saindo…' : 'Sair'}
    </button>
  )
}

/** Área da conta (Figma: Perfil/Carteiras). No mobile, o menu vira navegação horizontal. */
export function AccountLayout() {
  return (
    <div className="grid gap-8 lg:grid-cols-[theme(--container-sidebar)_1fr]">
      <nav aria-label="Minha conta" className="self-start rounded-sm bg-surface py-4">
        <h2 className="px-3 pb-2 text-body-lg font-bold text-foreground">Meu perfil</h2>
        <ul className="flex overflow-x-auto lg:flex-col">
          {LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className={linkClass}>
                <Icon name={link.icon} size={18} />
                {link.label}
              </Link>
            </li>
          ))}
          {UNAVAILABLE.map((item) => (
            <li key={item.label} className="hidden lg:block">
              <UnavailableAction
                appearance="text"
                className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-primary/80')}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </UnavailableAction>
            </li>
          ))}
        </ul>
        <LogoutButton />
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
