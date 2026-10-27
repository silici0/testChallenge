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
    await page.evaluate(() => document.fonts.ready)
    await expect(root).toHaveScreenshot(`${story.id}.png`)
  })
}
