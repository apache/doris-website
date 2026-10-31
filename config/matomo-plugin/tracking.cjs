function trackRouteUpdate(browser, {location,previousLocation}) {
    // The HTML bootstrap already counts a full page load. Only committed SPA
    // page/query changes count again; document anchors are not new pages.
    if (!browser.__dorisMatomoEnabled || !previousLocation || !browser._paq
        || (location.pathname === previousLocation.pathname && location.search === previousLocation.search)) return;
    const url = location.pathname+(location.search || '');
    // Helmet defers head updates to an animation frame. Read the title after
    // that frame's callbacks, rather than the previous page's title.
    browser.requestAnimationFrame(() => {
        browser.setTimeout(() => {
            browser._paq.push(['setCustomUrl',url]);
            browser._paq.push(['setDocumentTitle',browser.document.title]);
            browser._paq.push(['trackPageView']);
        });
    });
}

module.exports = {trackRouteUpdate};
