const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs', // Configura para que ESLint trabaje con CommonJS
      globals: {
        ...globals.node, // Agrega las variables globales de Node.js
      },
    },
  },
  pluginJs.configs.recommended,
];
