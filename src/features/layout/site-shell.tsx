import type { ReactNode } from 'react'

import { MobileNav } from './mobile-nav'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

/** Estrutura comum: skip link, header, conteúdo, rodapé e barra inferior no mobile. */
export function SiteShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 font-bold text-on-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Ir para o conteúdo
      </a>
      <div className="mx-auto w-full max-w-page px-gutter pb-24 lg:pb-0">
        <SiteHeader />
        <main id="conteudo" tabIndex={-1} className="pt-8 outline-none">
          {children}
        </main>
        {footer && <SiteFooter />}
      </div>
      <MobileNav />
    </>
  )
}
