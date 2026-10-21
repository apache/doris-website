const { getAssetOrigin } = require('./asset-origin');
const {enabled, SharedAssetsPlugin} = require('../scripts/publish/shared-assets.cjs');
const {BootstrapAssetsPlugin} = require('../scripts/publish/bootstrap.cjs');

module.exports = function (context, options) {
    return {
        name: 'custom-docusaurus-plugin',
        configureWebpack(config, isServer, utils) {
            // The resolved base URL also handles single-locale previews, where
            // Docusaurus deliberately omits the locale prefix.
            const localePublicPath = enabled() ? '/' : context.siteConfig.baseUrl;
            // An empty origin serves this build's assets locally. Unset keeps
            // the production CDN. Worker bootstrap always stays same-origin.
            const assetOrigin = getAssetOrigin();

            return {
                plugins: enabled() ? [new SharedAssetsPlugin(),
                    ...(!isServer ? [new BootstrapAssetsPlugin(context.siteDir)] : [])] : [],
                ...(enabled() && config.cache ? {cache:{...config.cache,name:`${config.cache.name}-publish-v1`}} : {}),
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
