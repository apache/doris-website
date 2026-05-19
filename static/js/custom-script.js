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

// Position the Kapa Ask Me modal below the sticky NavbarNext (64px tall).
// Kapa renders inside a Shadow DOM on `#kapa-widget-container`, so light-DOM
// CSS can't reach it. We inject a <style> into the shadow root and re-inject
// if Kapa rebuilds it.
//
// The modal must (a) size to its content when small, (b) cap at viewport
// minus the navbar plus margin when content is tall, and (c) scroll inside
// the body — not inside `.mantine-Modal-inner`, which clips the top under
// `align-items: center` once content exceeds the viewport.
(function centerKapaModal() {
    var STYLE_ID = 'doris-kapa-center-modal';
    // Top padding clears the 64px sticky NavbarNext + 16px gap so the modal
    // header is never tucked under the navbar when content fills the screen.
    var CSS_TEXT =
        '.mantine-Modal-inner{' +
        'align-items:flex-start !important;' +
        'padding-top:80px !important;' +
        'padding-bottom:2rem !important;' +
        '--modal-y-offset:0 !important;' +
        '}' +
        '.mantine-Modal-content{' +
        'max-height:calc(100vh - 80px - 2rem) !important;' +
        'display:flex !important;' +
        'flex-direction:column !important;' +
        '}' +
        '.mantine-Modal-body{' +
        'flex:1 1 auto !important;' +
        'min-height:0 !important;' +
        'overflow-y:auto !important;' +
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
