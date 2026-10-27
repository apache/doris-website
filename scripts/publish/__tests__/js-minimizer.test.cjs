const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const rspack = require('@rspack/core');
const TerserPlugin = require('terser-webpack-plugin');
const plugin = require('../../../config/custom-docusaurus-plugin')({siteConfig: {baseUrl: '/ko/'}});
const {scripts, BootstrapAssetsPlugin} = require('../bootstrap.cjs');

test('production minimization leaves addressed bootstrap bytes and their hashes unchanged', async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-bootstrap-hash-'));
    t.after(() => fs.rmSync(root, {recursive:true,force:true}));
    const repo = path.resolve(__dirname, '../../..');
    for (const file of ['static/js/brand-theme-bootstrap.js','static/js/course-rail-bootstrap.js',
        'static/js/locale-entry-bootstrap.js','config/locale-entry.json','config/i18n.js']) {
        fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
        fs.copyFileSync(path.join(repo,file),path.join(root,file));
    }
    fs.writeFileSync(path.join(root,'entry.js'),'window.fixture = true;');
    const options = {locales:['en','zh-CN','ja','ko','ru']};
    const compiler = rspack({mode:'production',context:root,entry:'./entry.js',
        output:{path:path.join(root,'out'),filename:'main.js'},
        optimization:{minimize:true,minimizer:[new TerserPlugin({parallel:false})]},
        plugins:[new BootstrapAssetsPlugin(root,options)]});
    const stats = await new Promise((resolve,reject)=>compiler.run((error,result)=>error?reject(error):resolve(result)));
    await new Promise((resolve,reject)=>compiler.close(error=>error?reject(error):resolve()));
    assert(!stats.hasErrors(),stats.toString({all:false,errors:true}));
    for (const script of scripts(root,options)) {
        const bytes = fs.readFileSync(path.join(root,'out',script.file),'utf8');
        assert.equal(bytes,script.content);
        assert(script.file.includes(createHash('sha256').update(bytes).digest('hex').slice(0,16)));
        new vm.Script(bytes);
    }
});

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

test('UTF-8 client strings remain exact without expanding translated prose to ASCII escapes', async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-utf8-minifier-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const values = {zh: '查询数据库', ja: 'データベースを検索', ko: '데이터베이스 검색',
        ru: 'Поиск данных: ёж', special: '\u2028\u2029😀'};
    fs.writeFileSync(path.join(root, 'entry.js'), `window.prose=${JSON.stringify(values)};`);
    const config = {mode:'production',optimization:{minimizer:[new rspack.SwcJsMinimizerRspackPlugin()]}};
    const optimization = plugin.configureWebpack(config, false).optimization;
    const compiler = rspack({...config,context:root,entry:'./entry.js',
        output:{path:path.join(root,'out'),filename:'main.js'},optimization});
    const stats = await new Promise((resolve,reject)=>compiler.run((error,result)=>error?reject(error):resolve(result)));
    await new Promise((resolve,reject)=>compiler.close(error=>error?reject(error):resolve()));
    assert(!stats.hasErrors(),stats.toString({all:false,errors:true}));
    const code = fs.readFileSync(path.join(root,'out/main.js'),'utf8');
    const context = {window:{}};
    new vm.Script(code).runInNewContext(context);
    assert.equal(JSON.stringify(context.window.prose),JSON.stringify(values));
    assert(code.includes(values.zh) && code.includes(values.ko));
    const ascii = await require('terser').minify(code, {compress:false,mangle:false,
        format:{ecma:5,comments:false,ascii_only:true}});
    assert(Buffer.byteLength(code) < Buffer.byteLength(ascii.code));
});
