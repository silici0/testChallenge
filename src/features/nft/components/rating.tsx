import { Icon } from '@/shared/ui'

/** Avaliação: estrelas decorativas + texto completo para leitores de tela. */
export function Rating({ average, count }: { average: number; count: number }) {
  const filled = Math.round(average)
  return (
    <p className="flex items-center gap-2 text-label text-foreground">
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Icon
            key={index}
            name="star"
            size={14}
            className={index < filled ? 'text-primary' : 'text-foreground-muted'}
          />
        ))}
      </span>
      <span className="sr-only">Nota {average.toFixed(1).replace('.', ',')} de 5, </span>
      {count} avaliações de colecionadores
    </p>
  )
}
