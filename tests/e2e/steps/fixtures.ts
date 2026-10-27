import { test as base } from 'playwright-bdd'

/** Ponto único para fixtures compartilhadas (cenário de mock, sessão, relógio) — ver docs/testing.md. */
export const test = base.extend({})
