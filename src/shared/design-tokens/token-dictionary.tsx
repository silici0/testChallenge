import { tokenCatalog, type TokenEntry } from './tokens.generated'

const byGroup = (group: string) => tokenCatalog.filter((token) => token.group === group)

function TokenMeta({ token }: { token: TokenEntry }) {
  return (
    <div className="flex flex-col gap-0.5">
      <code className="text-label font-bold text-foreground">{token.path}</code>
      <code className="text-caption text-foreground-secondary">{String(token.value)}</code>
      {token.reference && <code className="text-caption text-foreground-muted">→ {token.reference}</code>}
      {token.description && <p className="text-caption text-foreground-muted">{token.description}</p>}
    </div>
  )
}

export function ColorTokens({ group = 'color' }: { group?: 'color' | 'palette' }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      {byGroup(group).map((token) => (
        <li key={token.path} className="flex gap-3 rounded-sm bg-surface p-3">
          <span
            aria-hidden="true"
            className="size-12 shrink-0 rounded-sm border border-border-soft"
            style={{ backgroundColor: String(token.value) }}
          />
          <TokenMeta token={token} />
        </li>
      ))}
    </ul>
  )
}

export function TypographyTokens() {
  return (
    <ul className="flex flex-col gap-4">
      {byGroup('font-size').map((token) => (
        <li key={token.path} className="grid grid-cols-[220px_1fr] items-baseline gap-6 border-b border-border pb-3">
          <TokenMeta token={token} />
          <span style={{ fontSize: String(token.value), lineHeight: token.lineHeight ?? undefined }}>
            Emerald Ape #042 — 1.19 ETH
          </span>
        </li>
      ))}
    </ul>
  )
}

export function RadiusTokens() {
  return (
    <ul className="flex flex-wrap gap-6">
      {byGroup('radius').map((token) => (
        <li key={token.path} className="flex flex-col items-center gap-2">
          <span
            aria-hidden="true"
            className="size-20 border-2 border-primary bg-surface"
            style={{ borderRadius: String(token.value) }}
          />
          <TokenMeta token={token} />
        </li>
      ))}
    </ul>
  )
}

export function ShadowTokens() {
  return (
    <ul className="flex flex-wrap gap-8 bg-surface-raised p-8">
      {byGroup('shadow').map((token) => (
        <li key={token.path} className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="size-24 rounded-xl bg-surface"
            style={{ boxShadow: String(token.value) }}
          />
          <TokenMeta token={token} />
        </li>
      ))}
    </ul>
  )
}

export function SpacingTokens() {
  return (
    <ul className="flex flex-col gap-3">
      {[...byGroup('spacing'), ...byGroup('layout')].map((token) => (
        <li key={token.path} className="grid grid-cols-[220px_1fr] items-center gap-6">
          <TokenMeta token={token} />
          <span
            aria-hidden="true"
            className="h-3 max-w-full rounded-xs bg-primary"
            style={{ width: String(token.value) }}
          />
        </li>
      ))}
    </ul>
  )
}
