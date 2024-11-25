// packages//qllm-samples/eslint.config.jms
// @ts-check

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**'], // Ignore unnecessary files
  },
  {
    files: ['*.ts', '*.tsx'], // Apply only to TypeScript files
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // Ensure this points to your tsconfig.json
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules, // Use recommended TypeScript rules
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules, // Include type-checking rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      'no-empty': 'warn',
      'no-prototype-builtins': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn', // Changed from 'error' to 'warn'
      'no-case-declarations': 'warn', // Changed from 'error' to 'warn'
      'require-yield': 'warn', // Changed from 'error' to 'warn'
      'no-useless-catch': 'warn', // Changed from 'error' to 'warn'
    },
  },
];