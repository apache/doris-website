const { getAssetOrigin } = require('./asset-origin');

module.exports = function (context, options) {
    return {
        name: 'custom-docusaurus-plugin',
        configureWebpack(config, isServer, utils) {
            // The resolved base URL also handles single-locale previews, where
            // Docusaurus deliberately omits the locale prefix.
            const localePublicPath = context.siteConfig.baseUrl;
            // An empty origin serves this build's assets locally. Unset keeps
            // the production CDN. Worker bootstrap always stays same-origin.
            const assetOrigin = getAssetOrigin();

            return {
                output: {
                    ...config.output,
                    publicPath: `${assetOrigin}${localePublicPath}`,
                    // Keep general assets on CDN, but force worker chunks to same-origin
                    // to satisfy browser worker same-origin policy for Search worker bootstrap.
                    workerPublicPath: localePublicPath,
                },
            };
        },
    };
};
