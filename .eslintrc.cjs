const ESLINT_NO_CYCLE = process.env.NO_CYCLE === `1`;

module.exports = {
  extends: [
    `plugin:@typescript-eslint/recommended`,
    `plugin:@typescript-eslint/recommended-requiring-type-checking`,
    `plugin:@typescript-eslint/strict`,
    `plugin:prettier/recommended`,
    `plugin:import/errors`,
    `plugin:import/warnings`,
    `plugin:import/typescript`,
    `prettier`,
  ],
  overrides: [
    {
      files: [`*.ts`, `*.tsx`],
      rules: {
        "@typescript-eslint/explicit-function-return-type": [
          1,
          {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
          },
        ],
        "@typescript-eslint/no-unsafe-assignment": 2,
      },
    },
  ],
  parser: `@typescript-eslint/parser`,
  parserOptions: {
    ecmaVersion: 2018,
    project: `./tsconfig.eslint.json`,
    sourceType: `module`,
  },
  plugins: [
    `@typescript-eslint/eslint-plugin`,
    `eslint-plugin-import`,
    `eslint-plugin-prettier`,
    `sort-keys-fix`,
    `sort-destructure-keys`,
  ],
  root: true,
  rules: {
    "@typescript-eslint/consistent-type-definitions": [1, `type`],
    "@typescript-eslint/consistent-type-exports": 1,
    "@typescript-eslint/consistent-type-imports": 1,
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/naming-convention": [
      `error`,
      {
        format: [`strictCamelCase`, `UPPER_CASE`, `PascalCase`, `snake_case`],
        leadingUnderscore: `allow`,
        selector: `variableLike`,
      },
    ],
    "@typescript-eslint/no-unsafe-assignment": 0,
    "@typescript-eslint/no-unused-vars": [1, { argsIgnorePattern: `^_` }],
    "@typescript-eslint/switch-exhaustiveness-check": `error`,
    "import/no-cycle": ESLINT_NO_CYCLE ? 2 : 0,
    "import/order": [
      1,
      {
        "groups": [
          `builtin`,
          `external`,
          `internal`,
          `parent`,
          `sibling`,
          `index`,
        ],
        "newlines-between": `always`,
      },
    ],
    "no-useless-rename": [1],
    "object-shorthand": [1, `always`],
    "prettier/prettier": [
      1,
      { endOfLine: `auto`, quoteProps: `consistent`, trailingComma: `all` },
    ],
    "quotes": [1, `backtick`],
    "sort-destructure-keys/sort-destructure-keys": 2,
    "sort-keys-fix/sort-keys-fix": [2, `asc`, { natural: true }],
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [`.ts`, `.d.ts`],
    },
  },
};
