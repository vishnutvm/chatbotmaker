import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      // Ported marketing + dashboard copy uses natural apostrophes in JSX text
      'react/no-unescaped-entities': 'off',
      // Hydration, auth bootstrap, and shadcn primitives use intentional mount effects
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]);

export default eslintConfig;
