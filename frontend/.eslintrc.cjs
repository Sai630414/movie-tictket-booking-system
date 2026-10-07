module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/'],
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  extends: ['eslint:recommended'],
  rules: {
    // JSX component references and React's automatic JSX transform are not
    // understood by ESLint core's unused variable rule.
    'no-unused-vars': 'off',
  },
};
