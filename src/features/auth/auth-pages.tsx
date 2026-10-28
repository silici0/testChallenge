import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouteContext, useRouter } from '@tanstack/react-router'

import type { AuthResponse } from '@/contracts'
import { featuredQuery } from '@/features/catalog/api'
import { Hero } from '@/features/catalog/components/hero'
import { Button } from '@/shared/ui'

import { authApi } from './api'
import { AuthDialog } from './components/auth-dialog'
import { LoginForm } from './components/login-form'
import { RegisterForm } from './components/register-form'
import { isSafeRedirect } from './guards'

/** Fundo do modal: a vitrine da Início, como no Figma (inerte enquanto o diálogo está aberto). */
function Backdrop() {
  const { data } = useQuery(featuredQuery())
  return (
    <div aria-hidden="true" inert>
      <Hero
        slides={data?.items.slice(0, 3)}
        cta={
          <Button asChild uppercase tabIndex={-1}>
            <Link to="/">Explorar</Link>
          </Button>
        }
      />
    </div>
  )
}

function useAuthFlow(redirect: string | undefined) {
  const { session } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()
  const router = useRouter()
  const destination = isSafeRedirect(redirect) ? redirect : '/'
  return {
    complete: async (auth: AuthResponse) => {
      await session.signedIn(auth)
      await navigate({ to: destination, replace: true })
    },
    // Desistir do login: voltar ao destino só se ele for público. Uma rota privada traria o modal de volta
    // pelo guard (loop), então nesse caso o visitante vai para a Início.
    close: () => {
      const { pathname } = new URL(destination, window.location.origin)
      const isPrivate = router.matchRoutes(pathname, {}).some((match) => match.staticData.requiresAuth)
      void navigate({ to: isPrivate || pathname === '/login' ? '/' : destination, replace: true })
    },
  }
}

export function LoginPage({ redirect, reason }: { redirect: string | undefined; reason: 'expired' | undefined }) {
  const flow = useAuthFlow(redirect)
  return (
    <>
      <Backdrop />
      <AuthDialog
        mode="login"
        redirect={redirect}
        onClose={flow.close}
        description="Entre para gerenciar sua carteira, coleção e perfil de criador."
      >
        {reason === 'expired' && (
          <p role="alert" className="rounded-sm border border-danger px-3 py-2 text-label text-danger-text">
            Sua sessão expirou. Entre novamente para continuar de onde parou.
          </p>
        )}
        <LoginForm onSubmit={async (values) => flow.complete(await authApi.login(values))} />
      </AuthDialog>
    </>
  )
}

export function RegisterPage({ redirect }: { redirect: string | undefined }) {
  const flow = useAuthFlow(redirect)
  return (
    <>
      <Backdrop />
      <AuthDialog
        mode="register"
        redirect={redirect}
        onClose={flow.close}
        description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
      >
        <RegisterForm onSubmit={async (values) => flow.complete(await authApi.register(values))} />
      </AuthDialog>
    </>
  )
}
