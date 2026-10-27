import type { SVGProps } from 'react'

import { cn } from '@/shared/lib/cn'

import { type IconName, iconRegistry } from './icon-registry'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  /** Tamanho em px (largura e altura). */
  size?: number
  /** Texto acessível. Sem ele, o ícone é decorativo (`aria-hidden`). */
  label?: string
}

export function Icon({ name, size = 20, label, className, ...props }: IconProps) {
  const Svg = iconRegistry[name]
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const }
  return <Svg width={size} height={size} focusable="false" className={cn('shrink-0', className)} {...a11y} {...props} />
}
