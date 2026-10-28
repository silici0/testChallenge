import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Button } from '../button'
import { EmptyState, ErrorState } from './state'

const meta = {
  title: 'Components/State',
  component: EmptyState,
  tags: ['visual'],
  args: { title: 'Nenhum NFT encontrado', description: 'Tente remover filtros ou buscar outro termo.' },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { action: <Button variant="outline">Limpar filtros</Button> } }

export const Error: Story = {
  render: () => (
    <ErrorState title="Não foi possível carregar o catálogo" description="Verifique sua conexão." onRetry={fn()} />
  ),
}

export const Retrying: Story = {
  render: () => <ErrorState title="Não foi possível carregar o catálogo" onRetry={fn()} isRetrying />,
}
