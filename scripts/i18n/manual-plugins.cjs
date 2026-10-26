// Keep native parsing, routes and lifecycle. Select declared bodies before
// native rendering and expose compact route context to the shared consumers.
const path = require('node:path');
const {Globby, getPluginI18nPath} = require('@docusaurus/utils');
const {applyTrailingSlash} = require('@docusaurus/utils-common');
const {relative} = require('./state.cjs');
const {readJson, loadManual, decideManual, englishFallbackLocales} = require('./manual-state.cjs');
const {localizedContext} = require('./native-context.cjs');
const fs = require('node:fs');
const {withContentRoutes} = require('./route-context.cjs');
const {validateMessages} = require('./page-body.cjs');
const blogSample = require('./ci-blog-sample.cjs');
const blogPolicy = require('./blog-policy.cjs');

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
            return {...base, async processBlogPosts(args) {
                const processed = await options.processBlogPosts?.(args);
                const posts = Array.isArray(processed) ? processed : args.blogPosts;
                const english = new Map(snapshots.get('en').blogPosts.map(post => [sourcePath(post.metadata, 'en'), post]));
                const parsed = new Map(posts.map(post => [sourcePath(post.metadata,locale),post]));
                for (const file of parsed.keys()) if (!english.has(file)) nativeReports.push({kind:'orphan_target',locale,targetPath:file});
                return [...english].map(([file, original]) => {
                    const post = parsed.get(file) ?? original;
                    const contentId = `blog:${options.id === 'default' ? '' : options.id + ':'}${file}`;
                    const record = records.find(record => record.contentId === contentId && record.locale === locale);
                    const englishPath = relative(context.siteDir, path.resolve(context.siteDir, options.path, file));
                    const decision = decideManual({root: context.siteDir, record, sourceFiles: [englishPath]});
                    if (!decision.fallback && !parsed.has(file)) throw new Error(`Published blog target has no native route: ${contentId}/${locale}`);
                    if (!decision.fallback) blogPolicy.stableMetadata(original.metadata, post.metadata,
                        localizedContext(context, 'en').baseUrl, ctx.baseUrl);
                    const toLocale = route => ctx.baseUrl + route.slice(localizedContext(context, 'en').baseUrl.length);
                    const selected = decision.fallback ? {...original, metadata: {...original.metadata, permalink: toLocale(original.metadata.permalink),
                        tags: original.metadata.tags.map(tag => ({...tag, permalink: toLocale(tag.permalink)})),
                        authors: original.metadata.authors.map(author => ({...author,
                            ...(author.page && {page:{...author.page,permalink:toLocale(author.page.permalink)}})})),
                        prevItem: undefined, nextItem: undefined}} : post;
                    return {...selected, metadata: {...selected.metadata, dorisContent: {contentId, contentLocale: decision.contentLocale,
                        fallback: decision.fallback, state: decision.state, indexable: decision.indexable && !original.metadata.unlisted}}};
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
            ...(kind === 'blog' && {
                postBuild(args) {return plugin.postBuild?.({...args, content: blogPolicy.feedContent(args.content)});},
                injectHtmlTags(args) {return plugin.injectHtmlTags?.({...args, content: blogPolicy.feedContent(args.content)});},
            }),
            async contentLoaded(args) {
                const selected = kind === 'blog' && await blogSample.sample(context, options, args.content);
                const english = kind === 'blog' && new Map(snapshots.get('en').blogPosts.map(post => [sourcePath(post.metadata,'en'),post]));
                const aliases = kind === 'blog' ? args.content.blogPosts.flatMap(post => {
                    const locale=context.i18n.currentLocale,file=sourcePath(post.metadata,locale),original=english.get(file);
                    if(!original||locale==='en') return [];
                    const localizedDir=getPluginI18nPath({localizationDir:path.join(context.siteDir,'i18n',locale),
                        pluginName:'docusaurus-plugin-content-blog',pluginId:options.id});
                    const sources=[original.metadata.source,'@site/'+relative(context.siteDir,path.join(localizedDir,file))];
                    return sources.filter(source=>source!==post.metadata.source).map((source,index)=>
                        ({...post,id:`link-alias:${index}:${post.id}`,metadata:{...post.metadata,source}}));
                }) : [];
                if (!selected && !aliases.length) return plugin.contentLoaded(args);
                // Seed native MDX link resolution with both physical source
                // paths. A fallback English article can link to a translated
                // peer without losing that peer's locale or compiling its
                // English body as a second public article.
                await plugin.contentLoaded({...args, content:{...args.content,blogPosts:[...args.content.blogPosts,...aliases]},
                    actions:{...args.actions,addRoute:()=>{}}});
                const {createAllRoutes} = require('@docusaurus/plugin-content-blog/lib/routes.js');
                const pluginDir = path.join(context.generatedFilesDir, 'docusaurus-plugin-content-blog');
                const aliasedSource = source => '~blog/' + path.relative(pluginDir, source).split(path.sep).join('/');
                if (selected) {
                    await createAllRoutes({baseUrl:context.baseUrl,content:args.content,actions:{...args.actions,addRoute:blogSample.collect},options,aliasedSource});
                    Object.assign(args.content, selected);
                }
                return createAllRoutes({baseUrl: context.baseUrl, content: args.content, actions: args.actions, options,
                    aliasedSource});
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
                const fallbackLocales = englishFallbackLocales(registry);
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
                        const intentionalFallback = kind === 'pages' && registration?.kind !== 'utility' && fallbackLocales.includes(locale);
                        if (intentionalFallback && record && ['ready', 'needs-update'].includes(record.state))
                            throw new Error(`Landing translation disabled by English fallback policy: ${contentId}/${locale}`);
                        if (intentionalFallback) report.push({kind: 'intentional_english_fallback', contentId, locale});
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
                if (kind === 'blog') {
                    for (const post of snapshots.get('en').blogPosts) post.metadata.dorisContent = {
                        contentLocale: 'en', fallback: false, state: 'source', indexable: !post.metadata.unlisted};
                    entries.push(...await blogPolicy.aggregateEntries(context, options, snapshots, entries));
                    const directory = path.join(context.siteDir, '.i18n-build/blog-inventories');
                    fs.mkdirSync(directory, {recursive: true});
                    const posts = [...english].map(([file, metadata]) => ({contentId: `blog:${options.id === 'default' ? '' : options.id + ':'}${file}`,
                        sourcePath: relative(context.siteDir, path.resolve(context.siteDir, options.path, file)), ...metadata}));
                    fs.writeFileSync(path.join(directory, `${options.id}-${context.i18n.currentLocale}.json`),
                        JSON.stringify({schemaVersion: 1, posts, entries, reports: report}, null, 2) + '\n');
                }
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
    adapter.isManualBlogPlugin = kind === 'blog';
    return adapter;
}
module.exports = {pages: wrap('pages', require('@docusaurus/plugin-content-pages')),
    blog: wrap('blog', require('@docusaurus/plugin-content-blog'))};
