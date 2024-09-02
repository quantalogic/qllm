// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'warn',
      'no-empty': 'warn',
      'no-prototype-builtins': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn', // Changed from 'error' to 'warn'
      'no-case-declarations': 'warn', // Changed from 'error' to 'warn',
      'require-yield': 'warn', // Changed from 'error' to 'warn',
      'no-useless-catch': 'warn', // Changed from 'error' to 'warn',
      'no-throw-literal': 'warn', // Example rule to treat literal throws as warnings
    },
  },
);
