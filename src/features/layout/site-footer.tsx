import { Link } from '@tanstack/react-router'
import { type SyntheticEvent, useState } from 'react'

import { categoryLabels } from '@/contracts'
import { Button, Icon, type IconName, UNAVAILABLE_HINT, UnavailableAction } from '@/shared/ui'

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'wallet',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    icon: 'user',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    icon: 'activity',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

/** Newsletter fora do escopo: o envio informa a indisponibilidade em vez de simular sucesso. */
function Newsletter() {
  const [message, setMessage] = useState<string>()
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(`Cadastro na newsletter ${UNAVAILABLE_HINT.toLowerCase()}.`)
  }
  return (
    <form onSubmit={submit} aria-labelledby="newsletter-title" className="flex flex-col gap-3">
      <h2 id="newsletter-title" className="text-body-lg font-bold text-foreground">
        Antecipe-se ao próximo lançamento
      </h2>
      <div className="flex">
        <label htmlFor="newsletter-email" className="sr-only">
          E-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="digite seu e-mail..."
          className="h-10 min-w-0 flex-1 rounded-l-sm border border-border-field bg-surface-raised px-3 text-label text-foreground placeholder:text-foreground-muted focus-visible:outline-2 focus-visible:outline-ring"
        />
        <Button type="submit" className="rounded-l-none">
          Enviar
        </Button>
      </div>
      <p className="text-caption text-foreground-secondary" role="status">
        {message ?? 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
      </p>
    </form>
  )
}

const columnTitle = 'mb-3 text-body-lg font-bold text-foreground'
const footerLink = 'text-label text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring'

export function SiteFooter() {
  return (
    <footer className="mt-section">
      <section aria-label="Benefícios" className="grid gap-8 rounded-t-sm bg-surface p-8 md:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex flex-col gap-3 lg:border-r lg:border-primary lg:pr-6">
            <span
              aria-hidden="true"
              className="flex size-16 items-center justify-center rounded-pill bg-primary text-on-primary"
            >
              <Icon name={benefit.icon} size={28} />
            </span>
            <h2 className="text-body-lg font-bold text-foreground">{benefit.title}</h2>
            <p className="text-label text-foreground-secondary">{benefit.text}</p>
          </div>
        ))}
        <Newsletter />
      </section>
      <div className="grid gap-4 bg-surface-strong px-8 py-6 text-label text-foreground sm:grid-cols-4 sm:items-center">
        <span className="font-bold tracking-wide">KURIO</span>
        <span>Feito para colecionadores, criadores e cultura</span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>
      <div className="grid gap-8 rounded-b-sm bg-surface p-8 sm:grid-cols-2 lg:grid-cols-4">
        <nav aria-labelledby="footer-profile">
          <h2 id="footer-profile" className={columnTitle}>
            Meu perfil
          </h2>
          <ul className="flex flex-col gap-2">
            <li>
              <Link to="/account/profile" className={footerLink}>
                Meu perfil
              </Link>
            </li>
            <li>
              <Link to="/account/wallets" className={footerLink}>
                Carteiras
              </Link>
            </li>
            <li>
              <Link to="/account/favorites" className={footerLink}>
                Lista de interesse
              </Link>
            </li>
            <li>
              <UnavailableAction appearance="text">Atividade</UnavailableAction>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className={columnTitle}>Central de ajuda</h2>
          <ul className="flex flex-col gap-2">
            {[
              'Central de ajuda',
              'Como comprar NFTs',
              'Carteira e segurança',
              'Política do mercado',
              'Denunciar item',
            ].map((label) => (
              <li key={label}>
                <UnavailableAction appearance="text">{label}</UnavailableAction>
              </li>
            ))}
          </ul>
        </div>
        <nav aria-labelledby="footer-collections">
          <h2 id="footer-collections" className={columnTitle}>
            Coleções
          </h2>
          <ul className="flex flex-col gap-2">
            {(['arte-digital', 'fotografia', 'musica', 'arte-3d', 'utilidade'] as const).map((category) => (
              <li key={category}>
                <Link to="/" search={{ category: [category] }} hash="catalogo" className={footerLink}>
                  {categoryLabels[category]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-6">
          <div>
            <h2 className={columnTitle}>Redes sociais</h2>
            <ul className="flex gap-2">
              {['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube'].map((network) => (
                <li key={network}>
                  <UnavailableAction variant="outline" size="sm" className="size-8 px-0">
                    <span aria-hidden="true">{network.slice(0, 2)}</span>
                    <span className="sr-only">{network}</span>
                  </UnavailableAction>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={columnTitle}>Carteiras compatíveis</h2>
            <p className="inline-block rounded-sm border border-border-soft px-3 py-2 text-tiny font-bold tracking-wide text-primary">
              METAMASK • WALLETCONNECT • COINBASE
            </p>
          </div>
        </div>
      </div>
      <p className="py-6 text-center text-label text-foreground">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
