(function () {
    function isBrandTheme(theme) {
        return [
            'doris',
            'golden',
            'blue',
            'read',
            'yellow-blue',
            'purple',
            'yellow-black',
            'sky',
        ].indexOf(theme) !== -1;
    }

    function readParentTokens() {
        if (window.parent === window) return {};
        try {
            var parentStyle = window.parent.getComputedStyle(window.parent.document.documentElement);
            return [
                '--brand-primary',
                '--brand-primary-dark',
                '--brand-primary-darker',
                '--brand-primary-tint',
                '--brand-primary-glow',
                '--brand-primary-glow-rgb',
                '--brand-primary-soft',
                '--brand-primary-muted',
                '--brand-accent',
                '--brand-accent-rgb',
                '--brand-accent-bright',
                '--brand-cream',
                '--brand-cream-light',
                '--brand-surface-callout',
                '--brand-ink',
                '--brand-ink-rgb',
            ].reduce(function (tokens, token) {
                tokens[token] = parentStyle.getPropertyValue(token).trim();
                return tokens;
            }, {});
        } catch (error) {
            return {};
        }
    }

    function apply(theme, tokens) {
        if (isBrandTheme(theme)) {
            document.documentElement.dataset.brandTheme = theme;
        }
        Object.keys(tokens || {}).forEach(function (token) {
            document.documentElement.style.setProperty(token, tokens[token]);
        });
    }

    var initialTheme = 'doris';
    try {
        initialTheme = localStorage.getItem('doris-brand-theme') || initialTheme;
    } catch (error) {
        // Storage can be unavailable in hardened/private browsing.
    }
    apply(initialTheme, readParentTokens());

    window.addEventListener('message', function (event) {
        if (event.origin !== window.location.origin) return;
        if (event.data && event.data.type === 'brand-theme-change') {
            apply(event.data.theme, event.data.tokens);
        }
    });
})();
