import { Slot } from 'radix-ui'
import { type ComponentProps, type MouseEvent, type ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import { Icon, type IconName } from '../icon'
import { Spinner } from '../spinner'
import { type ButtonVariantProps, buttonVariants } from './button.variants'

export interface ButtonProps extends ComponentProps<'button'>, ButtonVariantProps {
  /** Renderiza o filho (ex.: `<a>` ou `<Link>`) com a aparência de botão. */
  asChild?: boolean
  isLoading?: boolean
  /** Texto anunciado durante o carregamento. */
  loadingText?: string
  leadingIcon?: IconName
  trailingIcon?: IconName
}

const isAriaDisabled = (value: ComponentProps<'button'>['aria-disabled']) => value === true || value === 'true'

export function Button({
  asChild = false,
  isLoading = false,
  loadingText,
  leadingIcon,
  trailingIcon,
  variant,
  size,
  uppercase,
  fullWidth,
  className,
  children,
  onClick,
  type = 'button',
  ...props
}: ButtonProps) {
  const blocked = isLoading || isAriaDisabled(props['aria-disabled'])

  // aria-disabled em vez de disabled: mantém o foco e a descoberta por leitores de tela.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (blocked) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  const classes = cn(buttonVariants({ variant, size, uppercase, fullWidth }), className)

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      {...props}
      aria-disabled={blocked || undefined}
      aria-busy={isLoading || undefined}
    >
      <ButtonContent
        isLoading={isLoading}
        loadingText={loadingText}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
      >
        {children}
      </ButtonContent>
    </button>
  )
}

interface ButtonContentProps {
  isLoading: boolean
  loadingText: string | undefined
  leadingIcon: IconName | undefined
  trailingIcon: IconName | undefined
  children: ReactNode
}

function ButtonContent({ isLoading, loadingText, leadingIcon, trailingIcon, children }: ButtonContentProps) {
  if (isLoading) {
    return (
      <>
        <Spinner size={16} />
        <span>{loadingText ?? children}</span>
      </>
    )
  }
  return (
    <>
      {leadingIcon && <Icon name={leadingIcon} size={18} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={18} />}
    </>
  )
}
