import js from '@eslint/js'
import tseslintPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import sonarjsPlugin from 'eslint-plugin-sonarjs'
import importPlugin from 'eslint-plugin-import'
import noOnlyTestsPlugin from 'eslint-plugin-no-only-tests'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'src-tauri/target/**',
      'coverage/**',
      'src/types/database.types.ts',
      'eslint.config.js',
      'vite.config.ts',
      'vitest.config.ts',
      '*.config.js',
      '*.config.mjs',
      '*.config.cjs',
      'scripts/**',
      'docs/**',
      '.planning/**',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      sonarjs: sonarjsPlugin,
      'no-only-tests': noOnlyTestsPlugin,
      import: importPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      ...tseslintPlugin.configs['eslint-recommended'].overrides[0].rules,
      ...tseslintPlugin.configs['recommended-type-checked'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...sonarjsPlugin.configs['recommended-legacy'].rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,

      /* Size and complexity */
      'max-lines-per-function': [
        'error',
        { max: 100, skipComments: true, skipBlankLines: true, IIFEs: true },
      ],
      'max-lines': ['error', { max: 400, skipComments: true, skipBlankLines: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 5],
      'max-statements': ['error', 30, { ignoreTopLevelFunctions: false }],

      /* SonarJS */
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-inverted-boolean-check': 'error',
      'sonarjs/no-small-switch': 'off',
      /* sonarjs/deprecation: @types/react 19 flags valid types as deprecated (e.g., FormEvent) — disable until plugin catches up */
      'sonarjs/deprecation': 'off',
      /* sonarjs/slow-regex: high false-positive rate on bounded character classes — disable */
      'sonarjs/slow-regex': 'off',

      /* Imports */
      'import/no-cycle': ['error', { maxDepth: 2 }],
      'import/no-duplicates': 'error',
      /* import/no-unused-modules disabled in flat config — requires .eslintrc.json shim that breaks ESLint v9 root resolution. Vite tree-shaking already detects unused exports at build time. */
      'import/no-unused-modules': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../../*'],
              message: 'Imports com 3+ níveis de ../: use alias @/* em vez disso.',
            },
          ],
          paths: [
            { name: 'next', message: 'Este projeto usa Vite + React, não Next.js.' },
            {
              name: 'next/navigation',
              message: 'Use react-router-dom em vez de next/navigation.',
            },
            { name: 'next/image', message: 'Use <img> padrão ou componente próprio.' },
          ],
        },
      ],

      /* TypeScript */
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      /* Safety / best practices */
      'no-only-tests/no-only-tests': 'error',
      'no-console': 'error',
      'no-debugger': 'error',
      'no-unreachable': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  /* Override: logger may use console */
  {
    files: ['src/lib/logger.ts'],
    rules: { 'no-console': 'off' },
  },

  /* Override: tests — mocks intentionally use `any`, fixtures repeat strings */
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/test/**'],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'max-nested-callbacks': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/no-nested-functions': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  /* Prettier disables conflicting style rules — must be last */
  prettierConfig,
]
