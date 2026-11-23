// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    // supabase/functions es código de Deno (imports npm: y jsr:): se revisa al desplegar.
    ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*', 'supabase/functions/**', 'Nuevo/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Buffer y los módulos node: solo existen en las pruebas, no en el teléfono.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.ts', 'src/crypto/testing/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'Buffer', message: 'Usa Uint8Array; Buffer no existe en React Native.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='withExclusiveTransactionAsync']",
          message: 'Abre una conexión nueva sin la llave de SQLCipher. Usa withTransactionAsync.',
        },
      ],
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['node:*'], message: 'Los módulos de Node no existen en la app.' }] },
      ],
    },
  },
]);
