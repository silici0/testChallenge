// Gera os artefatos de design tokens a partir de tokens/**/*.json (formato DTCG).
//  - src/styles/generated/theme.css → bloco @theme do Tailwind v4 (vira utilitários: bg-primary, text-body, rounded-xl…)
//  - src/shared/design-tokens/tokens.generated.ts → objeto tipado para o dicionário de tokens no Storybook
import StyleDictionary from 'style-dictionary'

const HEADER = '/* Arquivo gerado por style-dictionary.config.mjs a partir de tokens/. Não edite manualmente. */'

/** Prefixo do namespace do Tailwind v4 para cada grupo de tokens. */
const TAILWIND_NAMESPACE = {
  color: 'color',
  'font-family': 'font',
  'font-weight': 'font-weight',
  'font-size': 'text',
  tracking: 'tracking',
  radius: 'radius',
  shadow: 'shadow',
  layout: 'container',
  spacing: 'spacing',
}

const isPrimitivePalette = (token) => token.path[0] === 'palette'

StyleDictionary.registerFormat({
  name: 'css/tailwind-theme',
  format: ({ dictionary }) => {
    const lines = []
    for (const token of dictionary.allTokens) {
      if (isPrimitivePalette(token) || token.path[0] === 'border-width') continue
      const namespace = TAILWIND_NAMESPACE[token.path[0]]
      if (!namespace) continue
      const name = `--${namespace}-${token.path.slice(1).join('-')}`
      lines.push(`  ${name}: ${token.$value};`)
      const lineHeight = token.$extensions?.lineHeight
      if (lineHeight) lines.push(`  ${name}--line-height: ${lineHeight};`)
    }
    return `${HEADER}\n@theme {\n  --color-*: initial;\n${lines.join('\n')}\n}\n`
  },
})

StyleDictionary.registerFormat({
  name: 'typescript/token-catalog',
  format: ({ dictionary }) => {
    const catalog = dictionary.allTokens.map((token) => ({
      path: token.path.join('.'),
      group: token.path[0],
      name: token.path.slice(1).join('-'),
      type: token.$type,
      value: token.$value,
      reference:
        typeof token.original.$value === 'string' && token.original.$value.startsWith('{')
          ? token.original.$value
          : null,
      description: token.$description ?? null,
      lineHeight: token.$extensions?.lineHeight ?? null,
    }))
    return `${HEADER}\nexport const tokenCatalog = ${JSON.stringify(catalog, null, 2)} as const\n\nexport type TokenEntry = (typeof tokenCatalog)[number]\n`
  },
})

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  usesDtcg: true,
  log: { verbosity: 'default' },
  platforms: {
    tailwind: {
      transforms: ['name/kebab', 'color/css', 'shadow/css/shorthand', 'fontFamily/css'],
      buildPath: 'src/styles/generated/',
      files: [{ destination: 'theme.css', format: 'css/tailwind-theme' }],
    },
    catalog: {
      transforms: ['name/kebab', 'color/css', 'shadow/css/shorthand', 'fontFamily/css'],
      buildPath: 'src/shared/design-tokens/',
      files: [{ destination: 'tokens.generated.ts', format: 'typescript/token-catalog' }],
    },
  },
})

await sd.buildAllPlatforms()
