/** Páginas visíveis com reticências: 1 … 4 5 6 … 12 */
export function pageWindow(current: number, total: number, radius = 1): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = new Set([1, total, ...Array.from({ length: radius * 2 + 1 }, (_, index) => current - radius + index)])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
  return sorted.flatMap((page, index) =>
    index > 0 && page - (sorted[index - 1] ?? page) > 1 ? ['gap' as const, page] : [page],
  )
}
