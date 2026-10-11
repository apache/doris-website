const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = function translationStatusPlugin(context) {
    return {name: 'doris-translation-status',
        async allContentLoaded({allContent, actions}) {
            const manifests = Object.values(allContent['docusaurus-plugin-content-docs'] ?? {})
                .map(content => content.translationManifest).filter(Boolean);
            const pages = manifests.flatMap(manifest => manifest.pages);
            // Only current translations need a cross-locale route group in the
            // browser. Missing/stale pages use the existing en/zh behavior with
            // ja removed; their detailed status lives in the doc's own metadata.
            const alternates = {};
            for (const page of pages) {
                if (page.alternates.ja) {
                    for (const permalink of Object.values(page.alternates)) alternates[permalink] = page.alternates;
                }
            }
            const prefixes = Object.values(allContent['docusaurus-plugin-content-docs'] ?? {})
                .flatMap(content => content.loadedVersions.map(version => version.path));
            actions.setGlobalData({alternates, prefixes});
            const output = path.join(context.siteDir, '.i18n-build/manifests', `${context.i18n.currentLocale}.json`);
            await fs.mkdir(path.dirname(output), {recursive: true});
            await fs.writeFile(output, JSON.stringify({schemaVersion: 1, locale: context.i18n.currentLocale,
                pages, reports: manifests.flatMap(manifest => manifest.reports)}, null, 2) + '\n');
        },
    };
};
