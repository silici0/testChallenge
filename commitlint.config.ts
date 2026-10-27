import { RuleConfigSeverity, type UserConfig } from '@commitlint/types'

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      RuleConfigSeverity.Warning,
      'always',
      [
        'tokens',
        'ui',
        'hooks',
        'lib',
        'catalog',
        'nft',
        'cart',
        'checkout',
        'orders',
        'auth',
        'profile',
        'wallets',
        'favorites',
        'realtime',
        'api',
        'mocks',
        'e2e',
        'storybook',
        'docs',
        'deps',
        'config',
        'ci',
      ],
    ],
    'body-max-line-length': [RuleConfigSeverity.Disabled],
  },
}

export default config
