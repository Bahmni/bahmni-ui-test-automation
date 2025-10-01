// eslint.config.js
import js from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';

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
      'allure-report/**',
      'allure-results/**',
    ],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node, // Node.js runtime globals (setTimeout, process, __dirname, etc.)
        ...globals.browser, // Browser runtime globals (document, window, etc.)
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
