import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
export default [
    { ignores: ['dist'] },
    eslintConfigPrettier,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        settings: {
            react: { version: '18.3' },
            'import/resolver': {
                alias: {
                    map: [
                        ['@app', './src/app'],
                        ['@assets', './src/assets'],
                        ['@pages', './src/pages'],
                        ['@widgets', './src/widgets'],
                        ['@features', './src/features'],
                        ['@entities', './src/entities'],
                        ['@shared', './src/shared'],
                    ],
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                },
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            'react/jsx-no-target-blank': 'off',
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        },
    },
];
