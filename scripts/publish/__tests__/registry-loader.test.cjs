const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const rspack = require('@rspack/core');
const {normalizeRegistry} = require('../registry-loader.cjs');
const createPlugin = require('../../../config/custom-docusaurus-plugin.js');

const ids = ['2d9cc600', '929b5da3', '02294930', '232e3', '0abc1234', 'abcd1234'];
function source() {
    return 'export default {\n' + ids.map(id => `  "${id}": [() => import(/* webpackChunkName: "${id}" */ "../view.js"), "../view.js", require.resolveWeak("../view.js")],`).join('\n') + '};\n';
}

test('chunk IDs remain string values with unchanged lazy imports, comments and weak IDs', () => {
    const output = normalizeRegistry(source());
    assert.match(output, /^export default Object\.fromEntries\(/);
    for (const id of ids) {
        assert(output.includes(`["${id}", [`));
        assert(output.includes(`webpackChunkName: "${id}"`));
        assert(!output.includes(`"${id}":`));
    }
    assert.throws(() => new vm.Script('module.exports = {2d9cc600: [1]};'), SyntaxError,
        'The emitted form from the failing production run is invalid JavaScript');
    const registry = {};
    new vm.Script(output.replace('export default', 'module.exports =')).runInNewContext({
        module:registry,require:{resolveWeak:()=>123},
    });
    assert.deepEqual(Object.keys(registry.exports), ids);
    assert(ids.every(id => registry.exports[id][1] === '../view.js' && registry.exports[id][2] === 123));
});

test('empty registries work and unexpected producer formats fail with an upgrade diagnostic', () => {
    assert.match(normalizeRegistry('export default {\n};\n'), /Object\.fromEntries/);
    for (const input of ['export default [];', 'export default {\n bad: [],\n};',
        'export default {\n "one": function () {},\n};', 'export default {\n "one": [],\n "one": [],\n};'])
        assert.throws(() => normalizeRegistry(input), /registry format|Duplicate Docusaurus chunk ID/);
});

for (const isServer of [true, false]) test(`production ${isServer ? 'SSR' : 'client'} bundling preserves every opaque registry key`, async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-ssr-registry-'));
    t.after(() => fs.rmSync(root, {recursive:true,force:true}));
    const generated = path.join(root, '.docusaurus');
    fs.mkdirSync(generated);
    fs.writeFileSync(path.join(generated, 'registry.js'), source());
    fs.writeFileSync(path.join(root, 'view.js'), 'export default "NATIVE_VIEW";\n');
    fs.writeFileSync(path.join(root, 'entry.js'), 'export {default as registry} from "@generated/registry";\n');
    const base = {mode:'production',context:root,target:isServer?'node20':'web',entry:'./entry.js',
        resolve:{alias:{'@generated':generated}},
        module:{rules:[{test:/\.js$/,use:{loader:'builtin:swc-loader',
            options:{...require('@docusaurus/faster').getSwcLoaderOptions({isServer}),env:{targets:isServer?['node 20']:['Chrome 110']}}}}]},
        output:{path:path.join(root,'out'),filename:'bundle.js',library:{type:'commonjs2'},publicPath:'/'},
        optimization:{minimize:!isServer,minimizer:[new rspack.SwcJsMinimizerRspackPlugin()]}};
    const plugin = createPlugin({siteDir:root,generatedFilesDir:generated,siteConfig:{baseUrl:'/'}});
    const changes = plugin.configureWebpack(base,isServer);
    assert.equal(changes.module.rules.length,1);
    assert(changes.module.rules[0].test(path.join(generated,'registry.js')));
    assert(!changes.module.rules[0].test(path.join(root,'registry.js')));
    assert.equal(plugin.configureWebpack({...base,mode:'development'},isServer).module,undefined);
    const compiler = rspack({...base,module:{rules:[...base.module.rules,...changes.module.rules]},
        optimization:changes.optimization??base.optimization});
    const stats = await new Promise((resolve,reject)=>compiler.run((error,result)=>error?reject(error):resolve(result)));
    await new Promise((resolve,reject)=>compiler.close(error=>error?reject(error):resolve()));
    assert(!stats.hasErrors(),stats.toString({all:false,errors:true}));
    const file = path.join(root,'out/bundle.js');
    const code = fs.readFileSync(file,'utf8');
    new vm.Script(code);
    const module = {exports:{}};
    if (isServer) module.exports = require(file);
    else new vm.Script(code).runInNewContext({module,exports:module.exports,self:{}});
    assert.deepEqual(Object.keys(module.exports.registry),ids);
    if (isServer) for (const id of ids) assert.equal((await module.exports.registry[id][0]()).default,'NATIVE_VIEW');
});
