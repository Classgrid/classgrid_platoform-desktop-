import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import tailwindPlugin from 'eslint-plugin-tailwindcss'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist', 'node_modules', 'public', '**/*.css'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react': reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'tailwindcss': tailwindPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      tailwindcss: {
        cssFiles: [],
      },
    },
    rules: {
      // Base JS
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]', caughtErrorsIgnorePattern: '^[A-Z_]' }],

      // React / Hooks
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Tailwind
      'tailwindcss/no-custom-classname': ['error', {
        whitelist: [
          'animate-in',
          'fade-in',
          'zoom-in',
          'spin-in',
          'slide-in-from-[\\w-]+',
          'duration-\\d+',
          'w-onboarding-progress-.*',
          'text-(color|muted|primary|success|warning|danger|info|hover|error)(/\\d+)?',
          'bg-(surface\\d*|bg|hover|primary|success|warning|danger|info|border)(/\\d+)?',
          'border-(border|primary|success|warning|danger|info|l-success|l-warning|l-primary|l-border)(/\\d+)?',
          'ring-(primary|success|warning|danger|info|border)(/\\d+)?',
          'divide-(border)(/\\d+)?',
          '(hover|focus):(bg|text|border|ring)-.*',
          'shadow-soft'
        ]
      }],
      'tailwindcss/classnames-order': 'warn',

      // 100% COMPLIANCE ENFORCEMENT
      'no-restricted-syntax': [
        'error',
        {
          // BLOCK: raw HTML inputs/buttons (Force system components)
          selector: "JSXOpeningElement[name.name=/^(input|button|select)$/]",
          message: "Raw HTML elements (<input>, <button>, <select>) are forbidden. Use system components (<Input />, <Button />) for 100% design system compliance."
        },
        {
          // BLOCK: style={{ width: '100px' }} (ALLOW: CSS variables --*)
          selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression > Property[key.type='Identifier'][key.name!=/^--/]",
          message: "Inline styles are forbidden except for CSS variables (--*). Use Tailwind utility classes or system tokens instead."
        },
        {
          // BLOCK: style={{ 'width': '100px' }} (ALLOW: CSS variables '--*')
          selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression > Property[key.type='Literal'][key.value!=/^--/]",
          message: "Inline styles are forbidden except for CSS variables (--*). Use Tailwind utility classes or system tokens instead."
        },
        {
          // BLOCK: Arbitrary color/shadow bracket hacks (shadow-[...], bg-[#...])
          selector: "JSXAttribute[name.name='className'] > Literal[value=/shadow-\\[|bg-\\[#|border-\\[#/]",
          message: "Arbitrary Tailwind color/shadow values (shadow-[...], bg-[#...]) are forbidden. Use theme tokens or TONE_BG_CLASSES."
        }
      ]
    },
  },
]
