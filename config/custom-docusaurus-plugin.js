const { getAssetOrigin } = require('./asset-origin');
const {enabled, SharedAssetsPlugin} = require('../scripts/publish/shared-assets.cjs');
const {BootstrapAssetsPlugin} = require('../scripts/publish/bootstrap.cjs');
const {entryOptions} = require('../scripts/i18n/locale-entry.cjs');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('node:path');

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
                // The site and assets are UTF-8. Keeping translated strings
                // avoids expanding each CJK character into six ASCII bytes.
                format: {ecma: 5, comments: false, ascii_only: false},
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
            const generated = config.resolve?.alias?.['@generated'] ?? context.generatedFilesDir;
            const registry = typeof generated === 'string' ? path.join(generated, 'registry.js') : null;
            const rules = [];
            if (config.mode === 'production' && registry) rules.push({
                enforce: 'pre',
                test: file => path.resolve(file) === registry,
                use: [{loader: require.resolve('../scripts/publish/registry-loader.cjs')}],
            });
            if (!isServer && config.mode === 'production') {
                const worker = require.resolve('@yang1666204/docusaurus-search-local/dist/client/client/theme/worker.js');
                rules.push({enforce: 'pre', test: file => path.resolve(file) === worker,
                    use: [{loader: require.resolve('../scripts/i18n/search-worker-loader.cjs'),
                        options: {assetOrigin, siteOrigin: context.siteConfig.url ?? ''}}]});
            }

            return {
                ...(rules.length ? {module: {rules}} : {}),
                ...(!isServer && config.mode === 'production' ? {
                    mergeStrategy: {'optimization.minimizer': 'replace'},
                    optimization: {minimizer: clientMinimizers(config)},
                } : {}),
                plugins: enabled() ? [new SharedAssetsPlugin(),
                    ...(!isServer ? [new BootstrapAssetsPlugin(context.siteDir,entryOptions(context))] : [])] : [],
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
