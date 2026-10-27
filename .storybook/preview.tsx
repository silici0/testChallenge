import '../src/styles/index.css'

import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    a11y: { test: 'error' },
    docs: { toc: true },
  },
  decorators: [
    (Story) => (
      <div className="bg-background p-6 font-mono text-foreground">
        <Story />
      </div>
    ),
  ],
}

export default preview
