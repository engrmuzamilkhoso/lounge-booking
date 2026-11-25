import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'src/generated/**', 'prisma.config.ts', 'eslint.config.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // NestJS modules are classes decorated with @Module and intentionally have no members.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Allows `const { removed, ...rest } = value` to drop a property.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      // NestJS declares many option types as classes but expects plain object literals.
      '@typescript-eslint/no-unsafe-class-instance-assignment': 'off',
    },
  },
);
