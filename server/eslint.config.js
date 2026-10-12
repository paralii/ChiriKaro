import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
{
ignores: [
"node_modules/**",
"dist/**",
"coverage/**",
"eslint.config.js",
],
},

js.configs.recommended,

{
files: ["**/*.ts", "**/*.tsx"],

languageOptions: {
  parser: tsParser,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  globals: {
    ...globals.node,
    ...globals.es2022,
  },
},

plugins: {
  "@typescript-eslint": tsPlugin,
},

rules: {
  ...tsPlugin.configs.recommended.rules,

  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],

  "no-undef": "off",
  "no-console": "warn",
},

},
];
