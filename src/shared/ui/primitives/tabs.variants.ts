import { cva } from 'class-variance-authority'

export const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-foreground-secondary group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-surface-raised',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'line',
    },
  },
)
