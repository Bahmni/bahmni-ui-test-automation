// eslint.config.js
import js from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier';

export default [
  // Base config for all JS/TS files
  {
    files: ['**/*.{js,ts}'],
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'storageState*.json',
      '.git/**',
      'coverage/**',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        expect: 'readonly', // Playwright expect
      },
    },

    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      'prettier/prettier': 'error',
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'no-debugger': 'error',
    },
  },
  // Specific config for test files
  {
    files: ['tests/**/*.{js,ts}'],
    rules: {
      'no-console': 'off', // allow console.log in test code
    },
  },
];
