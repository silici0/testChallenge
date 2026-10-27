import { cva, type VariantProps } from 'class-variance-authority'

/** Estilos do botão a partir dos tokens. Separados do componente para reuso (ex.: links com aparência de botão). */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-mono font-bold whitespace-nowrap select-none',
    'transition-colors duration-150 motion-reduce:transition-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active',
        outline: 'border border-primary text-primary hover:bg-primary/10 active:bg-primary/20',
        ghost: 'text-primary hover:bg-primary/10',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-sm px-3 text-label',
        md: 'h-10 rounded-sm px-4 text-label',
        lg: 'h-12 rounded-sm px-6 text-body',
      },
      uppercase: { true: 'tracking-wide uppercase', false: '' },
      fullWidth: { true: 'w-full', false: '' },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md', uppercase: false, fullWidth: false },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
