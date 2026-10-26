const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const rspack = require('@rspack/core');
const TerserPlugin = require('terser-webpack-plugin');
const plugin = require('../../../config/custom-docusaurus-plugin')({siteConfig: {baseUrl: '/ko/'}});

test('production clients replace only the SWC JavaScript minimizer', () => {
    const css = new rspack.LightningCssMinimizerRspackPlugin();
    const config = {mode: 'production', optimization: {minimizer: [new rspack.SwcJsMinimizerRspackPlugin(), css]}};
    const result = plugin.configureWebpack(config, false);
    assert(result.optimization.minimizer[0] instanceof TerserPlugin);
    assert.equal(result.optimization.minimizer[1], css);
    assert.equal(result.mergeStrategy['optimization.minimizer'], 'replace');
    assert.equal(plugin.configureWebpack(config, true).optimization, undefined);
    assert.equal(plugin.configureWebpack({...config, mode: 'development'}, false).optimization, undefined);
    const standard = {mode: 'production', optimization: {minimizer: [new TerserPlugin(), css]}};
    assert.deepEqual(plugin.configureWebpack(standard, false).optimization, standard.optimization);
});

test('the production bundler preserves numeric-looking route hashes as string keys', async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-route-minifier-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const hashes = ['929b5da3', '02294930', '232e3', '0abc1234', 'abcd1234'];
    const registry = Object.fromEntries(hashes.map((hash, index) => [hash, index]));
    fs.writeFileSync(path.join(root, 'entry.js'), `window.registry=${JSON.stringify(registry)};`);
    const config = {mode: 'production', optimization: {minimizer: [new rspack.SwcJsMinimizerRspackPlugin()]}};
    const {optimization} = plugin.configureWebpack(config, false);
    const compiler = rspack({...config, context: root, entry: './entry.js',
        output: {path: path.join(root, 'out'), filename: 'main.js'}, optimization});
    const stats = await new Promise((resolve, reject) => compiler.run((error, result) => error ? reject(error) : resolve(result)));
    await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()));
    assert(!stats.hasErrors(), stats.toString({all: false, errors: true}));
    const code = fs.readFileSync(path.join(root, 'out/main.js'), 'utf8');
    const context = {window: {}};
    new vm.Script(code).runInNewContext(context);
    assert.equal(JSON.stringify(context.window.registry), JSON.stringify(registry));
});
