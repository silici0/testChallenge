import { useId, useRef, useState } from 'react'

import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '@/contracts'
import { Button, Icon } from '@/shared/ui'

export interface AvatarFieldProps {
  avatarUrl: string | null
  onUpload: (file: File) => Promise<unknown>
  onRemove: () => Promise<unknown>
  isPending: boolean
}

/** Avatar: escolher arquivo (validado no cliente e na API) ou remover. */
export function AvatarField({ avatarUrl, onUpload, onRemove, isPending }: AvatarFieldProps) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      setError('Use PNG, JPEG ou WebP')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError('Máximo de 2 MB')
      return
    }
    setError(undefined)
    onUpload(file).catch(() => {
      setError('Não foi possível enviar o avatar')
    })
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-label font-bold text-foreground">Avatar</legend>
      <div className="flex items-center gap-4">
        <span className="flex size-12 items-center justify-center overflow-hidden rounded-pill bg-surface-raised text-primary">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Seu avatar" className="size-full object-cover" />
          ) : (
            <Icon name="image" size={22} label="Sem avatar" />
          )}
        </span>
        <input
          ref={input}
          id={inputId}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          className="sr-only"
          aria-label="Escolher imagem de avatar"
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <Button size="sm" isLoading={isPending} loadingText="Enviando…" onClick={() => input.current?.click()}>
          Alterar
        </Button>
        {avatarUrl && (
          <Button size="sm" variant="ghost" onClick={() => void onRemove()}>
            Remover
          </Button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      )}
    </fieldset>
  )
}
