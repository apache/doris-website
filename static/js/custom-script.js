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

    // A label may carry data-kapa-loading-label / data-kapa-slow-label /
    // data-kapa-error-label to override the default texts (the navbar's compact
    // phone label uses these so it never grows past one row).
    function labelText(label, kind, fallback) {
        return label.getAttribute('data-kapa-' + kind + '-label') || fallback;
    }

    function syncTriggers() {
        document.querySelectorAll(TRIGGER_SELECTOR).forEach(function (trigger) {
            var waiting = pendingOpen && state === 'loading';
            trigger.setAttribute('aria-busy', waiting ? 'true' : 'false');
            trigger.setAttribute('aria-disabled', state === 'error' ? 'true' : 'false');

            // A trigger can hold several labels (e.g. a full and a compact copy
            // toggled by CSS breakpoints); keep every one of them in sync.
            trigger.querySelectorAll('[data-kapa-label]').forEach(function (label) {
                if (!label.getAttribute('data-kapa-default-label')) {
                    label.setAttribute('data-kapa-default-label', label.textContent || 'Ask Me');
                }

                var nextLabel;
                if (waiting) {
                    nextLabel = slow
                        ? labelText(label, 'slow', labelText(label, 'loading', 'Still loading…'))
                        : labelText(label, 'loading', 'Loading AI…');
                } else if (state === 'error') {
                    nextLabel = labelText(label, 'error', 'AI unavailable');
                } else {
                    nextLabel = label.getAttribute('data-kapa-default-label') || 'Ask Me';
                }
                if (label.textContent !== nextLabel) label.textContent = nextLabel;
            });
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
        '}';

    function syncProjectColor() {
        if (!window.Kapa || typeof window.Kapa.updateConfig !== 'function') return;
        var projectColor = window.getComputedStyle(document.documentElement)
            .getPropertyValue('--brand-primary').trim();
        if (!projectColor) return;
        // Let Kapa recalculate its palette and contrasting text when the brand
        // changes. Recoloring matching DOM colors also catches neutral black
        // text/icons, and overriding every --ai-bg fills the attachment button.
        window.Kapa.updateConfig({ 'data-project-color': projectColor });
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
        syncProjectColor();
        return true;
    }

    window.addEventListener('brand-theme-change', inject);
    if (inject()) return;
    var observer = new MutationObserver(function () {
        if (inject()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
