/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14B8A6',
                    600: '#0d9488',
                    700: '#0F766E',
                    800: '#115e59',
                    900: '#134e4a',
                },
                light: {
                    900: '#ffffff',
                    800: '#f5f5f7',
                    700: '#f2f2f7',
                    600: '#e5e5ea',
                    500: '#d2d2d7',
                    400: '#94a3b8',
                    300: '#64748b',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    raised: '#ffffff',
                    overlay: '#f2f2f7',
                },
                cyber: {
                    blue: '#0284c7',
                    purple: '#14B8A6',
                    pink: '#f472b6',
                    green: '#059669',
                    orange: '#d97706',
                    red: '#dc2626',
                },
            },
            fontFamily: {
                sans: ['System'],
            },
        },
    },
    plugins: [],
};
