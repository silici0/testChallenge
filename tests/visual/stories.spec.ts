import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

interface StoryIndexEntry {
  id: string
  title: string
  name: string
  type: 'story' | 'docs'
  tags?: string[]
}

// Gerado por `storybook build`; lido de forma síncrona para declarar um teste por story.
const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf-8')) as {
  entries: Record<string, StoryIndexEntry>
}
const stories = Object.values(index.entries).filter((entry) => entry.type === 'story' && entry.tags?.includes('visual'))

for (const story of stories) {
  test(`${story.title} › ${story.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`)
    const root = page.locator('#storybook-root')
    await expect(root).toBeVisible()
    // Aguarda o Storybook concluir render, play e afterEach (o play de algumas stories digita/clica).
    await page.waitForFunction(() => {
      const preview = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
        .__STORYBOOK_PREVIEW__
      return preview?.currentRender?.phase === 'finished'
    })
    await page.evaluate(async () => {
      // O play de algumas stories deixa foco: o anel de foco não entra na captura (antialiasing instável).
      // Em diálogos o trap de foco devolve o foco a um elemento variável após blur(): foca o próprio container.
      const dialog = document.querySelector('[role="dialog"]')
      if (dialog instanceof HTMLElement) {
        dialog.style.outline = 'none' // anel de foco do container é artefato da captura, não do componente
        dialog.focus()
      } else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      await document.fonts.ready
      // Imagens ainda decodificando (galeria, diálogo) geram quadros diferentes entre execuções.
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
      await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined)))
    })
    // Stories com portal (dialog, sheet, select aberto) capturam a página inteira.
    const target = story.tags?.includes('visual:page') ? page : root
    await expect(target).toHaveScreenshot(`${story.id}.png`)
  })
}
