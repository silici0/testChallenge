# Guia de contribuição

Regras automatizadas pelo ESLint, Prettier, Husky e commitlint ([ADR-0022](docs/adr/0022-qualidade-de-codigo-e-convencoes.md)). Estratégia de testes: [ADR-0021](docs/adr/0021-estrategia-de-testes-tdd-e-bdd.md).

## Anatomia de um componente endêmico

```
src/shared/ui/quantity-stepper/
  quantity-stepper.tsx           # apresentação: recebe estado/callbacks, só tokens semânticos
  quantity-stepper.variants.ts   # (se houver) estilos cva — reuso sem acoplar ao componente
  quantity-stepper.test.tsx      # Vitest + Testing Library: comportamento e a11y observáveis
  quantity-stepper.stories.tsx   # args, argTypes, variações, play, tag `visual`
  index.ts                       # API pública
src/shared/hooks/use-quantity-stepper/
  use-quantity-stepper.ts        # regra (limites, normalização) — sem JSX
  use-quantity-stepper.test.ts   # renderHook
```

Checklist para um componente novo:

- [ ] O teste do hook ou do componente foi escrito **antes** da implementação e falhou.
- [ ] Usa só tokens semânticos (`bg-surface`, `text-accent`…). Nada de hex, px solto nem paleta primitiva.
- [ ] Aceita as props nativas do elemento e `className`. Variantes em `cva`.
- [ ] Acessível: nome acessível, foco visível, estados que não dependem só de cor, `aria-*` corretos.
- [ ] A story tem `args`, controles, uma story por estado relevante, `play` quando há interação e a tag `visual`.
- [ ] `pnpm test:unit`, `pnpm test:stories` e `pnpm test:visual` passam. Baselines novas foram geradas com `pnpm test:visual:update` e revisadas.

## Fluxo TDD (lógica, hooks, domínio)

1. Escreva o teste descrevendo o comportamento (`describe` / `it` em português).
2. `pnpm test`: o teste deve falhar pelo motivo esperado.
3. Implemente o mínimo para passar.
4. Refatore com os testes verdes.

## Fluxo BDD (funcionalidades do usuário)

1. Descreva a funcionalidade em `tests/e2e/features/<nome>.feature` (Gherkin em português, `# language: pt`).
2. Marque os viewports com as tags `@main` (desktop e mobile) e `@responsive` (desktop, tablet e mobile).
3. Reutilize ou crie os steps em `tests/e2e/steps/*.steps.ts` com `createBdd(test)`.
4. `pnpm test:e2e` gera os testes (`bddgen`) e roda contra o build com MSW.

## Tokens

Edite `tokens/**/*.json` (DTCG) e rode `pnpm tokens:build`. Os arquivos gerados são versionados e regenerados automaticamente no commit. O dicionário fica no Storybook, em “Foundations/Design Tokens”.

## Commits

Use Conventional Commits, validado pelo commitlint:

```
feat(cart): aplicar cupom com validação da API
fix(ui): anunciar contador do carrinho no nome acessível
test(hooks): cobrir normalização do stepper
docs(adr): registrar estratégia de testes
```

Escopos: `tokens`, `ui`, `hooks`, `lib`, `catalog`, `nft`, `cart`, `checkout`, `orders`, `auth`, `profile`, `wallets`, `favorites`, `realtime`, `api`, `mocks`, `e2e`, `storybook`, `docs`, `deps`, `config`, `ci`.

## Hooks do Git

| Hook         | Executa                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| `pre-commit` | `lint-staged`: ESLint `--max-warnings=0`, Prettier, `vitest related` e regeneração de tokens |
| `commit-msg` | commitlint                                                                                   |
| `pre-push`   | `pnpm typecheck && pnpm test:unit`                                                           |
