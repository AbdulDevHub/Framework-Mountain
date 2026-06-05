// .eslintrc.cjs — ESLint configuration
// We use .cjs (CommonJS) here because ESLint's config loader doesn't support ESM yet.

module.exports = {
  // "root: true" tells ESLint to stop looking for config files in parent directories.
  root: true,

  // Parsers let ESLint understand TypeScript syntax (which plain ESLint can't).
  parser: "@typescript-eslint/parser",

  parserOptions: {
    ecmaVersion: "latest", // Allow modern JS syntax
    sourceType: "module",  // Our code uses ES module import/export
  },

  plugins: [
    "@typescript-eslint", // Provides TypeScript-specific lint rules
  ],

  extends: [
    "eslint:recommended",                       // ESLint's core recommended rules
    "plugin:@typescript-eslint/recommended",    // TypeScript-specific recommended rules
  ],

  env: {
    node: true, // Recognise Node.js globals (e.g. process, __dirname)
  },
};
