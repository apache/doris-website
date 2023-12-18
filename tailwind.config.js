module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            screens: {
                xl: '1280px',
                '2xl': '1280px',
            },
        },
        colors: {
            primary: '#444FD9',
            white: '#FFFFFF'
        },
    },
    darkMode: ['class', '[data-theme="dark"]'],
    plugins: [],
};
