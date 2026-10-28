import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { isApiError } from '@/shared/api'

/**
 * Leva os `fieldErrors` da API (422/409) aos campos do formulário e devolve a mensagem geral
 * quando o erro não pertence a um campo conhecido (ADR-0017).
 */
export function applyApiErrors<TFields extends FieldValues>(
  error: unknown,
  { setError, fields }: { setError: UseFormSetError<TFields>; fields: readonly Path<TFields>[] },
): string | null {
  if (!isApiError(error)) return 'Não foi possível concluir. Tente novamente.'
  let first = true
  let matched = false
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (!fields.includes(field as Path<TFields>)) continue
    setError(field as Path<TFields>, { type: 'server', message: messages[0] ?? error.message }, { shouldFocus: first })
    first = false
    matched = true
  }
  if (matched) return null
  return error.retryable ? 'Falha de conexão. Verifique sua internet e tente novamente.' : error.message
}
