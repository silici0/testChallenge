import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { authApi } from '@/features/auth/api'
import { renderApp, startMockServer, stopMockServer } from '@/test/app-harness'

const PASSWORD = 'Jungle#2026'
let current: Awaited<ReturnType<typeof renderApp>> | null = null

beforeAll(async () => {
  await startMockServer()
})
afterAll(() => {
  stopMockServer()
})
afterEach(() => {
  current?.unmount()
  current = null
})

async function signedInAt(path: string, email = 'bruno@example.test') {
  current = await renderApp('/')
  await current.app.session.signedIn(await authApi.login({ email, password: PASSWORD }))
  await current.app.router.navigate({ to: path })
  return current
}

const dialog = () => screen.findByRole('dialog', {}, { timeout: 5000 })

describe('Autenticação e conta (app real + servidor simulado)', () => {
  it('login pelo modal volta ao destino pedido', async () => {
    current = await renderApp('/login?redirect=%2Fcart')
    const modal = await dialog()
    await userEvent.type(within(modal).getByLabelText('E-mail'), 'ana@example.test')
    await userEvent.type(within(modal).getByLabelText('Senha'), PASSWORD)
    await userEvent.click(within(modal).getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Carrinho' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ana Collector/ })).toBeInTheDocument()
  })

  it('rota privada sem sessão leva ao login', async () => {
    current = await renderApp('/account/profile')
    expect(await screen.findByRole('dialog', { name: 'Entrar na Kurio' }, { timeout: 5000 })).toBeInTheDocument()
    expect(current.app.router.state.location.search).toMatchObject({ redirect: '/account/profile' })
  })

  it('cadastro com e-mail existente mostra o conflito no campo', async () => {
    current = await renderApp('/register')
    const modal = await dialog()
    await userEvent.type(within(modal).getByLabelText('Nome de usuário'), 'nova.conta')
    await userEvent.type(within(modal).getByLabelText('E-mail'), 'taken@example.test')
    await userEvent.type(within(modal).getByLabelText('Senha'), PASSWORD)
    await userEvent.type(within(modal).getByLabelText('Confirmar senha'), PASSWORD)
    await userEvent.click(within(modal).getByRole('button', { name: 'Criar conta' }))
    expect(await within(modal).findByText('Este e-mail já está cadastrado')).toBeInTheDocument()
  })

  it('edita o perfil e o cabeçalho reflete o novo nome', async () => {
    await signedInAt('/account/profile')
    const name = await screen.findByLabelText(/Nome de exibição/, {}, { timeout: 5000 })
    await userEvent.clear(name)
    await userEvent.type(name, 'Bruno Colecionador')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Bruno Colecionador/ })).toBeInTheDocument()
  })

  it('senha atual incorreta e avatar enviado', async () => {
    await signedInAt('/account/profile')
    await userEvent.type(await screen.findByLabelText('Senha atual', {}, { timeout: 5000 }), 'Errada#2026')
    await userEvent.type(screen.getByLabelText('Nova senha'), 'Nova#2026x')
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'Nova#2026x')
    await userEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
    expect(await screen.findByText('Senha atual incorreta')).toBeInTheDocument()

    const png = new File([new Uint8Array([137, 80, 78, 71])], 'avatar.png', { type: 'image/png' })
    await userEvent.upload(screen.getByLabelText('Escolher imagem de avatar'), png)
    expect(await screen.findByRole('img', { name: 'Seu avatar' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(await screen.findByRole('img', { name: 'Sem avatar' })).toBeInTheDocument()
  })

  it('lista de interesse e logout limpam a sessão', async () => {
    await signedInAt('/account/favorites', 'ana@example.test')
    const list = await screen.findByRole('list', { name: 'Resultados do catálogo' }, { timeout: 5000 })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await screen.findByRole('link', { name: 'Entrar' }, { timeout: 5000 })).toBeInTheDocument()
    expect(current?.app.queryClient.getQueryCache().findAll({ queryKey: ['user'] })).toHaveLength(0)
  })
})
