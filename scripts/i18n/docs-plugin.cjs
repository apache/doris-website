const fs = require('node:fs/promises');
const path = require('node:path');
const native = require('@docusaurus/plugin-content-docs');
const {readVersionsMetadata} = require('@docusaurus/plugin-content-docs/lib/versions/index.js');
const {processDocMetadata} = require('@docusaurus/plugin-content-docs/lib/docs.js');
const {Globby, getPluginI18nPath, normalizeUrl, readLastUpdateData, aliasedSitePath, resolveMarkdownLinkPathname} = require('@docusaurus/utils');
const {applyTrailingSlash} = require('@docusaurus/utils-common');
const {hash, relative, identity, loadConfig, loadRecords, sourceLocaleFor, decide} = require('./state.cjs');
const {structure, alignHeadings} = require('./structure.cjs');

async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
async function read(file) { return await exists(file) ? fs.readFile(file, 'utf8') : undefined; }
function localizedContext(context, locale) {
    const defaultLocale = context.i18n.defaultLocale;
    const rootBaseUrl = context.i18n.currentLocale === defaultLocale ? context.baseUrl
        : context.baseUrl.replace(`/${context.i18n.currentLocale}/`, '/');
    const baseUrl = locale === context.i18n.currentLocale ? context.baseUrl
        : normalizeUrl([rootBaseUrl, locale === defaultLocale ? '' : locale, '/']);
    return {...context, baseUrl, localizationDir: path.join(context.siteDir, 'i18n', locale),
        i18n: {...context.i18n, currentLocale: locale}};
}

async function metadata(context, options, versionMetadata, source, filePath, content) {
    return processDocMetadata({context, options: {...options, showLastUpdateTime: false, showLastUpdateAuthor: false},
        versionMetadata, env: process.env.NODE_ENV, tagsFile: undefined,
        docFile: {source, content, filePath, contentPath: path.dirname(filePath)}});
}

