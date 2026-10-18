const {parseQuery} = require('loader-utils');

const enabled = () => process.env.DORIS_OPTIMIZE_PUBLISH === 'true';

// Configure loaders before code generation: changing URLs in already hashed
// bundles would make an old cache entry valid for different file contents.
class SharedAssetsPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('DorisSharedAssets', compilation => {
            const {NormalModule} = compiler.rspack ?? compiler.webpack;
            // Rspack 1.x does not expose loaders through afterResolve. This
            // hook runs before either bundler executes its JS loaders.
            NormalModule.getCompilationHooks(compilation).loader.tap('DorisSharedAssets', (context,module) => {
                // Webpack initializes context.loaders after this hook, while
                // Rspack has already constructed its loader-runner objects.
                for (const item of context.loaders ?? module.loaders) {
                    if (!/[\\/]node_modules[\\/](?:file-loader|url-loader)[\\/]/.test(item.path ?? item.loader)) continue;
                    const raw = item.options ?? item.query?.replace(/^\?/,'');
                    const options = typeof raw === 'string' ? parseQuery('?'+raw) : raw ?? {};
                    item.options = {...options, name: 'assets/shared/[contenthash].[ext]'};
                    if ('query' in item) item.query = '?'+JSON.stringify(item.options);
                    context.addBuildDependency(__filename);
                }
            });
        });
    }
}

module.exports = {enabled, SharedAssetsPlugin};
