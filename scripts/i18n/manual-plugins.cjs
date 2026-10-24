// Read routes from native plugins. Rendering, blog lifecycle and SEO remain
// native until the page/blog consumers adopt the contract in T03/T14.
const path = require('node:path');
const {Globby, getPluginI18nPath} = require('@docusaurus/utils');
const {applyTrailingSlash} = require('@docusaurus/utils-common');
const {relative} = require('./state.cjs');
const {readJson, loadManual, decideManual} = require('./manual-state.cjs');
const {localizedContext} = require('./native-context.cjs');

function wrap(kind, native) {
    async function adapter(context, options) {
        const plugin = await native.default(context, options);
        return {...plugin,
            getPathsToWatch() {return [...plugin.getPathsToWatch(), path.join(context.siteDir, `translations/${kind}/**/*.json`),
                ...loadManual(context.siteDir, kind).flatMap(record => [...record.sourceFiles, ...record.targetFiles])
                    .map(file => path.join(context.siteDir, file))];},
            async loadContent() {
                const snapshots = new Map();
                for (const locale of context.i18n.locales) {
                    const ctx = localizedContext(context, locale);
                    const instance = locale === context.i18n.currentLocale ? plugin : await native.default(ctx, options);
                    snapshots.set(locale, await instance.loadContent());
                }
                const records = loadManual(context.siteDir, kind);
                const registry = readJson(context.siteDir, 'translations/pages/registry.json', {schemaVersion: 1, pages: []});
                if (registry.schemaVersion !== 1 || !Array.isArray(registry.pages)) throw new Error('Invalid page registry');
                const registeredIds = new Set(), registeredPaths = new Set();
                for (const page of registry.pages) {
                    if (!page.id || !page.sourcePath || !['page', 'utility'].includes(page.kind)
                        || registeredIds.has(page.id) || registeredPaths.has(page.sourcePath)) throw new Error('Invalid/duplicate page registry identity');
                    registeredIds.add(page.id); registeredPaths.add(page.sourcePath);
                }
                const report = [], entries = [];
                const list = value => kind === 'blog' ? value?.blogPosts.map(post => post.metadata) ?? [] : value ?? [];
                const route = permalink => applyTrailingSlash(permalink, {trailingSlash: context.siteConfig.trailingSlash, baseUrl: context.baseUrl});
                function sourcePath(item, locale) {
                    const source = path.resolve(context.siteDir, item.source.replace(/^@site\//, ''));
                    const localized = getPluginI18nPath({localizationDir: path.join(context.siteDir, 'i18n', locale),
                        pluginName: `docusaurus-plugin-content-${kind}`, pluginId: options.id});
                    const base = source.startsWith(localized + path.sep) ? localized : path.resolve(context.siteDir, options.path);
                    return relative(base, source);
                }
                const english = new Map(list(snapshots.get('en')).map(item => [sourcePath(item, 'en'), item]));
                const locales = new Map([...snapshots].map(([locale, value]) => [locale,
                    new Map(list(value).map(item => [sourcePath(item, locale), item]))]));
                const known = new Set();
                for (const [file, source] of english) {
                    const englishPath = relative(context.siteDir, path.resolve(context.siteDir, options.path, file));
                    const registration = kind === 'pages' ? registry.pages.find(page => page.sourcePath === englishPath) : undefined;
                    const contentId = kind === 'blog' ? `blog:${options.id === 'default' ? '' : options.id + ':'}${file}`
                        : `${registration?.kind ?? 'page'}:${registration?.id ?? englishPath}`;
                    known.add(contentId);
                    if (kind === 'pages' && !registration) report.push({kind: 'unregistered_page_identity', contentId, englishPath});
                    for (const locale of context.i18n.locales) {
                        const item = locales.get(locale).get(file);
                        if (!item) {report.push({kind: 'missing_native_route', contentId, locale}); continue;}
                        const record = records.find(page => page.contentId === contentId && page.locale === locale);
                        if (record && (!record.sourceFiles.includes(englishPath) || (kind === 'blog'
                            && !record.targetFiles.includes(`i18n/${locale}/docusaurus-plugin-content-blog${options.id === 'default' ? '' : '-' + options.id}/${file}`)))) {
                            throw new Error(`Manual state does not cover native source/target: ${contentId}/${locale}`);
                        }
                        const decision = decideManual({root: context.siteDir, record: locale === 'en' ? undefined : record, sourceFiles: [englishPath]});
                        if (locale === 'en') Object.assign(decision, {state: 'source', contentLocale: 'en', fallback: false, indexable: true});
                        if (decision.state === 'needs-update') report.push({kind: 'manual_source_changed', contentId, locale,
                            sourceHash: decision.sourceHash, publishedSourceHash: record.sourceHash});
                        const utility = registration?.kind === 'utility';
                        entries.push({contentId, kind: utility ? 'utility' : kind === 'pages' ? 'page' : 'blog',
                            pluginId: options.id, englishPath, renderIntegrated: locale === 'en', siteLocale: locale, englishRoute: route(source.permalink), route: route(item.permalink),
                            ...decision, indexable: !utility && !item.unlisted && decision.indexable, updatePolicy: 'manual'});
                    }
                }
                for (const [locale, items] of locales) {
                    for (const file of items.keys()) if (!english.has(file)) report.push({kind: 'orphan_target', locale, targetPath: file});
                    if (locale === 'en') continue;
                    const ctx = localizedContext(context, locale);
                    const dir = getPluginI18nPath({localizationDir: ctx.localizationDir, pluginName: `docusaurus-plugin-content-${kind}`, pluginId: options.id});
                    for (const file of await Globby(options.include, {cwd: dir, ignore: options.exclude})) {
                        if (!english.has(file)) report.push({kind: 'orphan_target_file', locale, targetPath: relative(context.siteDir, path.join(dir, file))});
                    }
                }
                if (kind === 'pages') {
                    const englishPaths = new Set(entries.map(entry => entry.englishPath));
                    for (const page of registry.pages) if (!englishPaths.has(page.sourcePath)) report.push({
                        kind: 'missing_english_identity', contentId: `${page.kind}:${page.id}`, englishPath: page.sourcePath});
                }
                for (const record of records) if (!known.has(record.contentId)) report.push({kind: 'source_deleted', ...record});
                const content = snapshots.get(context.i18n.currentLocale);
                if (content) content.contentIdentity = {entries, reports: report};
                return content;
            },
            ...(plugin.translateContent && {translateContent(args) {
                const result = plugin.translateContent(args);
                result.contentIdentity = args.content.contentIdentity;
                return result;
            }}),
        };
    }
    adapter.validateOptions = native.validateOptions;
    return adapter;
}
module.exports = {pages: wrap('pages', require('@docusaurus/plugin-content-pages')),
    blog: wrap('blog', require('@docusaurus/plugin-content-blog'))};
