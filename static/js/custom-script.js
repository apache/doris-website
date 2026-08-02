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

// Position the Kapa Ask Me modal below the sticky NavbarNext.
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
    var BRAND_COLORS = [
        'rgb(17, 166, 121)',
        'rgb(123, 44, 191)',
        'rgb(44, 44, 52)',
        'rgb(18, 18, 18)',
        'rgb(0, 102, 255)',
        'rgb(114, 85, 165)',
        'rgb(0, 0, 0)',
        'rgb(55, 120, 176)',
    ];
    // Top padding clears the sticky NavbarNext + 16px gap so the modal header
    // is never tucked under the navbar when content fills the screen.
    var CSS_TEXT =
        '.mantine-Modal-inner{' +
        'align-items:flex-start !important;' +
        'padding-top:80px !important;' +
        'padding-bottom:2rem !important;' +
        '--modal-y-offset:0 !important;' +
        '}' +
        // Do NOT add `display:flex !important` here — Kapa already sets
        // `display:flex; flex-direction:column` inline via Mantine's `sx`
        // prop, and overriding with `!important` would also override the
        // `display:none` Mantine's transition writes inline when the modal
        // is keep-mounted and closed (which happens after the first
        // question). That kept the modal visible after onClose fired,
        // making X / Esc / overlay-click all silently fail on the second
        // attempt.
        '.mantine-Modal-content{' +
        'max-height:calc(100vh - 80px - 2rem) !important;' +
        '}' +
        '.mantine-Modal-body{' +
        'flex:1 1 auto !important;' +
        'min-height:0 !important;' +
        'overflow-y:auto !important;' +
        '}' +
        '@media(max-width:768px){' +
        '.mantine-Modal-inner{padding-top:176px !important;}' +
        '.mantine-Modal-content{max-height:calc(100vh - 176px - 2rem) !important;}' +
        '}' +
        // Mantine writes Kapa's configured project color into component-level
        // custom properties. Point those back to the site tokens so an
        // already-mounted widget also follows runtime theme changes.
        '[style*="--ai-bg"]{' +
        '--ai-bg:var(--brand-primary) !important;' +
        '--ai-hover:var(--brand-primary-deep) !important;' +
        '}';

    function syncBrandColors(shadowRoot) {
        shadowRoot.querySelectorAll('*').forEach(function (element) {
            var style = window.getComputedStyle(element);
            if (
                BRAND_COLORS.indexOf(style.color) !== -1 &&
                element.style.getPropertyValue('color') !== 'var(--brand-primary)'
            ) {
                element.style.setProperty('color', 'var(--brand-primary)', 'important');
            }
            if (
                BRAND_COLORS.indexOf(style.backgroundColor) !== -1 &&
                element.style.getPropertyValue('background-color') !== 'var(--brand-primary)'
            ) {
                element.style.setProperty('background-color', 'var(--brand-primary)', 'important');
            }
            if (
                BRAND_COLORS.indexOf(style.borderColor) !== -1 &&
                element.style.getPropertyValue('border-color') !== 'var(--brand-primary)'
            ) {
                element.style.setProperty('border-color', 'var(--brand-primary)', 'important');
            }
        });
    }

    function inject() {
        var host = document.getElementById('kapa-widget-container');
        if (!host || !host.shadowRoot) return false;
        if (!host.shadowRoot.getElementById(STYLE_ID)) {
            var style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = CSS_TEXT;
            host.shadowRoot.appendChild(style);
        }
        if (!host.__dorisBrandObserver) {
            host.__dorisBrandObserver = new MutationObserver(function () {
                syncBrandColors(host.shadowRoot);
            });
            host.__dorisBrandObserver.observe(host.shadowRoot, { childList: true, subtree: true });
        }
        syncBrandColors(host.shadowRoot);
        return true;
    }

    window.addEventListener('brand-theme-change', inject);
    if (inject()) return;
    var observer = new MutationObserver(function () {
        if (inject()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
