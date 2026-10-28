import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'
import { Dialog, DialogContent, DialogDescription, DialogTitle, UnavailableAction } from '@/shared/ui'

export interface AuthDialogProps {
  mode: 'login' | 'register'
  description: string
  redirect: string | undefined
  onClose: () => void
  children: ReactNode
}

const tabClass = (active: boolean) =>
  cn(
    'rounded-sm text-h3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    active ? 'font-bold text-primary' : 'text-foreground hover:text-primary',
  )

/** Modal de autenticação (Figma: modal sobre a Início) com backdrop a 60 % (comentário #58). */
export function AuthDialog({ mode, description, redirect, onClose, children }: AuthDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto bg-surface p-8 sm:max-w-[500px]">
        <nav aria-label="Acesso à conta" className="flex items-center justify-center gap-3">
          <Link
            to="/login"
            search={{ redirect }}
            replace
            className={tabClass(mode === 'login')}
            aria-current={mode === 'login' ? 'page' : undefined}
          >
            Entrar
          </Link>
          <span aria-hidden="true" className="h-6 w-px bg-primary" />
          <Link
            to="/register"
            search={{ redirect }}
            replace
            className={tabClass(mode === 'register')}
            aria-current={mode === 'register' ? 'page' : undefined}
          >
            Criar conta
          </Link>
        </nav>
        {/* A rota de autenticação é uma página: o título do modal é o seu h1. */}
        <DialogTitle asChild>
          <h1 className="sr-only">{mode === 'login' ? 'Entrar na Kurio' : 'Criar conta na Kurio'}</h1>
        </DialogTitle>
        <DialogDescription className="text-center text-label text-foreground">{description}</DialogDescription>
        {children}
        <div className="flex flex-col gap-3 border-t border-border-soft pt-5">
          <p className="text-center text-caption text-foreground">Ou continue com</p>
          <UnavailableAction variant="outline" fullWidth>
            <img src="/logos/google-1.svg" alt="" width={18} height={18} />
            Continuar com Google
          </UnavailableAction>
          <UnavailableAction variant="outline" fullWidth>
            <img src="/logos/facebook-1.svg" alt="" width={18} height={18} />
            Continuar com Facebook
          </UnavailableAction>
        </div>
      </DialogContent>
    </Dialog>
  )
}
