import type { Meta, StoryObj } from '@storybook/react-vite'

import { Pagination, type PaginationLinkProps } from './pagination'

const renderLink = ({ page, children, ...props }: PaginationLinkProps) => (
  <a href={`#page-${page}`} {...props}>
    {children}
  </a>
)

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['visual'],
  args: { page: 1, totalPages: 4, renderLink },
  argTypes: { page: { control: { type: 'number', min: 1 } }, totalPages: { control: { type: 'number', min: 1 } } },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPage: Story = {}
export const MiddlePage: Story = { args: { page: 6, totalPages: 12 } }
export const LastPage: Story = { args: { page: 4, totalPages: 4 } }
