const fs = require('node:fs/promises');
const path = require('node:path');
const {managedLocales} = require('./state.cjs');
const {mergeAlternates} = require('./alternates.cjs');

module.exports = function translationStatusPlugin(context) {
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
            actions.setGlobalData({alternates, prefixes, locales});
            // Reports that belong to no single locale describe the repository,
            // so they stay in every locale's manifest.
            const reports = manifests.flatMap(manifest => manifest.reports)
                .filter(report => !report.locale || report.locale === locale);
            const output = path.join(context.siteDir, '.i18n-build/manifests', `${locale}.json`);
            await fs.mkdir(path.dirname(output), {recursive: true});
            await fs.writeFile(output, JSON.stringify({schemaVersion: 1, locale,
                pages, reports}, null, 2) + '\n');
        },
    };
};
