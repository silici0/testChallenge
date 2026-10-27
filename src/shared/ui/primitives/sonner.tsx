import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/** Toaster do shadcn/ui (sonner) no tema único escuro; usa regiões aria-live próprias e não rouba o foco. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" aria-hidden />,
        info: <InfoIcon className="size-4" aria-hidden />,
        warning: <TriangleAlertIcon className="size-4 text-rare" aria-hidden />,
        error: <OctagonXIcon className="size-4 text-danger-text" aria-hidden />,
        loading: <Loader2Icon className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />,
      }}
      style={
        {
          '--normal-bg': 'var(--color-surface)',
          '--normal-text': 'var(--color-foreground)',
          '--normal-border': 'var(--color-border-soft)',
          '--border-radius': 'var(--radius-sm)',
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
