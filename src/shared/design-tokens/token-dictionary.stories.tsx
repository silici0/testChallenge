import type { Meta, StoryObj } from '@storybook/react-vite'

import { ColorTokens, RadiusTokens, ShadowTokens, SpacingTokens, TypographyTokens } from './token-dictionary'

/**
 * Dicionário de estilo gerado por Style Dictionary a partir de `tokens/` (DTCG), cuja fonte é a coleção
 * “Design Tokens” do Figma. Componentes usam apenas os tokens **semânticos** (`color.*`); a `palette` é primitiva.
 */
const meta = {
  title: 'Foundations/Design Tokens',
  component: ColorTokens,
  tags: ['visual'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ColorTokens>

export default meta
type Story = StoryObj<typeof meta>

export const SemanticColors: Story = { name: 'Cores semânticas' }
export const PaletteColors: Story = { name: 'Paleta (primitivos)', args: { group: 'palette' } }
export const Typography: Story = { name: 'Tipografia', render: () => <TypographyTokens /> }
export const Radius: Story = { name: 'Raios', render: () => <RadiusTokens /> }
export const Shadows: Story = { name: 'Sombras', render: () => <ShadowTokens /> }
export const Spacing: Story = { name: 'Espaçamento e layout', render: () => <SpacingTokens /> }
