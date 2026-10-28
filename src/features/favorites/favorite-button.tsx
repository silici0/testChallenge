import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'

import { useSession } from '@/features/auth/use-session'
import { announce } from '@/shared/a11y'
import { cn } from '@/shared/lib/cn'
import { Button, Icon, IconButton } from '@/shared/ui'

import { favoritesQuery } from './api'
import { useToggleFavorite } from './use-toggle-favorite'

interface FavoriteButtonProps {
  nftId: string
  nftName: string
  /** `icon` sobre o card; `full` com texto (detalhe do NFT). */
  appearance?: 'icon' | 'full'
}

const heartClass = (pressed: boolean) => cn(pressed && '[&_svg]:fill-current')

function SignedInFavorite({ userId, nftId, nftName, appearance }: Required<FavoriteButtonProps> & { userId: string }) {
  const { data } = useQuery(favoritesQuery(userId))
  const { toggle } = useToggleFavorite({ userId, nftId, announce })
  const pressed = data?.nftIds.includes(nftId) ?? false
  const onClick = () => {
    toggle(!pressed)
  }
  if (appearance === 'full') {
    return (
      <Button variant="outline" aria-pressed={pressed} onClick={onClick} className={heartClass(pressed)}>
        <Icon name="heart" size={18} />
        {pressed ? 'Favoritado' : 'Favoritar'}
      </Button>
    )
  }
  return (
    <IconButton
      icon="heart"
      size="sm"
      label={`Favoritar ${nftName}`}
      pressed={pressed}
      onClick={onClick}
      className={cn('bg-background/80', heartClass(pressed))}
    />
  )
}

/** Favoritos exigem sessão: visitante é levado ao login e volta ao mesmo lugar (sem favoritar implicitamente). */
export function FavoriteButton({ nftId, nftName, appearance = 'icon' }: FavoriteButtonProps) {
  const { user } = useSession()
  const { href } = useLocation()
  if (user) return <SignedInFavorite userId={user.id} nftId={nftId} nftName={nftName} appearance={appearance} />
  const label = `Entre para favoritar ${nftName}`
  if (appearance === 'full') {
    return (
      <Button asChild variant="outline">
        <Link to="/login" search={{ redirect: href }} aria-label={label}>
          <Icon name="heart" size={18} />
          Favoritar
        </Link>
      </Button>
    )
  }
  return (
    <Link
      to="/login"
      search={{ redirect: href }}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-sm bg-background/80 text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Icon name="heart" size={18} />
    </Link>
  )
}
