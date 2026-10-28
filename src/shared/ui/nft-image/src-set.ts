/** Variações geradas por largura: nome.webp (1024) → nome-320.webp, nome-640.webp. */
export function buildSrcSet(url: string): string | undefined {
  if (!url.endsWith('.webp')) return undefined
  const base = url.slice(0, -'.webp'.length)
  return `${base}-320.webp 320w, ${base}-640.webp 640w, ${url} 1024w`
}