// Keep the native plugin name, validation, route parser, links and sidebars.
// The adapter only changes its Japanese localization directory and adds state.
module.exports = async function translationDocsPlugin(context, options) {
    const settings = context.i18n.locales.includes('ja') ? loadConfig(context.siteDir).locales.ja : undefined;
    if (!settings) return native.default(context, options);
    const locale = 'ja';
    const records = loadRecords(context.siteDir, locale);
    const contexts = Object.fromEntries(['en', 'zh-CN', locale].map(lang => [lang, localizedContext(context, lang)]));
    const versions = Object.fromEntries(await Promise.all(Object.entries(contexts).map(async ([lang, ctx]) =>
        [lang, await readVersionsMetadata({context: ctx, options})])));
    const viewRoot = path.join(context.siteDir, '.i18n-build', 'views', locale, options.id);
    const viewPluginDir = getPluginI18nPath({localizationDir: viewRoot, pluginName: 'docusaurus-plugin-content-docs', pluginId: options.id});
    const originalPluginDir = getPluginI18nPath({localizationDir: contexts.ja.localizationDir,
        pluginName: 'docusaurus-plugin-content-docs', pluginId: options.id});
    if (context.i18n.currentLocale === locale) {
        await fs.rm(viewPluginDir, {recursive: true, force: true});
        await fs.mkdir(viewPluginDir, {recursive: true});
        if (await exists(originalPluginDir)) await fs.cp(originalPluginDir, viewPluginDir, {recursive: true});
    }
    const pages = [];
    const reports = [];
    const route = permalink => applyTrailingSlash(permalink, {trailingSlash: context.siteConfig.trailingSlash, baseUrl: context.baseUrl});
    for (const [index, englishVersion] of versions.en.entries()) {
        const filenames = (await Globby(options.include, {cwd: englishVersion.contentPath, ignore: options.exclude})).sort();
        const registered = new Set(filenames);
        const seenIds = new Set();
        const versionDir = englishVersion.versionName === 'current' ? 'current' : `version-${englishVersion.versionName}`;
        const targetDir = path.join(originalPluginDir, versionDir);
        for (const filename of filenames) {
            const englishFile = path.join(englishVersion.contentPath, filename);
            const englishContent = await fs.readFile(englishFile, 'utf8');
            const englishDoc = await metadata(contexts.en, options, englishVersion, filename, englishFile, englishContent);
            seenIds.add(englishDoc.id);
            const page = {pluginId: options.id, version: englishVersion.versionName, docId: englishDoc.id, locale};
            const requestedSourceLocale = sourceLocaleFor(settings, page);
            const chineseFile = path.join(versions['zh-CN'][index].contentPathLocalized, filename);
            const chineseContent = await read(chineseFile);
            const sourceLocale = requestedSourceLocale === 'zh-CN' && chineseContent !== undefined ? 'zh-CN' : 'en';
            const sourceFile = sourceLocale === 'en' ? englishFile : chineseFile;
            const source = sourceLocale === 'en' ? englishContent : chineseContent;
            const targetFile = path.join(targetDir, filename);
            const target = await read(targetFile);
            Object.assign(page, {sourceLocale, sourcePath: relative(context.siteDir, sourceFile),
                englishPath: relative(context.siteDir, englishFile), targetPath: relative(context.siteDir, targetFile)});
            const record = records.get(identity(page));
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
            const chineseDoc = await metadata(contexts['zh-CN'], options, versions['zh-CN'][index], filename,
                chineseContent === undefined ? englishFile : chineseFile, chineseContent ?? englishContent);
            const nativeSourceDoc = sourceLocale === 'en' ? englishDoc : chineseDoc;
            let localizedContent;
            if (state.useTarget) {
                const targetDoc = await metadata(contexts.ja, options, versions.ja[index], filename, targetFile, target).catch(() => null);
                if (!targetDoc || targetDoc.id !== englishDoc.id || targetDoc.slug !== englishDoc.slug || targetDoc.draft !== englishDoc.draft
                    || targetDoc.unlisted !== englishDoc.unlisted) {
                    state = {...state, status: 'state_conflict', useTarget: false, indexable: false, contentLocale: sourceLocale};
                } else {
                    try { localizedContent = await alignHeadings(sourceLocale === 'en' ? sourceStructure
                        : await structure(englishContent, path.extname(filename), maintainCase), target, path.extname(filename), maintainCase); }
                    catch { state = {...state, status: 'heading_conflict', useTarget: false, indexable: false, contentLocale: sourceLocale}; }
                }
            }
            // A Chinese source can supply content only for an English registered
            // node. Its routing metadata must still match that node.
            if (sourceLocale === 'zh-CN' && (chineseDoc.id !== englishDoc.id || chineseDoc.slug !== englishDoc.slug)) {
                state = {...state, status: 'source_route_conflict', useTarget: false, indexable: false, contentLocale: 'en'};
            }
            const selectedContent = state.useTarget ? localizedContent
                : state.contentLocale === 'zh-CN' ? chineseContent : englishContent;
            const japaneseDoc = await metadata(contexts.ja, options, versions.ja[index], filename, targetFile, selectedContent);
            const indexable = state.indexable && !japaneseDoc.draft && !japaneseDoc.unlisted && !versions.ja[index].noIndex;
            state = {...state, indexable, permalink: route(japaneseDoc.permalink), englishPermalink: route(englishDoc.permalink),
                sourcePermalink: route(nativeSourceDoc.permalink),
                alternates: {en: route(englishDoc.permalink), 'zh-CN': route(chineseDoc.permalink),
                    ...(indexable ? {ja: route(japaneseDoc.permalink)} : {})}};
            pages.push(state);
            if (context.i18n.currentLocale === locale) {
                const viewFile = path.join(viewPluginDir, versionDir, filename);
                if (state.useTarget || state.contentLocale === 'zh-CN') {
                    await fs.mkdir(path.dirname(viewFile), {recursive: true});
                    await fs.writeFile(viewFile, selectedContent);
                } else {
                    // Omitting it uses the native per-file English fallback.
                    await fs.rm(viewFile, {force: true});
                }
            }
        }
        for (const target of await Globby(options.include, {cwd: targetDir, ignore: options.exclude})) {
            if (!registered.has(target)) reports.push({kind: 'orphan_target', pluginId: options.id,
                version: englishVersion.versionName, targetPath: relative(context.siteDir, path.join(targetDir, target))});
        }
        for (const target of await Globby(options.include, {cwd: versions['zh-CN'][index].contentPathLocalized, ignore: options.exclude})) {
            if (!registered.has(target)) reports.push({kind: 'unsupported_source_route', pluginId: options.id,
                version: englishVersion.versionName, sourceLocale: 'zh-CN',
                sourcePath: relative(context.siteDir, path.join(versions['zh-CN'][index].contentPathLocalized, target))});
        }
        for (const record of records.values()) {
            if (record.pluginId === options.id && record.version === englishVersion.versionName && !seenIds.has(record.docId)) {
                reports.push({kind: 'source_deleted', ...record});
            }
        }
    }
    const pluginContext = context.i18n.currentLocale === locale ? {...context, localizationDir: viewRoot} : context;
    const plugin = await native.default(pluginContext, options);
    const byId = new Map(pages.map(page => [identity(page), page]));
    const sourceAliases = new Map();
    const adaptedLoaders = new WeakSet();
    let loaded = false;
    return {...plugin,
        getPathsToWatch() {
            return [...plugin.getPathsToWatch().filter(file => !file.startsWith(viewRoot)), `${originalPluginDir}/**/*`,
                path.join(context.siteDir, 'translations/**/*.json')];
        },
        async loadContent() {
            // A dev-server content reload must re-evaluate hashes and rebuild
            // the view, just like a new static build. Do not watch our own view.
            if (loaded) return (await translationDocsPlugin(context, options)).loadContent();
            loaded = true;
            const content = await plugin.loadContent();
            if (context.i18n.currentLocale === locale) {
                for (const version of content.loadedVersions) {
                    for (const doc of [...version.docs, ...version.drafts]) {
                        const state = byId.get(identity({pluginId: options.id, version: version.versionName, docId: doc.id, locale}));
                        if (!state || state.permalink !== route(doc.permalink)) throw new Error(`Translation view/metadata mismatch: ${doc.id}`);
                        doc.translation = state;
                        // A translation commit is not a technical update. Ask the
                        // same parser/map/git machinery about the actual source.
                        const sourceFile = path.join(context.siteDir, state.contentLocale === 'en' ? state.englishPath : state.sourcePath);
                        const parsed = await context.siteConfig.markdown.parseFrontMatter({filePath: sourceFile,
                            fileContent: await fs.readFile(sourceFile, 'utf8'),
                            defaultParseFrontMatter: require('@docusaurus/utils').DEFAULT_PARSE_FRONT_MATTER});
                        const lastUpdate = await readLastUpdateData(sourceFile, options, parsed.frontMatter.last_update);
                        doc.lastUpdatedAt = lastUpdate.lastUpdatedAt;
                        doc.lastUpdatedBy = lastUpdate.lastUpdatedBy;
                    }
                }
            }
            return {...content, translationManifest: {schemaVersion: 1, pluginId: options.id, locale: context.i18n.currentLocale, pages, reports}};
        },
        translateContent({content, translationFiles}) {
            // Docusaurus's native translateLoadedContent returns only versions.
            return {...plugin.translateContent({content, translationFiles}), translationManifest: content.translationManifest};
        },
        async contentLoaded(args) {
            await plugin.contentLoaded(args);
            sourceAliases.clear();
            if (context.i18n.currentLocale === locale) {
                for (const version of args.content.loadedVersions) {
                    for (const doc of version.docs) {
                        const state = doc.translation;
                        const viewPath = path.join(viewPluginDir, path.relative(originalPluginDir, path.join(context.siteDir, state.targetPath)));
                        for (const filename of [state.englishPath, state.sourcePath, state.targetPath, relative(context.siteDir, viewPath)]) {
                            sourceAliases.set(aliasedSitePath(path.join(context.siteDir, filename), context.siteDir), doc.permalink);
                        }
                    }
                }
            }
        },
        configureWebpack(...args) {
            const result = plugin.configureWebpack(...args);
            if (context.i18n.currentLocale === locale) {
                // Native MDX cache keys cannot see a changed counterpart route
                // or state file read through fs. Bind the Japanese filesystem
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
                            const version = versions.ja.find(candidate => [candidate.contentPath, path.join(viewPluginDir,
                                candidate.versionName === 'current' ? 'current' : `version-${candidate.versionName}`)]
                                .some(dir => params.sourceFilePath.startsWith(dir + path.sep)));
                            return version && resolveMarkdownLinkPathname(params.linkPathname, {...params, siteDir: context.siteDir,
                                sourceToPermalink: sourceAliases, contentPaths: {...version, contentPathLocalized: path.join(viewPluginDir,
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
