(function () {
    var theme = 'doris';
    try {
        var storedTheme = localStorage.getItem('doris-brand-theme');
        var themes = ['doris', 'golden', 'blue', 'read', 'yellow-blue', 'purple', 'yellow-black', 'sky'];
        if (themes.indexOf(storedTheme) !== -1) theme = storedTheme;
    } catch (error) {}
    document.documentElement.setAttribute('data-brand-theme', theme);

    var kapaSelector = 'script[data-website-id="a5fb90df-217a-4097-95c0-80490220314b"]';
    var kapaColors = {
        doris: '#11A679',
        golden: '#7B2CBF',
        blue: '#2C2C34',
        read: '#121212',
        'yellow-blue': '#0066FF',
        purple: '#7255A5',
        'yellow-black': '#000000',
        sky: '#3778B0'
    };
    var kapaColor = kapaColors[theme];
    var observer;
    function syncKapaScript(node) {
        if (node.nodeType !== 1) return false;
        var script = node.matches && node.matches(kapaSelector)
            ? node
            : node.querySelector && node.querySelector(kapaSelector);
        if (!script) return false;
        script.setAttribute('data-project-color', kapaColor);
        if (observer) observer.disconnect();
        return true;
    }
    observer = new MutationObserver(function (mutations) {
        mutations.some(function (mutation) {
            return Array.prototype.some.call(mutation.addedNodes, syncKapaScript);
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    syncKapaScript(document.documentElement);
}());
