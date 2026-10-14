const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = function translationStatusPlugin(context) {
    const locale = context.i18n.currentLocale;
    return {name: 'doris-translation-status',
        async allContentLoaded({allContent, actions}) {
            const manifests = Object.values(allContent['docusaurus-plugin-content-docs'] ?? {})
                .map(content => content.translationManifest).filter(Boolean);
            // Every managed locale computes its pages in the same build. The
            // route groups need all of them: an English page must advertise the
            // localized alternate just as the localized page advertises English.
            const allPages = manifests.flatMap(manifest => manifest.pages);
            // Only current translations need a cross-locale route group in the
            // browser. Missing/stale pages use the existing en/zh behavior with
            // this locale removed; their detailed status lives in the doc's own
            // metadata.
            const alternates = {};
            for (const page of allPages) {
                if (page.alternates[page.locale]) {
                    for (const permalink of Object.values(page.alternates)) alternates[permalink] = page.alternates;
                }
            }
            // The manifest describes one locale, so it carries only its pages.
            const pages = allPages.filter(page => page.locale === locale);
            const prefixes = Object.values(allContent['docusaurus-plugin-content-docs'] ?? {})
                .flatMap(content => content.loadedVersions.map(version => version.path));
            actions.setGlobalData({alternates, prefixes});
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
