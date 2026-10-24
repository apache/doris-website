const fs = require('node:fs/promises');
const path = require('node:path');
const native = require('@docusaurus/plugin-content-docs');
const {readVersionsMetadata} = require('@docusaurus/plugin-content-docs/lib/versions/index.js');
const {processDocMetadata} = require('@docusaurus/plugin-content-docs/lib/docs.js');
const {Globby, getPluginI18nPath, readLastUpdateData, aliasedSitePath, resolveMarkdownLinkPathname} = require('@docusaurus/utils');
const {applyTrailingSlash} = require('@docusaurus/utils-common');
const {hash, relative, identity, loadConfig, managedLocales, loadRecords, sourceLocaleFor, decide} = require('./state.cjs');
const {mergeAlternates} = require('./alternates.cjs');
const {structure, alignHeadings} = require('./structure.cjs');

async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
async function read(file) { return await exists(file) ? fs.readFile(file, 'utf8') : undefined; }
const {localizedContext} = require('./native-context.cjs');
const {adaptDoc, docsId} = require('./content-manifest.cjs');

async function metadata(context, options, versionMetadata, source, filePath, content) {
    return processDocMetadata({context, options: {...options, showLastUpdateTime: false, showLastUpdateAuthor: false},
        versionMetadata, env: process.env.NODE_ENV, tagsFile: undefined,
        docFile: {source, content, filePath, contentPath: path.dirname(filePath)}});
}

