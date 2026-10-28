import type { Page } from '@playwright/test'
import { test as base } from 'playwright-bdd'

/** Controle do servidor simulado pela rede (/__mock/*) — nunca pelo estado do cliente (docs/testing.md). */
export class MockControl {
  constructor(private readonly page: Page) {}

  private async call(method: string, path: string, body?: unknown) {
    // O app só monta depois de startMocks(): a partir daí o MSW intercepta /__mock/*.
    await this.page.locator('[data-realtime-status]').waitFor({ state: 'attached' })
    const status = await this.page.evaluate(
      async ({ method, path, body }) =>
        (await fetch(path, { method, body: body === undefined ? null : JSON.stringify(body) })).status,
      { method, path, body },
    )
    if (status >= 400) throw new Error(`${method} ${path} → ${status}`)
  }

  setScenario(id: string) {
    return this.call('PUT', '/__mock/scenario', { id })
  }

  updateNft(nftId: string, patch: { editionId: string; priceEth?: string; available?: number }) {
    return this.call('POST', `/__mock/nfts/${nftId}`, patch)
  }

  resolveOrder(orderId: string, status: 'confirmed' | 'declined') {
    return this.call('POST', `/__mock/orders/${orderId}/resolve`, { status })
  }
}

interface World {
  /** Cenário a ativar na primeira navegação (via ?scenario=). */
  pendingScenario: string | null
}

export const test = base.extend<{ mock: MockControl; world: World }>({
  mock: async ({ page }, use) => {
    await use(new MockControl(page))
  },
  // Contexto novo por cenário: storage vazio → banco simulado parte do seed (isolamento).
  // eslint-disable-next-line no-empty-pattern -- assinatura exigida pelo Playwright para fixtures sem dependências
  world: async ({}, use) => {
    await use({ pendingScenario: null })
  },
})
