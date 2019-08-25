module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: [
        "@typescript-eslint",
        "jest",
        "react",
        "prettier",
        "import"
    ],
    extends: [
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        "plugin:jest/recommended",
    ],
    env: {
        node: false,
        browser: true,
        jest: true,
    },
    parserOptions: {
        project: './tsconfig.eslint.json',
        ecmaVersion: 2019,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        "import/prefer-default-export": "off",
        "import/no-default-export": "error",
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};