// Keep the native plugin name, validation, route parser, links and sidebars.
// The adapter only redirects the localization directory of every managed locale
// to its generated view and adds translation state.
module.exports = async function translationDocsPlugin(context, options) {
    // Managed locales come from the translation configuration, restricted to the
    // locales this build serves. Without managed locales the native render path
    // stays untouched, while English/Chinese identities still enter the registry.
    const metadataCache = new Map();
    const readMetadata = (ctx, opts, version, source, file, content) => {
        const key = JSON.stringify([ctx.i18n.currentLocale, version.versionName, file, hash(content)]);
        if (!metadataCache.has(key)) metadataCache.set(key, metadata(ctx, opts, version, source, file, content));
        return metadataCache.get(key);
    };
    const managed = managedLocales(context.siteDir, context.i18n.locales);
    const settings = loadConfig(context.siteDir).locales;
    const records = Object.fromEntries(managed.map(locale => [locale, loadRecords(context.siteDir, locale)]));
    // Source locales are always present; a managed locale that repeats one of
    // them must not shadow it.
    const contexts = Object.fromEntries([...new Set(['en', 'zh-CN', ...managed])].map(lang => [lang, localizedContext(context, lang)]));
    const versions = Object.fromEntries(await Promise.all(Object.entries(contexts).map(async ([lang, ctx]) =>
        [lang, await readVersionsMetadata({context: ctx, options})])));
    // Match i18n/<locale>'s depth so valid project-relative MDX imports still
    // reach the same @site files. Native plugin namespaces isolate instances.
    const viewRoot = locale => path.join(context.siteDir, '.i18n-build', locale);
    const viewPluginDir = locale => getPluginI18nPath({localizationDir: viewRoot(locale),
        pluginName: 'docusaurus-plugin-content-docs', pluginId: options.id});
    const originalPluginDir = locale => getPluginI18nPath({localizationDir: contexts[locale].localizationDir,
        pluginName: 'docusaurus-plugin-content-docs', pluginId: options.id});
    // The locale being built is the only one whose view has to exist on disk.
    const activeLocale = managed.includes(context.i18n.currentLocale) ? context.i18n.currentLocale : undefined;
    if (activeLocale) {
        await fs.rm(viewPluginDir(activeLocale), {recursive: true, force: true});
        await fs.mkdir(viewPluginDir(activeLocale), {recursive: true});
        if (await exists(originalPluginDir(activeLocale))) await fs.cp(originalPluginDir(activeLocale), viewPluginDir(activeLocale), {recursive: true});
    }
    const pages = [];
    const sourceEntries = [];
    const reports = [];
    const route = permalink => applyTrailingSlash(permalink, {trailingSlash: context.siteConfig.trailingSlash, baseUrl: context.baseUrl});
    const versionInputs = await Promise.all(versions.en.map(async (englishVersion, index) => {
        const filenames = (await Globby(options.include, {cwd: englishVersion.contentPath, ignore: options.exclude})).sort();
        return {index, englishVersion, filenames, registered: new Set(filenames),
            versionDir: englishVersion.versionName === 'current' ? 'current' : `version-${englishVersion.versionName}`};
    }));
    // Native source metadata also exists when all optional locales are disabled.
    // It supplies real Chinese slugs and per-file fallback, independent of docs state.
    for (const {index, englishVersion, filenames} of versionInputs) {
        for (const filename of filenames) {
            const englishFile = path.join(englishVersion.contentPath, filename);
            const englishContent = await fs.readFile(englishFile, 'utf8');
            const englishDoc = await readMetadata(contexts.en, options, englishVersion, filename, englishFile, englishContent);
            if (englishDoc.draft) continue;
            for (const locale of ['en', 'zh-CN'].filter(lang => context.i18n.locales.includes(lang))) {
                const file = locale === 'en' ? englishFile : path.join(versions[locale][index].contentPathLocalized, filename);
                const content = locale === 'en' ? englishContent : await read(file);
                const doc = locale === 'en' ? englishDoc : await readMetadata(contexts[locale], options, versions[locale][index], filename,
                    content === undefined ? englishFile : file, content ?? englishContent);
                if (doc.draft) continue;
                if (doc.id !== englishDoc.id) {
                    reports.push({kind: 'source_identity_conflict', pluginId: options.id, version: englishVersion.versionName,
                        sourceLocale: locale, docId: doc.id, englishDocId: englishDoc.id, sourcePath: relative(context.siteDir, file)});
                    continue;
                }
                sourceEntries.push({contentId: docsId({pluginId: options.id, version: englishVersion.versionName, docId: englishDoc.id}),
                    kind: 'docs', renderIntegrated: true, pluginId: options.id, version: englishVersion.versionName, docId: englishDoc.id, siteLocale: locale,
                    contentLocale: content === undefined ? 'en' : locale, state: content === undefined ? 'untranslated' : 'source',
                    fallback: content === undefined, indexable: content !== undefined && !doc.unlisted && !versions[locale][index].noIndex,
                    route: route(doc.permalink), englishRoute: route(englishDoc.permalink),
                    englishPath: relative(context.siteDir, englishFile), sourcePath: relative(context.siteDir, content === undefined ? englishFile : file),
                    sourceHash: hash(content ?? englishContent), targetHash: null, updatePolicy: 'native-manual-docs'});
            }
        }
    }
    for (const locale of managed) {
    for (const {index, englishVersion, versionDir, filenames, registered} of versionInputs) {
        const targetDir = path.join(originalPluginDir(locale), versionDir);
        const seenIds = new Set();
        for (const filename of filenames) {
            const englishFile = path.join(englishVersion.contentPath, filename);
            const englishContent = await fs.readFile(englishFile, 'utf8');
            const englishDoc = await readMetadata(contexts.en, options, englishVersion, filename, englishFile, englishContent);
            seenIds.add(englishDoc.id);
            const page = {pluginId: options.id, version: englishVersion.versionName, docId: englishDoc.id, locale};
            const requestedSourceLocale = sourceLocaleFor(settings[locale], page);
            const chineseFile = path.join(versions['zh-CN'][index].contentPathLocalized, filename);
            const chineseContent = await read(chineseFile);
            const sourceLocale = requestedSourceLocale === 'zh-CN' && chineseContent !== undefined ? 'zh-CN' : 'en';
            const sourceFile = sourceLocale === 'en' ? englishFile : chineseFile;
            const source = sourceLocale === 'en' ? englishContent : chineseContent;
            const targetFile = path.join(targetDir, filename);
            const target = await read(targetFile);
            Object.assign(page, {sourceLocale, sourcePath: relative(context.siteDir, sourceFile),
                englishPath: relative(context.siteDir, englishFile), targetPath: relative(context.siteDir, targetFile)});
            const record = records[locale].get(identity(page));
            const maintainCase = context.siteConfig.markdown.anchors.maintainCase;
            const sourceStructure = target !== undefined
                ? await structure(source, path.extname(filename), maintainCase).catch(() => null) : null;
            let state = decide({page, source, target, record, technicalHash: sourceStructure?.technicalHash});
            if (requestedSourceLocale !== sourceLocale) {
                state = {...state, status: 'source_missing', useTarget: false, indexable: false, contentLocale: 'en'};
                reports.push({kind: 'source_divergence', ...page, requestedSourceLocale});
            }
            // Parse all counterparts with the framework, including custom IDs,
            // number prefixes and localized slugs. Never invent a missing node.
            const chineseDoc = await readMetadata(contexts['zh-CN'], options, versions['zh-CN'][index], filename,
                chineseContent === undefined ? englishFile : chineseFile, chineseContent ?? englishContent);
            const nativeSourceDoc = sourceLocale === 'en' ? englishDoc : chineseDoc;
            let localizedContent;
            if (state.useTarget) {
                const targetDoc = await readMetadata(contexts[locale], options, versions[locale][index], filename, targetFile, target).catch(() => null);
                if (!targetDoc || targetDoc.id !== englishDoc.id || targetDoc.slug !== englishDoc.slug || targetDoc.draft !== englishDoc.draft
                    || targetDoc.unlisted !== englishDoc.unlisted) {
                    state = {...state, status: 'state_conflict', useTarget: false, indexable: false, contentLocale: 'en'};
                } else {
                    try { localizedContent = await alignHeadings(sourceLocale === 'en' ? sourceStructure
                        : await structure(englishContent, path.extname(filename), maintainCase), target, path.extname(filename), maintainCase); }
                    catch { state = {...state, status: 'heading_conflict', useTarget: false, indexable: false, contentLocale: 'en'}; }
                }
            }
            // A Chinese source can supply content only for an English registered
            // node. Its routing metadata must still match that node.
            if (sourceLocale === 'zh-CN' && (chineseDoc.id !== englishDoc.id || chineseDoc.slug !== englishDoc.slug
                || chineseDoc.draft !== englishDoc.draft)) {
                state = {...state, status: 'source_route_conflict', useTarget: false, indexable: false, contentLocale: 'en'};
                reports.push({kind: 'source_divergence', ...page, reason: 'source_route_conflict'});
            }
            const selectedContent = state.useTarget ? localizedContent : englishContent;
            const localizedDoc = await readMetadata(contexts[locale], options, versions[locale][index], filename, targetFile, selectedContent);
            const indexable = state.indexable && !localizedDoc.draft && !localizedDoc.unlisted && !versions[locale][index].noIndex;
            state = {...state, indexable, draft: localizedDoc.draft, unlisted: localizedDoc.unlisted,
                permalink: route(localizedDoc.permalink), englishPermalink: route(englishDoc.permalink),
                sourcePermalink: route(nativeSourceDoc.draft ? englishDoc.permalink : nativeSourceDoc.permalink),
                alternates: {en: route(englishDoc.permalink), ...(!chineseDoc.draft && {'zh-CN': route(chineseDoc.permalink)}),
                    ...(indexable ? {[locale]: route(localizedDoc.permalink)} : {})}};
            pages.push(state);
            if (context.i18n.currentLocale === locale) {
                const viewFile = path.join(viewPluginDir(locale), versionDir, filename);
                if (state.useTarget) {
                    await fs.mkdir(path.dirname(viewFile), {recursive: true});
                    await fs.writeFile(viewFile, selectedContent);
                } else {
                    // Omitting it uses the native per-file English fallback.
                    await fs.rm(viewFile, {force: true});
                }
            }
        }
        for (const target of await Globby(options.include, {cwd: targetDir, ignore: options.exclude})) {
            if (!registered.has(target)) reports.push({kind: 'orphan_target', locale, pluginId: options.id,
                version: englishVersion.versionName, targetPath: relative(context.siteDir, path.join(targetDir, target))});
        }
        for (const record of records[locale].values()) {
            if (record.pluginId === options.id && record.version === englishVersion.versionName && !seenIds.has(record.docId)) {
                reports.push({kind: 'source_deleted', ...record});
            }
        }
    }
    }
    // A Chinese-only source describes the repository rather than one target
    // locale, so it is reported once instead of once per managed locale.
    for (const {index, englishVersion, registered} of versionInputs) {
        for (const target of await Globby(options.include, {cwd: versions['zh-CN'][index].contentPathLocalized, ignore: options.exclude})) {
            if (!registered.has(target)) reports.push({kind: 'unsupported_source_route', pluginId: options.id,
                version: englishVersion.versionName, sourceLocale: 'zh-CN',
                sourcePath: relative(context.siteDir, path.join(versions['zh-CN'][index].contentPathLocalized, target))});
        }
    }
    mergeAlternates(pages);
    const pluginContext = activeLocale ? {...context, localizationDir: viewRoot(activeLocale)} : context;
    const plugin = await native.default(pluginContext, options);
    const byId = new Map(pages.map(page => [identity(page), page]));
    const sourceAliases = new Map();
    const adaptedLoaders = new WeakSet();
    let loaded = false;
    return {...plugin,
        getPathsToWatch() {
            return [...plugin.getPathsToWatch().filter(file => !managed.some(locale => file.startsWith(viewRoot(locale)))),
                ...managed.map(locale => `${originalPluginDir(locale)}/**/*`),
                ...versions['zh-CN'].map(version => `${version.contentPathLocalized}/**/*`),
                path.join(context.siteDir, 'translations/**/*.json')];
        },
        async loadContent() {
            // A dev-server content reload must re-evaluate hashes and rebuild
            // the view, just like a new static build. Do not watch our own view.
            if (loaded) return (await translationDocsPlugin(context, options)).loadContent();
            loaded = true;
            const content = await plugin.loadContent();
            if (activeLocale) {
                for (const version of content.loadedVersions) {
                    for (const doc of [...version.docs, ...version.drafts]) {
                        const state = byId.get(identity({pluginId: options.id, version: version.versionName, docId: doc.id, locale: activeLocale}));
                        if (!state || state.permalink !== route(doc.permalink)) throw new Error(`Translation view/metadata mismatch: ${doc.id}`);
                        doc.translation = state;
                        // A translation commit is not a technical update. Ask the
                        // same parser/map/git machinery about the actual source.
                        const sourceFile = path.join(context.siteDir, state.contentLocale === 'en' ? state.englishPath : state.sourcePath);
                        const parsed = await context.siteConfig.markdown.parseFrontMatter({filePath: sourceFile,
                            fileContent: await fs.readFile(sourceFile, 'utf8'),
                            defaultParseFrontMatter: require('@docusaurus/utils').DEFAULT_PARSE_FRONT_MATTER});
                        // Even plugins that hide the date need the real source
                        // timestamp for sitemap lastmod when their file is in
                        // the temporary view (which has no Git history).
                        const sourceOptions = state.useTarget
                            ? {...options, showLastUpdateTime: true} : options;
                        const lastUpdate = await readLastUpdateData(sourceFile, sourceOptions, parsed.frontMatter.last_update);
                        doc.lastUpdatedAt = lastUpdate.lastUpdatedAt;
                        doc.lastUpdatedBy = lastUpdate.lastUpdatedBy;
                    }
                }
            }
            return {...content, contentIdentity: {entries: [...sourceEntries, ...pages.filter(page => !page.draft).map(adaptDoc)], reports},
                ...(managed.length && {translationManifest: {schemaVersion: 1, pluginId: options.id, locale: context.i18n.currentLocale, pages, reports}})};
        },
        translateContent({content, translationFiles}) {
            // Docusaurus's native translateLoadedContent returns only versions.
            return {...plugin.translateContent({content, translationFiles}), translationManifest: content.translationManifest, contentIdentity: content.contentIdentity};
        },
        async contentLoaded(args) {
            await plugin.contentLoaded(args);
            sourceAliases.clear();
            if (activeLocale) {
                for (const version of args.content.loadedVersions) {
                    for (const doc of version.docs) {
                        const state = doc.translation;
                        const viewPath = path.join(viewPluginDir(activeLocale), path.relative(originalPluginDir(activeLocale), path.join(context.siteDir, state.targetPath)));
                        for (const filename of [state.englishPath, state.sourcePath, state.targetPath, relative(context.siteDir, viewPath)]) {
                            sourceAliases.set(aliasedSitePath(path.join(context.siteDir, filename), context.siteDir), doc.permalink);
                        }
                    }
                }
            }
        },
        configureWebpack(...args) {
            const result = plugin.configureWebpack(...args);
            if (activeLocale) {
                // Native MDX cache keys cannot see a changed counterpart route
                // or state file read through fs. Bind the localized filesystem
                // cache to this exact content/route decision snapshot.
                if (args[0]?.cache?.type === 'filesystem') result.cache = {...args[0].cache,
                    version: `${args[0].cache.version}:translations:${hash(JSON.stringify(pages))}`};
                for (const rule of result.module.rules) {
                    for (const item of rule.use) {
                        if (adaptedLoaders.has(item.options)) continue;
                        adaptedLoaders.add(item.options);
                        const nativeResolve = item.options.resolveMarkdownLink;
                        // Native initialization captures the resolver in its
                        // processors. Recreate them with the adapted resolver.
                        delete item.options.processors;
                        item.options.resolveMarkdownLink = params => {
                            const version = versions[activeLocale].find(candidate => [candidate.contentPath, path.join(viewPluginDir(activeLocale),
                                candidate.versionName === 'current' ? 'current' : `version-${candidate.versionName}`)]
                                .some(dir => params.sourceFilePath.startsWith(dir + path.sep)));
                            return version && resolveMarkdownLinkPathname(params.linkPathname, {...params, siteDir: context.siteDir,
                                sourceToPermalink: sourceAliases, contentPaths: {...version, contentPathLocalized: path.join(viewPluginDir(activeLocale),
                                    version.versionName === 'current' ? 'current' : `version-${version.versionName}`)}}) || nativeResolve(params);
                        };
                    }
                }
            }
            return result;
        },
    };
};
module.exports.validateOptions = native.validateOptions;
// Allows offline inventory tools to select these configured plugin instances.
module.exports.isTranslationDocsPlugin = true;
