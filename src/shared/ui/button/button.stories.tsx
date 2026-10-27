import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'

import { iconNames } from '../icon'
import { Button } from './button'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['visual'],
  args: { children: 'Comprar', onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'outline', 'ghost', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    leadingIcon: { control: 'select', options: [undefined, ...iconNames] },
    trailingIcon: { control: 'select', options: [undefined, ...iconNames] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Ação primária e secundária do layout (“EXPLORAR”, “COMPRAR”, “Favoritar”, “Continuar explorando”). Usa `aria-disabled` em vez de `disabled` para manter o foco em ações bloqueadas.',
      },
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Comprar' }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const Outline: Story = { args: { variant: 'outline', children: 'Favoritar', leadingIcon: 'heart' } }

export const Ghost: Story = { args: { variant: 'ghost', children: 'Continuar explorando' } }

export const Link: Story = { args: { variant: 'link', children: 'Ler mais', trailingIcon: 'arrow-right' } }

export const Uppercase: Story = { args: { uppercase: true, children: 'Explorar' } }

export const FullWidth: Story = {
  args: { fullWidth: true, size: 'lg', children: 'Conectar e finalizar' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
}

export const Loading: Story = {
  args: { isLoading: true, loadingText: 'Confirmando…', children: 'Confirmar compra' },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button')
    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
    await expect(button).toHaveAttribute('aria-busy', 'true')
  },
}

export const AriaDisabled: Story = {
  name: 'Indisponível (fora do escopo)',
  args: {
    'aria-disabled': true,
    title: 'Indisponível na demonstração',
    children: 'Continuar com Google',
    variant: 'outline',
  },
}

export const AsLink: Story = {
  args: { asChild: true, variant: 'outline', children: <a href="#carrinho">Ir para o carrinho</a> },
}

export const Matrix: Story = {
  name: 'Matriz de variações',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid grid-cols-3 items-center gap-4">
      {(['primary', 'outline', 'ghost', 'link'] as const).map((variant) =>
        (['sm', 'md', 'lg'] as const).map((size) => (
          <Button key={`${variant}-${size}`} variant={variant} size={size}>
            {`${variant} ${size}`}
          </Button>
        )),
      )}
    </div>
  ),
}
