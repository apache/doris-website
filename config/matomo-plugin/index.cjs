const matomo = require('docusaurus-plugin-matomo');

// Keep the upstream tracker setup, but own Docusaurus lifecycle handling.
module.exports = function (context) {
    const plugin = matomo(context);
    const origin = new URL(context.siteConfig.url).origin;
    return {
        ...plugin,
        getClientModules() {
            return plugin.getClientModules().length ? [require.resolve('./track.js')] : [];
        },
        injectHtmlTags() {
            const tags = plugin.injectHtmlTags();
            return {...tags,headTags:tags.headTags?.map(tag => tag.tagName !== 'script' ? tag : {
                ...tag,
                innerHTML:`(function () {
                    if (window.location.origin !== ${JSON.stringify(origin)} || window.navigator.webdriver) return;
                    window.__dorisMatomoEnabled = true;
                    ${tag.innerHTML}
                })();`,
            })};
        },
    };
};
