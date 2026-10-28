import { useState } from 'react'

import { Icon } from '../icon'
import { TextField, type TextFieldProps } from '../text-field'

/** Campo de senha com mostrar/ocultar (botão com estado anunciado). */
export function PasswordField(props: Omit<TextFieldProps, 'type' | 'endAdornment'>) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => {
            setVisible((current) => !current)
          }}
          className="flex size-8 items-center justify-center rounded-sm text-foreground-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Icon name="eye-off" size={20} className={visible ? 'text-primary' : undefined} />
        </button>
      }
    />
  )
}
