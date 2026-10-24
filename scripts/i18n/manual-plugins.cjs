// Keep native parsing, routes and lifecycle. Select declared bodies before
// native rendering and expose compact route context to the shared consumers.
const path = require('node:path');
const {Globby, getPluginI18nPath} = require('@docusaurus/utils');
const {applyTrailingSlash} = require('@docusaurus/utils-common');
const {relative} = require('./state.cjs');
const {readJson, loadManual, decideManual} = require('./manual-state.cjs');
const {localizedContext} = require('./native-context.cjs');
const fs = require('node:fs');
const {withContentRoutes} = require('./route-context.cjs');
const {validateMessages} = require('./page-body.cjs');
const blogSample = require('./ci-blog-sample.cjs');

function wrap(kind, native) {
    async function adapter(context, options) {
        let snapshots = new Map(), records = [], nativeReports = [];
        function sourcePath(item, locale) {
            const source = path.resolve(context.siteDir, item.source.replace(/^@site\//, ''));
            const localized = getPluginI18nPath({localizationDir: path.join(context.siteDir, 'i18n', locale),
                pluginName: `docusaurus-plugin-content-${kind}`, pluginId: options.id});
            const base = source.startsWith(localized + path.sep) ? localized : path.resolve(context.siteDir, options.path);
            return relative(base, source);
        }
        function nativeOptions(ctx) {
            const base = kind === 'blog' && blogSample.enabled()
                ? {...options, feedOptions: {...options.feedOptions, type: null}} : options;
            if (kind !== 'blog' || ctx.i18n.currentLocale === 'en') return base;
            const locale = ctx.i18n.currentLocale;
            return {...options, feedOptions: {...options.feedOptions, type: null}, async processBlogPosts(args) {
                const processed = await options.processBlogPosts?.(args);
                const posts = Array.isArray(processed) ? processed : args.blogPosts;
                const english = new Map(snapshots.get('en').blogPosts.map(post => [sourcePath(post.metadata, 'en'), post]));
                return posts.flatMap(post => {
                    const file = sourcePath(post.metadata, locale), original = english.get(file);
                    if (!original) {nativeReports.push({kind: 'orphan_target', locale, targetPath: file}); return [];}
                    const contentId = `blog:${options.id === 'default' ? '' : options.id + ':'}${file}`;
                    const record = records.find(record => record.contentId === contentId && record.locale === locale);
                    const englishPath = relative(context.siteDir, path.resolve(context.siteDir, options.path, file));
                    const decision = decideManual({root: context.siteDir, record, sourceFiles: [englishPath]});
                    return [decision.fallback ? {...original, metadata: {...original.metadata, permalink: post.metadata.permalink,
                        tags: post.metadata.tags, authors: post.metadata.authors, prevItem: undefined, nextItem: undefined}} : post];
                });
            }};
        }
        const plugin = await native.default(context, nativeOptions(context));
        const englishI18n = path.join(context.siteDir, '.i18n-build/body-i18n-en.json');
        if (kind === 'pages') {
            fs.mkdirSync(path.dirname(englishI18n), {recursive: true});
            fs.writeFileSync(englishI18n, JSON.stringify({...context.i18n, currentLocale: context.i18n.defaultLocale}));
        }
        return withContentRoutes({...plugin,
            async contentLoaded(args) {
                const selected = kind === 'blog' && await blogSample.sample(context, options, args.content);
                if (!selected) return plugin.contentLoaded(args);
                // Populate native metadata and Markdown-link/asset resolvers
                // for every post, but register only sampled native routes.
                await plugin.contentLoaded({...args, actions: {...args.actions, addRoute: blogSample.collect}});
                Object.assign(args.content, selected);
                const {createAllRoutes} = require('@docusaurus/plugin-content-blog/lib/routes.js');
                const pluginDir = path.join(context.generatedFilesDir, 'docusaurus-plugin-content-blog');
                return createAllRoutes({baseUrl: context.baseUrl, content: args.content, actions: args.actions, options,
                    aliasedSource: source => '~blog/' + path.relative(pluginDir, source).split(path.sep).join('/')});
            },
            ...(kind === 'pages' && {configureWebpack(...args) {
                const result = plugin.configureWebpack?.(...args) ?? {};
                return {...result, module: {...result.module, rules: [...(result.module?.rules ?? []), {
                    enforce: 'pre', test: /\.[jt]sx?$/, resourceQuery: /[?&]doris-body=/,
                    use: [{loader: require.resolve('./page-body-loader.cjs'), options: {root: context.siteDir, englishI18n}}],
                }]}};
            }}),
            getPathsToWatch() {return [...plugin.getPathsToWatch(), path.join(context.siteDir, `translations/${kind}/**/*.json`),
                ...loadManual(context.siteDir, kind).flatMap(record => [...record.sourceFiles, ...record.targetFiles])
                    .map(file => path.join(context.siteDir, file))];},
            async loadContent() {
                snapshots = new Map(); records = loadManual(context.siteDir, kind); nativeReports = [];
                for (const locale of context.i18n.locales) {
                    const ctx = localizedContext(context, locale);
                    const instance = locale === context.i18n.currentLocale ? plugin : await native.default(ctx, nativeOptions(ctx));
                    snapshots.set(locale, await instance.loadContent());
                }
                const registry = readJson(context.siteDir, 'translations/pages/registry.json', {schemaVersion: 1, pages: []});
                if (registry.schemaVersion !== 1 || !Array.isArray(registry.pages)) throw new Error('Invalid page registry');
                const registeredIds = new Set(), registeredPaths = new Set();
                for (const page of registry.pages) {
                    if (!page.id || !page.sourcePath || !['page', 'utility'].includes(page.kind)
                        || registeredIds.has(page.id) || registeredPaths.has(page.sourcePath)) throw new Error('Invalid/duplicate page registry identity');
                    registeredIds.add(page.id); registeredPaths.add(page.sourcePath);
                }
                const report = [...nativeReports], entries = [];
                const list = value => kind === 'blog' ? value?.blogPosts.map(post => post.metadata) ?? [] : value ?? [];
                const route = permalink => applyTrailingSlash(permalink, {trailingSlash: context.siteConfig.trailingSlash, baseUrl: context.baseUrl});
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
                        if (kind === 'pages' && record && ['ready', 'needs-update'].includes(record.state)) {
                            const dependencies = validateMessages(context.siteDir, registration ?? {id: contentId, sourcePath: englishPath}, locale);
                            if (dependencies.some(file => !record.sourceFiles.includes(file))) throw new Error(`Untracked body dependency: ${contentId}/${locale}`);
                        }
                        if (record && (!record.sourceFiles.includes(englishPath) || (kind === 'blog' && ['ready', 'needs-update'].includes(record.state)
                            && !record.targetFiles.includes(`i18n/${locale}/docusaurus-plugin-content-blog${options.id === 'default' ? '' : '-' + options.id}/${file}`)))) {
                            throw new Error(`Manual state does not cover native source/target: ${contentId}/${locale}`);
                        }
                        const decision = decideManual({root: context.siteDir, record: locale === 'en' ? undefined : record, sourceFiles: [englishPath]});
                        if (locale === 'en') Object.assign(decision, {state: 'source', contentLocale: 'en', fallback: false, indexable: true});
                        if (decision.state === 'needs-update') report.push({kind: 'manual_source_changed', contentId, locale,
                            sourceHash: decision.sourceHash, publishedSourceHash: record.sourceHash});
                        const utility = registration?.kind === 'utility';
                        entries.push({contentId, kind: utility ? 'utility' : kind === 'pages' ? 'page' : 'blog',
                            pluginId: options.id, englishPath, renderIntegrated: true, siteLocale: locale, englishRoute: route(source.permalink), route: route(item.permalink),
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
                let content = snapshots.get(context.i18n.currentLocale);
                if (kind === 'pages' && content) content = content.filter(item => english.has(sourcePath(item, context.i18n.currentLocale)));
                if (content) content.contentIdentity = {entries, reports: report};
                return content;
            },
            ...(plugin.translateContent && {translateContent(args) {
                const result = plugin.translateContent(args);
                result.contentIdentity = args.content.contentIdentity;
                return result;
            }}),
        }, context, {body: kind === 'pages'});
    }
    adapter.validateOptions = native.validateOptions;
    return adapter;
}
module.exports = {pages: wrap('pages', require('@docusaurus/plugin-content-pages')),
    blog: wrap('blog', require('@docusaurus/plugin-content-blog'))};
