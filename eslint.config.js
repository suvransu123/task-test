//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      // Disable false positives for escape characters in regex character classes
      'no-useless-escape': 'off',
      // Disable false positives for unnecessary conditions (control flow analysis limitations)
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // Disable false positives for unnecessary type assertions
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // Disable missing exhaustive-deps (requires eslint-plugin-react-hooks)
      'react-hooks/exhaustive-deps': 'off',
      // Disable prefer-for-of (stylistic choice)
      '@typescript-eslint/prefer-for-of': 'off',
      // Disable consistent-type-imports (stylistic choice)
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
