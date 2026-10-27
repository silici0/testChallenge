import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

import { tokenCatalog } from '@/shared/design-tokens/tokens.generated'

const tokenNames = (group: string) => tokenCatalog.filter((token) => token.group === group).map((token) => token.name)

/** tailwind-merge ciente dos tokens do projeto (Style Dictionary), evitando que `text-body` e `text-foreground` colidam. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: tokenNames('color'),
      radius: tokenNames('radius'),
      shadow: tokenNames('shadow'),
      text: tokenNames('font-size'),
      tracking: tokenNames('tracking'),
      container: tokenNames('layout'),
      spacing: tokenNames('spacing'),
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
