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

// Kapa's script is loaded asynchronously and can take a long time on a cold
// cache. Keep Ask Me clicks made before the widget is ready, expose visible
// loading/error feedback, and replay the latest intent once Kapa has mounted.
// This listener runs before React hydrates, so clicks made immediately after
// the server-rendered buttons appear are covered as well.
(function manageKapaTrigger() {
    var KAPA_SCRIPT_SELECTOR = 'script[src="https://widget.kapa.ai/kapa-widget.bundle.js"]';
    var TRIGGER_SELECTOR = '[data-kapa-trigger]';
    var NAVBAR_TRIGGER_ID = 'navbar-ask-ai-btn';
    var state = 'loading';
    var pendingOpen = false;
    var slow = false;
    var replaying = false;
    var slowTimer;
    var pollTimer;

    function getReadyHost() {
        var host = document.getElementById('kapa-widget-container');
        return host && host.shadowRoot ? host : null;
    }

    function syncTriggers() {
        document.querySelectorAll(TRIGGER_SELECTOR).forEach(function (trigger) {
            var label = trigger.querySelector('[data-kapa-label]');
            if (label && !label.getAttribute('data-kapa-default-label')) {
                label.setAttribute('data-kapa-default-label', label.textContent || 'Ask Me');
            }

            var waiting = pendingOpen && state === 'loading';
            trigger.setAttribute('aria-busy', waiting ? 'true' : 'false');
            trigger.setAttribute('aria-disabled', state === 'error' ? 'true' : 'false');

            if (!label) return;
            var nextLabel;
            if (waiting) {
                nextLabel = slow ? 'Still loading…' : 'Loading AI…';
            } else if (state === 'error') {
                nextLabel = 'AI unavailable';
            } else {
                nextLabel = label.getAttribute('data-kapa-default-label') || 'Ask Me';
            }
            if (label.textContent !== nextLabel) label.textContent = nextLabel;
        });
    }

    function replayOpen() {
        if (!pendingOpen || state !== 'ready') return;
        var navbarTrigger = document.getElementById(NAVBAR_TRIGGER_ID);
        if (!navbarTrigger) return;

        pendingOpen = false;
        slow = false;
        window.clearTimeout(slowTimer);
        syncTriggers();

        replaying = true;
        navbarTrigger.click();
        replaying = false;
    }

    function markReady() {
        if (state === 'ready') return;
        state = 'ready';
        window.clearInterval(pollTimer);
        syncTriggers();
        window.setTimeout(replayOpen, 0);
    }

    function markError() {
        if (state === 'ready') return;
        state = 'error';
        pendingOpen = false;
        slow = false;
        window.clearTimeout(slowTimer);
        window.clearInterval(pollTimer);
        syncTriggers();
    }

    function checkReady() {
        if (getReadyHost()) {
            markReady();
            return true;
        }
        return false;
    }

    function attachScriptListeners(script) {
        if (!script || script.__dorisKapaListenersAttached) return;
        script.__dorisKapaListenersAttached = true;
        script.addEventListener('load', checkReady);
        script.addEventListener('error', markError);
    }

    function requestOpen() {
        if (state === 'error') {
            syncTriggers();
            return;
        }
        pendingOpen = true;
        slow = false;
        window.clearTimeout(slowTimer);
        slowTimer = window.setTimeout(function () {
            if (!pendingOpen || state !== 'loading') return;
            slow = true;
            syncTriggers();
        }, 8000);
        syncTriggers();
        if (checkReady()) replayOpen();
    }

    document.addEventListener(
        'click',
        function (event) {
            if (replaying) return;
            var target = event.target;
            var trigger = target && target.closest ? target.closest(TRIGGER_SELECTOR) : null;
            if (!trigger) return;

            // Once ready, Kapa's own listener handles the navbar button. The
            // hero button still needs to proxy its click to that bound button.
            if (state === 'ready' && trigger.id === NAVBAR_TRIGGER_ID) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            requestOpen();
        },
        true,
    );

    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            Array.prototype.forEach.call(mutation.addedNodes, function (node) {
                if (node.nodeType !== 1) return;
                if (node.matches && node.matches(KAPA_SCRIPT_SELECTOR)) {
                    attachScriptListeners(node);
                } else if (node.querySelector) {
                    attachScriptListeners(node.querySelector(KAPA_SCRIPT_SELECTOR));
                }
            });
        });
        syncTriggers();
        checkReady();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    attachScriptListeners(document.querySelector(KAPA_SCRIPT_SELECTOR));
    pollTimer = window.setInterval(checkReady, 250);
    syncTriggers();
})();

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
