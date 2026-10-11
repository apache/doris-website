module.exports = function (context, options) {
    return {
        name: 'custom-docusaurus-plugin',
        configureWebpack(config, isServer, utils) {
            // The resolved base URL also handles single-locale previews, where
            // Docusaurus deliberately omits the locale prefix.
            const localePublicPath = context.siteConfig.baseUrl;
            // An empty origin serves this build's assets locally. Unset keeps
            // the production CDN. Worker bootstrap always stays same-origin.
            const assetOrigin = process.env.DORIS_ASSET_ORIGIN ?? 'https://cdnd.selectdb.com';

            return {
                output: {
                    ...config.output,
                    publicPath: `${assetOrigin.replace(/\/$/, '')}${localePublicPath}`,
                    // Keep general assets on CDN, but force worker chunks to same-origin
                    // to satisfy browser worker same-origin policy for Search worker bootstrap.
                    workerPublicPath: localePublicPath,
                },
            };
        },
    };
};
