import { Heart, Link2, Mail, Minus, Plus, Search, Share2, ZoomIn } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import Activity from './svg/activity.svg?react'
import AlertTriangle from './svg/alert-triangle.svg?react'
import ArrowRight from './svg/arrow-right.svg?react'
import CaretDown from './svg/caret-down.svg?react'
import Cart from './svg/cart.svg?react'
import ChevronDown from './svg/chevron-down.svg?react'
import ChevronLeft from './svg/chevron-left.svg?react'
import ChevronRight from './svg/chevron-right.svg?react'
import Close from './svg/close.svg?react'
import Download from './svg/download.svg?react'
import EyeOff from './svg/eye-off.svg?react'
import Filter from './svg/filter.svg?react'
import Home from './svg/home.svg?react'
import Image from './svg/image.svg?react'
import Location from './svg/location.svg?react'
import Logout from './svg/logout.svg?react'
import Star from './svg/star.svg?react'
import Trash from './svg/trash.svg?react'
import User from './svg/user.svg?react'
import Wallet from './svg/wallet.svg?react'

type SvgComponent = ComponentType<SVGProps<SVGSVGElement>>

/** Ícones exportados do Figma (Iconly) + complementos lucide para vetores que não são componentes no arquivo. */
export const iconRegistry = {
  activity: Activity,
  'alert-triangle': AlertTriangle,
  'arrow-right': ArrowRight,
  'caret-down': CaretDown,
  cart: Cart,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  close: Close,
  download: Download,
  'eye-off': EyeOff,
  filter: Filter,
  home: Home,
  image: Image,
  location: Location,
  logout: Logout,
  star: Star,
  trash: Trash,
  user: User,
  wallet: Wallet,
  // Complementos (lucide-react) — ver ARCHITECTURE.md › Substituição de assets
  heart: Heart as SvgComponent,
  link: Link2 as SvgComponent,
  mail: Mail as SvgComponent,
  minus: Minus as SvgComponent,
  plus: Plus as SvgComponent,
  search: Search as SvgComponent,
  share: Share2 as SvgComponent,
  'zoom-in': ZoomIn as SvgComponent,
} satisfies Record<string, SvgComponent>

export type IconName = keyof typeof iconRegistry
export const iconNames = Object.keys(iconRegistry) as IconName[]
