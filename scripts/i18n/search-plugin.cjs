// Reuse the installed search plugin for the source locales. A managed locale
// needs an index of reviewed, current targets only; the native postBuild
// includes fallback HTML. Its analyzer comes from the locale language, and its
// context labels from the translation configuration.
const fs = require('node:fs');
const path = require('node:path');
const lunr = require('lunr');
const {createHash} = require('node:crypto');
const nativeModule = require('@yang1666204/docusaurus-search-local/dist/server/server');
const native = nativeModule.default;
const {processPluginOptions} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/processPluginOptions');
const {processDocInfos} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/processDocInfos');
const {scanDocuments} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/scanDocuments');
const {buildIndex: buildNativeIndex} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/buildIndex');
const {postBuildFactory} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/postBuildFactory');
const {loadConfig, managedLocales} = require('./state.cjs');
const {normalizeRussianSearch} = require('../../src/utils/searchNormalization.js');
const {fallbackOnly} = require('./docs-language-policy.cjs');
const {sourceSha} = require('./content-manifest.cjs');

function contextsFor(root) {
    const versions = JSON.parse(fs.readFileSync(path.join(root, 'versions.json'), 'utf8'));
    if (!Array.isArray(versions) || versions.some(version => typeof version !== 'string'
        || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(version))) throw new Error('Invalid native docs versions');
    return [...new Set(['docs/dev', ...versions.filter(version => !fallbackOnly('default', version))
        .map(version => `docs/${version}`), 'community', 'course', 'releases'])];
}
const contexts = contextsFor(path.resolve(__dirname, '../..'));
const normalize = url => url.replace(/\/+$/, '');
function groupFor(page) {
    if (page.pluginId === 'default' && page.version === 'current') return 'docs/dev';
    if (page.pluginId === 'default' && typeof page.version === 'string' && !fallbackOnly(page.pluginId, page.version)) return `docs/${page.version}`;
    if (page.pluginId === 'community' && page.version === 'current') return 'community';
    if (page.pluginId === 'course' && page.version === 'current') return 'course';
    if (page.pluginId === 'releases' && page.version === 'current') return 'releases';
    return null;
}
function localizedOptions(options, locale, labels, contextNames = contexts) {
    return {...options, language:locale === 'ru' ? ['en', 'ru'] : [locale.split('-')[0]],
        docsRouteBasePath:['docs','community','course','releases',`${locale}/docs`,`${locale}/community`,`${locale}/course`,`${locale}/releases`],
        // A locale without configured labels falls back to the context path.
        searchContextByPaths:contextNames.map(value => ({path:value,label:{[locale]:labels?.[value] ?? value}})),
        // Outside every context, search all of them. The browser queries each
        // context index for that (src/utils/searchContexts.js); see indexGroups.
        useAllContextsWithNoSearchContext:true, ignoreFiles:[]};
}
// One index per context, plus the root index for documents outside every
// context. The root does not repeat the contexts the way the native plugin's
// union does: that copy held every context a second time, and the Japanese one
// outgrew GitHub's 100 MiB file limit, which rejected the deployment.
function indexGroups(allDocuments, selected, contextNames = contexts) {
    const groups = new Map(contextNames.map(group => [group,
        allDocuments.map(documents => documents.filter(doc => selected.get(normalize(doc.u)) === group))]));
    groups.set('', allDocuments.map(documents => documents.filter(doc => !selected.has(normalize(doc.u)))));
    return groups;
}
function targetFingerprint(root, locale, {allVersions = false} = {}) {
    const digester = createHash('sha256');
    digester.update(fs.readFileSync(__filename)); // Bust caches when indexing behavior changes.
    // The shared normalizer also changes indexed tokens independently of this file.
    digester.update(fs.readFileSync(require.resolve('../../src/utils/searchNormalization.js')));
    digester.update(fs.readFileSync(require.resolve('./docs-language-policy.cjs')));
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
    scan(path.join(root,'i18n',locale));
    scan(path.join(root,'translations/state',locale));
    digester.update(fs.readFileSync(path.join(root, 'versions.json')));
    const versions = JSON.parse(fs.readFileSync(path.join(root, 'versions.json')))
        .filter(version => allVersions || !fallbackOnly('default', version));
    for (const dir of ['docs', ...versions.map(version => `versioned_docs/version-${version}`),
        'community','course','releasenotes']) scan(path.join(root,dir));
    for (const file of ['docusaurus.config.js','config/i18n.js','translations/config.json',
        'sidebars.ts','sidebarsCommunity.json','sidebarsCourse.json','sidebarsReleases.json']) {
        const target = path.join(root, file);
        if (fs.existsSync(target)) {digester.update(file);digester.update(fs.readFileSync(target));}
    }
    digester.update(process.env.DOCS_VERSIONS ?? '');
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
function localizedPages(plugins, locale, contextNames = contexts) {
    const selected = new Map();
    for (const plugin of plugins.filter(item => item.name === 'docusaurus-plugin-content-docs')) {
        for (const page of plugin.content?.translationManifest?.pages || []) {
            const group = groupFor(page);
            if (page.locale === locale && contextNames.includes(group) && page.status === 'current' && page.useTarget && page.indexable)
                selected.set(normalize(page.permalink), group);
        }
    }
    return selected;
}
// Spaced-language tokenizers otherwise keep SQL call punctuation attached to
// identifiers (for example match(query_vector,...)). Replace delimiters with
// equal-length spaces for indexing, preserving the original display text and
// highlight offsets. Language-specific tokenizers can still override this one.
function buildLocalizedIndexes(documents, config) {
    const original = lunr.tokenizer;
    const tokenizer = Object.assign((value, metadata) => original(
        typeof value === 'string' ? (config.language.includes('ru')
            ? normalizeRussianSearch(value) : value.replace(/[()\[\]{},"';`]/g, ' ')) : value, metadata), original);
    try {
        lunr.tokenizer = tokenizer;
        return buildNativeIndex(documents, config);
    } finally {lunr.tokenizer = original;}
}

async function buildLocalizedIndex(buildData, config, filename, locale, contextNames = contexts) {
    const selected = localizedPages(buildData.plugins || [], locale, contextNames);
    const nativePaths = processDocInfos(buildData, config).flatMap(item => item.paths);
    const unique = new Map();
    for (const item of nativePaths) if (selected.has(normalize(item.url))) unique.set(normalize(item.url), item);
    if (unique.size !== selected.size) throw new Error(`Localized search routes missing in static output: ${selected.size - unique.size}`);
    const allDocuments = await scanDocuments([...unique.values()], config);
    const write = (group, documents) => {
        const name = filename.replace('{dir}', group ? `-${group.replace(/\//g,'-')}` : '');
        fs.writeFileSync(path.join(buildData.outDir,name), JSON.stringify(buildLocalizedIndexes(documents,config)));
    };
    for (const [group, documents] of indexGroups(allDocuments, selected, contextNames)) write(group, documents);
    fs.writeFileSync(path.join(buildData.outDir,`${locale}-search-summary.json`), JSON.stringify({schemaVersion:1,locale,
        indexedPages:selected.size, contexts:Object.fromEntries(contextNames.map(group => [group,[...selected.values()].filter(value => value === group).length]))})+'\n');
}
function searchPlugin(context, options) {
    const locale = context.i18n.currentLocale;
    const managed = managedLocales(context.siteDir, context.i18n.locales).includes(locale);
    const contextNames = contextsFor(context.siteDir);
    const localized = managed ? localizedOptions(options, locale, loadConfig(context.siteDir).locales[locale]?.searchContextLabels, contextNames) : options;
    const plugin = native(context,localized);
    const config = processPluginOptions(localized,context);
    const constants = path.join(context.generatedFilesDir,'@yang1666204/docusaurus-search-local/default/generated-constants.js');
    const generated = fs.readFileSync(constants,'utf8');
    const fingerprint = targetFingerprint(context.siteDir, locale, {allVersions: !managed});
    const revision = sourceSha(context.siteDir);
    let filename;
    const updated = generated.replace(/(export const searchIndexUrl = )("[^"\n]+")/,
        (_,prefix,value) => {
            const url = JSON.parse(value);
            // A source-derived filename prevents a CDN from reusing an older
            // index at the same path, even when it ignores query parameters.
            const contentKey = createHash('sha256').update(url).update(fingerprint).update(revision).digest('hex').slice(0,16);
            filename = config.hashed ? `search-index{dir}-${contentKey}.json` : url.split('?')[0];
            return prefix + JSON.stringify(config.hashed ? filename
                : `${url}${url.includes('?') ? '&' : '?'}${locale}=${fingerprint}`);
        });
    if (updated === generated) throw new Error('Could not fingerprint the localized search index');
    fs.writeFileSync(constants,updated);
    if (indexFilename(context) !== filename) throw new Error('Search index filename differs from its browser URL');
    return {...plugin, postBuild: managed
        ? buildData => buildLocalizedIndex(buildData,config,filename,locale,contextNames)
        : buildData => {
            const hidden = new Set((buildData.plugins ?? []).flatMap(plugin=>plugin.content?.contentIdentity?.entries ?? [])
                .filter(page=>page.kind==='docs'&&page.siteLocale===locale&&page.indexable===false)
                .map(page=>normalize(page.route)));
            // Native source-language indexing keeps its version/context layout,
            // but cannot advertise English fallbacks as Chinese translations.
            return postBuildFactory(config,filename)({...buildData,
                routesPaths:buildData.routesPaths.filter(route=>!hidden.has(normalize(route)))});
        }};
}
module.exports = searchPlugin;
module.exports.validateOptions = nativeModule.validateOptions;
module.exports.localizedOptions = localizedOptions;
module.exports.groupFor = groupFor;
module.exports.contexts = contexts;
module.exports.contextsFor = contextsFor;
module.exports.localizedPages = localizedPages;
module.exports.indexGroups = indexGroups;
module.exports.buildLocalizedIndex = buildLocalizedIndex;

module.exports.buildLocalizedIndexes = buildLocalizedIndexes;
module.exports.targetFingerprint = targetFingerprint;
