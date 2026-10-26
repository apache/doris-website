const { getAssetOrigin } = require('./asset-origin');
const {enabled, SharedAssetsPlugin} = require('../scripts/publish/shared-assets.cjs');
const {BootstrapAssetsPlugin} = require('../scripts/publish/bootstrap.cjs');
const TerserPlugin = require('terser-webpack-plugin');

function clientMinimizers(config) {
    return config.optimization.minimizer.map(minimizer => {
        if (minimizer.name !== 'SwcJsMinimizerRspackPlugin') return minimizer;
        // The production Korean entry/runtime contained an unquoted route
        // hash (929b5da3), preventing hydration. Avoid the pinned Rspack/SWC
        // JS minimizer; keep Rspack and CSS on their existing build paths.
        return new TerserPlugin({
            extractComments: false,
            parallel: process.env.TERSER_PARALLEL === 'false' ? false
                : parseInt(process.env.TERSER_PARALLEL, 10) > 0
                    ? parseInt(process.env.TERSER_PARALLEL, 10) : true,
            terserOptions: {
                parse: {ecma: 2020},
                compress: {ecma: 5},
                mangle: {safari10: true},
                format: {ecma: 5, comments: false, ascii_only: true},
            },
        });
    });
}

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
                ...(!isServer && config.mode === 'production' ? {
                    mergeStrategy: {'optimization.minimizer': 'replace'},
                    optimization: {minimizer: clientMinimizers(config)},
                } : {}),
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
