const fs = require('node:fs/promises');
const path = require('node:path');
const {managedLocales} = require('./state.cjs');
const {mergeAlternates} = require('./alternates.cjs');
const {sourceSha, buildManifest, routeData} = require('./content-manifest.cjs');

module.exports = function translationStatusPlugin(context, {browserData = true} = {}) {
    const locale = context.i18n.currentLocale;
    // The browser needs to know which locales carry translation state, so the
    // UI can decide from data instead of naming a language.
    const locales = managedLocales(context.siteDir, context.i18n.locales);
    return {name: 'doris-translation-status',
        async allContentLoaded({allContent, actions}) {
            const manifests = Object.values(allContent['docusaurus-plugin-content-docs'] ?? {})
                .map(content => content.translationManifest).filter(Boolean);
            // Every managed locale computes its pages in the same build. The
            // route groups need all of them: an English page must advertise the
            // localized alternate just as the localized page advertises English.
            const allPages = manifests.flatMap(manifest => manifest.pages);
            mergeAlternates(allPages);
            // Keep translated groups and source routes that prefix replacement
            // cannot infer, including groups whose targets all fall back.
            const alternates = {};
            for (const page of allPages) {
                const sourceRoutesDiffer = page.alternates['zh-CN']?.replace('/zh-CN/', '/') !== page.englishPermalink;
                if (sourceRoutesDiffer || Object.keys(page.alternates).some(lang => !['en', 'zh-CN'].includes(lang))) {
                    for (const permalink of [page.permalink, ...Object.values(page.alternates)]) alternates[permalink] = page.alternates;
                }
            }
            // The manifest describes one locale, so it carries only its pages.
            const pages = allPages.filter(page => page.locale === locale);
            const prefixes = Object.values(allContent['docusaurus-plugin-content-docs'] ?? {})
                .flatMap(content => content.loadedVersions.map(version => version.path));
            // Use native page routes so ordinary-page fallback never captures
            // localized documentation, search, or other plugin-owned UI.
            const pageRoutes = [...new Set(Object.values(allContent['docusaurus-plugin-content-pages'] ?? {})
                .flatMap(content => content ?? []).map(page => page.permalink.replace(/\/$/, '') + '/'))];
            if (browserData) actions.setGlobalData({alternates, prefixes, locales, pageRoutes});
            const inputs = Object.values(allContent).flatMap(instances => Object.values(instances))
                .map(content => content?.contentIdentity).filter(Boolean);
            if (inputs.length) {
                const manifest = buildManifest({sourceSha: sourceSha(context.siteDir), locale,
                    enabledLocales: context.i18n.locales, entries: inputs.flatMap(input => input.entries),
                    reports: inputs.flatMap(input => input.reports)});
                const directory = path.join(context.siteDir, '.i18n-build/content-manifests');
                await fs.mkdir(directory, {recursive: true});
                const serialized = JSON.stringify(manifest, null, 2) + '\n';
                await fs.writeFile(path.join(directory, `${locale}.json`), serialized);
                // A separate per-page payload is available to T02/T03 consumers;
                // no full content registry or source digests are put in globalData.
                const sizes = manifest.pages.map(page => ({contentId: page.contentId,
                    bytes: Buffer.byteLength(JSON.stringify(routeData(page)))}));
                await fs.writeFile(path.join(directory, `${locale}.sizes.json`), JSON.stringify({
                    sourceSha: manifest.sourceSha, fullBytes: Buffer.byteLength(serialized), pages: sizes,
                    maxRouteBytes: Math.max(0, ...sizes.map(page => page.bytes)), clientGlobalBytesAdded: 0}, null, 2) + '\n');
            }
            // Reports that belong to no single locale describe the repository,
            // so they stay in every locale's manifest.
            const reports = manifests.flatMap(manifest => manifest.reports)
                .filter(report => !report.locale || report.locale === locale);
            const output = path.join(context.siteDir, '.i18n-build/manifests', `${locale}.json`);
            await fs.mkdir(path.dirname(output), {recursive: true});
            await fs.writeFile(output, JSON.stringify({schemaVersion: 1, locale,
                pages, pageRoutes, reports, translatedPagePaths: context.siteConfig?.customFields?.translatedPagePaths ?? {}}, null, 2) + '\n');
        },
    };
};
