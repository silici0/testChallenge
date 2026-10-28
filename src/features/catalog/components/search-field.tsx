import { type SyntheticEvent, useEffect, useId, useState } from 'react'

import { useDebouncedValue } from '@/shared/hooks'
import { Icon } from '@/shared/ui'

export interface SearchFieldProps {
  value: string
  /** Chamado com debounce durante a digitação (`commit: false`) e ao confirmar com Enter (`commit: true`). */
  onSearch: (term: string, options: { commit: boolean }) => void
  placeholder?: string
  debounceMs?: number
}

/** Busca do catálogo (role=search). Digitação atualiza a URL com replace; Enter cria entrada no histórico. */
export function SearchField({
  value,
  onSearch,
  placeholder = 'Explorar coleções',
  debounceMs = 300,
}: SearchFieldProps) {
  const id = useId()
  const [term, setTerm] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)
  // Valor externo mudou (histórico, link): o campo acompanha a URL.
  if (value !== syncedValue) {
    setSyncedValue(value)
    setTerm(value)
  }
  const debounced = useDebouncedValue(term, debounceMs)

  useEffect(() => {
    if (debounced.trim() !== value.trim()) onSearch(debounced.trim(), { commit: false })
    // onSearch/value são lidos no momento do debounce; reagir só ao termo estabilizado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(term.trim(), { commit: true })
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className="flex h-11 items-center gap-3 rounded-sm border border-border-field bg-surface-raised px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring"
    >
      <Icon name="search" size={20} className="text-foreground-secondary" />
      <label htmlFor={id} className="sr-only">
        Buscar NFTs, coleções ou criadores
      </label>
      <input
        id={id}
        type="search"
        value={term}
        placeholder={placeholder}
        onChange={(event) => {
          setTerm(event.target.value)
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-label text-foreground outline-none placeholder:text-foreground-muted"
      />
    </form>
  )
}
