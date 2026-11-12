// Read native blog metadata without compiling the website or calling a model.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {sourceSha} = require('./content-manifest.cjs');
async function collect(root) {
    assert.equal(require('@docusaurus/core/package.json').version, '3.6.3', 'Revalidate native blog APIs after upgrading');
    process.env.DORIS_ENABLE_LOCALES = 'ja,ko,ru';
    process.env.NODE_ENV = 'production';
    const {loadContext} = require('@docusaurus/core/lib/server/site.js');
    const {loadPluginConfigs} = require('@docusaurus/core/lib/server/plugins/configs.js');
    const {initPluginsConfigs} = require('@docusaurus/core/lib/server/plugins/init.js');
    const context = await loadContext({siteDir: root});
    const configs = (await loadPluginConfigs(context)).filter(config => config.plugin.isManualBlogPlugin);
    assert(configs.length, 'No native blog adapter registered');
    const plugins = await initPluginsConfigs(context, configs);
    const instances = [];
    for (const {plugin} of plugins) {
        const content = await plugin.loadContent();
        const inventory = JSON.parse(fs.readFileSync(path.join(root, '.i18n-build/blog-inventories', `${plugin.options.id}-${context.i18n.currentLocale}.json`)));
        instances.push({pluginId: plugin.options.id, ...inventory, contentIdentity: content.contentIdentity});
    }
    return {schemaVersion: 1, sourceCommit: sourceSha(root), scope: 'native production blog metadata; no compilation or publication proof', instances};
}
if (require.main === module) {
    const args = process.argv.slice(2), index = args.indexOf('--output');
    assert(index >= 0 && args[index + 1], 'Usage: blog-inventory.cjs --output <file>');
    collect(path.resolve(__dirname, '../..')).then(result => {
        const output = path.resolve(args[index + 1]); fs.mkdirSync(path.dirname(output), {recursive: true});
        fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
        console.log(JSON.stringify({output, sourceCommit: result.sourceCommit,
            instances: result.instances.map(i => ({pluginId: i.pluginId, posts: i.posts.length, routes: i.entries.length, reports: i.reports.length}))}));
    }).catch(error => {console.error(error); process.exitCode = 1;});
}
module.exports = {collect};
