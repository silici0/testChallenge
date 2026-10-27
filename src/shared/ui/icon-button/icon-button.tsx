import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'

import { Icon, type IconName } from '../icon'

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: IconName
  /** Nome acessível obrigatório: botões só com ícone precisam de rótulo. */
  label: string
  /** Contador exibido sobre o ícone (ex.: itens no carrinho). Incluído no nome acessível (“Carrinho, 6 itens”). */
  count?: number
  size?: 'sm' | 'md'
  /** Estado de alternância (ex.: favorito). Vira `aria-pressed`. */
  pressed?: boolean
}

const SIZES = { sm: { box: 'size-8', icon: 18 }, md: { box: 'size-10', icon: 24 } } as const

export function IconButton({
  icon,
  label,
  count,
  size = 'md',
  pressed,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const accessibleName = count === undefined ? label : `${label}, ${count} ${count === 1 ? 'item' : 'itens'}`
  return (
    <button
      type={type}
      aria-label={accessibleName}
      aria-pressed={pressed}
      className={cn(
        'relative inline-flex items-center justify-center rounded-sm text-foreground transition-colors hover:text-primary',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:text-primary',
        SIZES[size].box,
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={SIZES[size].icon} />
      {count !== undefined && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-primary px-1 text-tiny font-bold text-on-primary"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
