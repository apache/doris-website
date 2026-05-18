(function (c, l, a, r, i, t, y) {
    c[a] =
        c[a] ||
        function () {
            (c[a].q = c[a].q || []).push(arguments);
        };
    t = l.createElement(r);
    t.async = 1;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
})(window, document, 'clarity', 'script', 'kfyqejiz0g');

// Center the Kapa Ask Me modal vertically. Kapa renders inside a Shadow DOM
// on `#kapa-widget-container`, so light-DOM CSS can't reach it. We inject a
// <style> into the shadow root and re-inject if Kapa rebuilds it.
(function centerKapaModal() {
    var STYLE_ID = 'doris-kapa-center-modal';
    var CSS_TEXT =
        '.mantine-Modal-inner{' +
        'align-items:center !important;' +
        'padding-top:0 !important;' +
        'padding-bottom:0 !important;' +
        '--modal-y-offset:0 !important;' +
        '}';

    function inject() {
        var host = document.getElementById('kapa-widget-container');
        if (!host || !host.shadowRoot) return false;
        if (host.shadowRoot.getElementById(STYLE_ID)) return true;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS_TEXT;
        host.shadowRoot.appendChild(style);
        return true;
    }

    if (inject()) return;
    var observer = new MutationObserver(function () {
        inject();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
