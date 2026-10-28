import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import { Button } from '../button'
import { Icon, type IconName } from '../icon'

interface StateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  /** Use `h1` quando o estado substitui a página inteira (ex.: não encontrado): toda página tem um título. */
  titleAs?: 'p' | 'h1' | 'h2'
}

function StateLayout({
  icon,
  title,
  description,
  action,
  className,
  role,
  titleAs: Title = 'p',
}: StateProps & { icon: IconName; role?: 'alert' }) {
  return (
    <div
      role={role}
      className={cn('flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-12 text-center', className)}
    >
      <Icon name={icon} size={32} className="text-primary" />
      <Title className="text-title font-bold text-foreground">{title}</Title>
      {description && <p className="max-w-md text-label text-foreground-secondary">{description}</p>}
      {action}
    </div>
  )
}

/** Estado vazio no padrão visual do layout (estados não desenhados — §1). */
export function EmptyState(props: StateProps) {
  return <StateLayout icon="image" {...props} />
}

export interface ErrorStateProps extends Omit<StateProps, 'action'> {
  onRetry?: () => void
  isRetrying?: boolean
}

/** Erro de seção com nova tentativa; anunciado imediatamente (role=alert). */
export function ErrorState({ onRetry, isRetrying = false, ...props }: ErrorStateProps) {
  return (
    <StateLayout
      icon="alert-triangle"
      role="alert"
      {...props}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry} isLoading={isRetrying} loadingText="Tentando novamente…">
            Tentar novamente
          </Button>
        )
      }
    />
  )
}
