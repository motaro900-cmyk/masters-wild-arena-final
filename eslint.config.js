import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    { ignores: ['dist', 'node_modules', 'scripts'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            prettier: prettier,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'prettier/prettier': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn'],
            'no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: ['**/src/assets/**', '**/src/assets'],
                            message: 'Importing from src/assets is deprecated. Use assets-src or public/assets.'
                        },
                        {
                            group: ['**/src/components/**', '**/src/components'],
                            message: 'Importing from src/components is deprecated. Real React components should be in src/ui/components.'
                        },
                        {
                            group: ['**/api/**', '**/api', '**/server/**', '**/server'],
                            message: 'Backend code in api/ or server/ must not be imported in client-side code.'
                        }
                    ]
                }
            ],
        },
    },
    eslintConfigPrettier,
);
