import { useId, useState } from 'react'

import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui'

import type { MockScenario } from './api'
import { useMockPanel } from './use-mock-panel'

export interface MockPanelViewProps {
  scenarios: MockScenario[]
  active: string | undefined
  onActivate: (id: string) => void
  onDropSocket: () => void
  onRestoreSocket: () => void
  onReset: () => void
  isPending: boolean
  /** Controle externo de abertura (stories); sem ele o painel abre pelo botão. */
  defaultOpen?: boolean
}

/**
 * Painel de demonstração (README §5.1, ADR-0007): ferramenta do avaliador, visualmente separada da loja.
 * Atua só pelo plano de controle `/__mock/*`, como um operador do servidor.
 */
export function MockPanelView({
  scenarios,
  active,
  onActivate,
  onDropSocket,
  onRestoreSocket,
  onReset,
  isPending,
  defaultOpen = false,
}: MockPanelViewProps) {
  const selectId = useId()
  const [choice, setChoice] = useState<string>()
  const selected = choice ?? active ?? ''
  const description = scenarios.find((scenario) => scenario.id === selected)?.description

  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          // O nome acessível começa pelo texto visível (WCAG 2.5.3).
          aria-label="Mock: painel de simulação"
          className="fixed bottom-24 left-4 z-40 border-dashed bg-background lg:bottom-4"
        >
          Mock
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col gap-6 overflow-y-auto p-6">
        <SheetHeader className="p-0">
          <SheetTitle>Simulação (demonstração)</SheetTitle>
          <SheetDescription>
            Ferramenta do avaliador, fora da loja. Altera o servidor simulado, nunca o estado da interface.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (selected) onActivate(selected)
          }}
        >
          <label htmlFor={selectId} className="text-label font-bold text-foreground">
            Cenário
          </label>
          <select
            id={selectId}
            value={selected}
            onChange={(event) => setChoice(event.target.value)}
            aria-describedby={`${selectId}-description`}
            className="border-secondary h-11 rounded-sm border bg-surface-raised px-3 text-label text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.id}
                {scenario.id === active ? ' (ativo)' : ''}
              </option>
            ))}
          </select>
          <p id={`${selectId}-description`} className="text-caption text-foreground-secondary">
            {description}
          </p>
          <Button type="submit" disabled={!selected || selected === active} isLoading={isPending}>
            Aplicar cenário
          </Button>
        </form>

        <section aria-labelledby={`${selectId}-socket`} className="flex flex-col gap-3">
          <h3 id={`${selectId}-socket`} className="text-label font-bold text-foreground">
            Tempo real
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={onDropSocket}>
              Derrubar conexão
            </Button>
            <Button variant="outline" size="sm" onClick={onRestoreSocket}>
              Restaurar conexão
            </Button>
          </div>
        </section>

        <section aria-labelledby={`${selectId}-data`} className="flex flex-col gap-3">
          <h3 id={`${selectId}-data`} className="text-label font-bold text-foreground">
            Dados
          </h3>
          <p className="text-caption text-foreground-secondary">
            Restaura o seed, encerra a sessão e volta ao cenário padrão.
          </p>
          <Button variant="outline" size="sm" className="self-start" onClick={onReset}>
            Resetar dados
          </Button>
        </section>
      </SheetContent>
    </Sheet>
  )
}

/** Painel ligado ao servidor simulado. Carregado sob demanda só quando os mocks estão ativos. */
export function MockPanel() {
  const panel = useMockPanel()
  return (
    <MockPanelView
      scenarios={panel.scenarios}
      active={panel.active}
      onActivate={panel.activate}
      onDropSocket={panel.dropSocket}
      onRestoreSocket={panel.restoreSocket}
      onReset={panel.reset}
      isPending={panel.isPending}
    />
  )
}
