import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'

import { CatalogToolbar } from './catalog-toolbar'
import { FilterGroup } from './filter-group'
import { PriceRangeFilter } from './price-range-filter'
import { SearchField } from './search-field'

const categories = [
  { id: 'arte-3d', label: 'Arte 3D', count: 7 },
  { id: 'arte-digital', label: 'Arte digital', count: 7 },
  { id: 'musica', label: 'Música', count: 7 },
]

const meta = {
  title: 'Catalog/Filters',
  component: FilterGroup,
  tags: ['visual'],
  args: { legend: 'Coleções', options: categories, selected: ['musica'], onToggle: fn() },
  decorators: [(Story) => <div className="w-sidebar rounded-sm bg-surface p-5">{Story()}</div>],
} satisfies Meta<typeof FilterGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Categories: Story = {
  render: (args) => {
    const [selected, setSelected] = useState(args.selected)
    return (
      <FilterGroup
        {...args}
        selected={selected}
        onToggle={(id, checked) => {
          setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)))
        }}
      />
    )
  },
}

export const PriceRange: Story = {
  name: 'Faixa de preço',
  render: () => <PriceRangeFilter bounds={{ minEth: '0.02', maxEth: '12.3' }} value={{}} onApply={fn()} />,
}

export const Search: Story = {
  name: 'Busca',
  render: () => <SearchField value="" onSearch={fn()} />,
}

export const Toolbar: Story = {
  name: 'Abas e ordenação',
  decorators: [(Story) => <div className="w-[842px]">{Story()}</div>],
  render: () => (
    <CatalogToolbar
      tab="all"
      sort="recent"
      onSortChange={fn()}
      renderTabLink={({ tab, children, ...props }) => (
        <a href={`#${tab}`} {...props}>
          {children}
        </a>
      )}
    />
  ),
}
