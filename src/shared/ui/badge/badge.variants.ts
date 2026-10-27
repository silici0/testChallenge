import { cva, type VariantProps } from 'class-variance-authority'

export const badgeVariants = cva('inline-flex items-center justify-center font-mono font-bold', {
  variants: {
    variant: {
      rare: 'rounded-xs bg-rare px-2 py-0.5 text-tiny tracking-wide text-on-primary uppercase',
      count: 'min-w-4 rounded-pill bg-primary px-1 text-tiny text-on-primary',
      status: 'rounded-xs border border-border-field px-2 py-0.5 text-caption-sm text-foreground-secondary',
      success: 'rounded-xs bg-success/15 px-2 py-0.5 text-caption-sm text-success',
      danger: 'rounded-xs bg-danger/15 px-2 py-0.5 text-caption-sm text-danger-text',
    },
  },
  defaultVariants: { variant: 'status' },
})

export type BadgeVariantProps = VariantProps<typeof badgeVariants>
