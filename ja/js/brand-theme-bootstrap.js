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
    // Only documented attributes already used by this site's widget are changed.
    // The third-party consent/legal text remains in its original English.
    var aiLabels = {
        'zh-CN': ['Apache Doris AI 助手', 'AI 回答的语言取决于外部服务与提问内容。'],
        ja: ['Apache Doris AI アシスタント', 'AI の回答言語は外部サービスと質問内容によって異なります。'],
        ko: ['Apache Doris AI 도우미', 'AI 답변 언어는 외부 서비스와 질문 내용에 따라 달라집니다.'],
        ru: ['ИИ-помощник Apache Doris', 'Язык ответов ИИ зависит от внешнего сервиса и вашего вопроса.']
    };
    var aiLocale = location.pathname.split('/')[1];
    var aiLabel = aiLabels[aiLocale];
    var observer;
    function syncKapaScript(node) {
        if (node.nodeType !== 1) return false;
        var script = node.matches && node.matches(kapaSelector)
            ? node
            : node.querySelector && node.querySelector(kapaSelector);
        if (!script) return false;
        script.setAttribute('data-project-color', kapaColor);
        if (aiLabel) {
            script.setAttribute('data-modal-title', aiLabel[0]);
            script.setAttribute('data-modal-disclaimer', aiLabel[1] + ' [Apache Doris Docs](https://doris.apache.org/' + aiLocale + '/docs/4.x/getting-started/what-is-apache-doris/).');
        }
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
