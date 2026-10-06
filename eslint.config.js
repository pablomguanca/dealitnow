import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  {
    rules: {
      // catch vacíos: para storage del navegador que puede no estar disponible, es intencional.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // ({ id, ...resto }) es la forma idiomática de omitir una propiedad.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }]
    }
  },
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser }
  },
  {
    files: ['api/**/*.js'],
    languageOptions: { globals: globals.node }
  },
  {
    files: ['tests/**/*.js', '*.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } }
  }
];
