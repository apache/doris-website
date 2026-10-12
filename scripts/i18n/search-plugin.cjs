// Reuse the installed search plugin for EN/ZH. Japanese needs an index of
// reviewed, current targets only; its native postBuild includes fallback HTML.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const nativeModule = require('@yang1666204/docusaurus-search-local/dist/server/server');
const native = nativeModule.default;
const {processPluginOptions} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/processPluginOptions');
const {processDocInfos} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/processDocInfos');
const {scanDocuments} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/scanDocuments');
const {buildIndex} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/buildIndex');

const contexts = ['docs/dev', 'docs/4.x', 'community'];
const normalize = url => url.replace(/\/+$/, '');
function groupFor(page) {
    if (page.pluginId === 'default' && page.version === 'current') return 'docs/dev';
    if (page.pluginId === 'default' && page.version === '4.x') return 'docs/4.x';
    if (page.pluginId === 'community' && page.version === 'current') return 'community';
    return null;
}
function japaneseOptions(options) {
    return {...options, language:['ja'], docsRouteBasePath:['docs','community','ja/docs','ja/community'],
        searchContextByPaths:contexts.map(value => ({path:value,label:{ja:value === 'community' ? 'コミュニティ' : value === 'docs/dev' ? 'Dev ドキュメント' : '4.x ドキュメント'}})),
        useAllContextsWithNoSearchContext:true, ignoreFiles:[]};
}
function targetFingerprint(root) {
    const digester = createHash('sha256');
    function scan(dir) {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b) => a.name.localeCompare(b.name))) {
            const file = path.join(dir,entry.name);
            if (entry.isDirectory()) scan(file);
            else if (/\.(md|mdx|json)$/.test(entry.name)) {
                digester.update(path.relative(root,file));
                digester.update(fs.readFileSync(file));
            }
        }
    }
    scan(path.join(root,'i18n/ja'));
    scan(path.join(root,'translations/state/ja'));
    for (const dir of ['docs','versioned_docs/version-4.x','community']) scan(path.join(root,dir));
    return digester.digest('hex').slice(0,16);
}
function indexFilename(context) {
    const generated = fs.readFileSync(path.join(context.generatedFilesDir,'@yang1666204/docusaurus-search-local/default/generated-constants.js'),'utf8');
    const match = generated.match(/export const searchIndexUrl = ("[^"\n]+")/);
    if (!match) throw new Error('Search index filename missing from generated constants');
    const value = JSON.parse(match[1]).split('?')[0];
    if (!/^search-index\{dir\}(?:-[a-f0-9]+)?\.json$/.test(value)) throw new Error('Unexpected search index filename');
    return value;
}
function japanesePages(plugins) {
    const selected = new Map();
    for (const plugin of plugins.filter(item => item.name === 'docusaurus-plugin-content-docs')) {
        for (const page of plugin.content?.translationManifest?.pages || []) {
            const group = groupFor(page);
            if (group && page.status === 'current' && page.useTarget && page.indexable)
                selected.set(normalize(page.permalink), group);
        }
    }
    return selected;
}
async function buildJapaneseIndex(buildData, config, filename) {
    const selected = japanesePages(buildData.plugins || []);
    const nativePaths = processDocInfos(buildData, config).flatMap(item => item.paths);
    const unique = new Map();
    for (const item of nativePaths) if (selected.has(normalize(item.url))) unique.set(normalize(item.url), item);
    if (unique.size !== selected.size) throw new Error(`Japanese search routes missing in static output: ${selected.size - unique.size}`);
    const allDocuments = await scanDocuments([...unique.values()], config);
    const write = (group, documents) => {
        const name = filename.replace('{dir}', group ? `-${group.replace(/\//g,'-')}` : '');
        fs.writeFileSync(path.join(buildData.outDir,name), JSON.stringify(buildIndex(documents,config)));
    };
    for (const group of contexts) write(group, allDocuments.map(documents => documents.filter(doc => selected.get(normalize(doc.u)) === group)));
    write('',allDocuments);
    fs.writeFileSync(path.join(buildData.outDir,'japanese-search-summary.json'), JSON.stringify({schemaVersion:1,
        indexedPages:selected.size, contexts:Object.fromEntries(contexts.map(group => [group,[...selected.values()].filter(value => value === group).length]))})+'\n');
}
function searchPlugin(context, options) {
    if (context.i18n.currentLocale !== 'ja') return native(context,options);
    const jaOptions = japaneseOptions(options);
    const plugin = native(context,jaOptions);
    const config = processPluginOptions(jaOptions,context);
    const constants = path.join(context.generatedFilesDir,'@yang1666204/docusaurus-search-local/default/generated-constants.js');
    const generated = fs.readFileSync(constants,'utf8');
    const fingerprint = targetFingerprint(context.siteDir);
    const updated = generated.replace(/(export const searchIndexUrl = )("[^"\n]+")/,
        (_,prefix,value) => {
            const url = JSON.parse(value);
            return prefix + JSON.stringify(`${url}${url.includes('?') ? '&' : '?'}ja=${fingerprint}`);
        });
    if (updated === generated) throw new Error('Could not fingerprint Japanese search index');
    fs.writeFileSync(constants,updated);
    const filename = indexFilename(context);
    return {...plugin, postBuild: buildData => buildJapaneseIndex(buildData,config,filename)};
}
module.exports = searchPlugin;
module.exports.validateOptions = nativeModule.validateOptions;
module.exports.japaneseOptions = japaneseOptions;
module.exports.groupFor = groupFor;
module.exports.japanesePages = japanesePages;
module.exports.buildJapaneseIndex = buildJapaneseIndex;
