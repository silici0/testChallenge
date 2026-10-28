// Typecheck do projeto inteiro quando há arquivos TS no commit (tsc não aceita lista de arquivos com project references).
export default {
  'tokens/**/*.json': ['node style-dictionary.config.mjs', 'git add src/styles/generated src/shared/design-tokens'],
  '*.{ts,tsx}': [
    () => 'tsc -b',
    'eslint --fix --max-warnings=0 --no-warn-ignored',
    'prettier --write',
    'vitest related --run --project unit --passWithNoTests',
  ],
  '*.{js,mjs,cjs}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{json,css,md,html,yml,yaml}': ['prettier --write'],
}
