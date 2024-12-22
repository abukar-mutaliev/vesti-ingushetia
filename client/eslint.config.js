import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

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
            'unused-imports': unusedImports,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            'react/display-name': 'off',
            'jsx-a11y/label-has-associated-control': 'off',
            'no-console': 'off',
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        "CallExpression[callee.object.name='console']" +
                        "[callee.property.name!=/^(log|warn|error|info|trace)$/]",
                    message: 'Unexpected property on console object was called',
                },
            ],
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                "warn",
                { "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_"
                }
                ],
            'import/no-unresolved': 'off',
            'import/prefer-default-export': 'off',
            'no-unused-vars': 'off',
            'react/require-default-props': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/jsx-props-no-spreading': 'warn',
            'react/function-component-definition': 'off',
            'no-shadow': 'off',
            'import/extensions': 'off',
            'import/no-extraneous-dependencies': 'off',
            'no-underscore-dangle': 'off',
            'max-len': [
                'error',
                {
                    ignoreComments: true,
                    code: 125,
                },
            ],
            'jsx-a11y/no-static-element-interactions': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',
            'no-param-reassign': 'off',
            'no-undef': 'off',
            camelcase: 'off',
            'react/no-array-index-key': 'off',
            'arrow-body-style': 'off',
            'react/prop-types': 'off',
            'react/jsx-max-props-per-line': ['error', { maximum: 4 }],
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        },
    },
];
