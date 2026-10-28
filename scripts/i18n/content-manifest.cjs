// Build-only contract. Keep source hashes, ownership and reports out of browser data.
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {hash} = require('./state.cjs');
const schemaVersion = 1;
const docsId = ({pluginId, version, docId}) => `docs:${JSON.stringify([pluginId, version, docId])}`;
const key = entry => JSON.stringify([entry.contentId, entry.siteLocale]);
const isRoute = route => typeof route === 'string' && route.startsWith('/') && !route.startsWith('//') && !/[?#]/.test(route);

function sourceSha(root) {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
    assert(/^[a-f0-9]{40}$/.test(sha), 'Manifest requires a Git source SHA');
    return sha;
}

// Automatic docs state has already made the hash/technical/ownership decision.
// This adapter never reclassifies stale_prose, human protection, or conflicts.
function adaptDoc(page) {
    return {contentId: docsId(page), kind: 'docs', renderIntegrated: true, pluginId: page.pluginId, version: page.version, docId: page.docId,
        siteLocale: page.locale, contentLocale: page.contentLocale, state: page.status,
        route: page.permalink, englishRoute: page.englishPermalink, fallback: !page.useTarget,
        indexable: page.indexable, sourceHash: page.sourceHash, targetHash: page.targetHash,
        englishPath: page.englishPath, sourcePath: page.sourcePath, targetPath: page.targetPath,
        sourceLocale: page.sourceLocale, reviewStatus: page.reviewStatus, updatePolicy: 'automatic-docs'};
}

function buildManifest({sourceSha: sha, locale, enabledLocales, entries, reports = []}) {
    assert(enabledLocales.includes('en') && enabledLocales.includes(locale), 'English and current locale must be enabled');
    const selected = entries.filter(entry => enabledLocales.includes(entry.siteLocale));
    const seen = new Set(), routes = new Set(), groups = new Map();
    for (const entry of selected) {
        assert(!seen.has(key(entry)), `Duplicate content identity: ${key(entry)}`);
        assert(!routes.has(entry.siteLocale + ':' + entry.route), `Duplicate content route: ${entry.route}`);
        seen.add(key(entry)); routes.add(entry.siteLocale + ':' + entry.route);
        if (!groups.has(entry.contentId)) groups.set(entry.contentId, []);
        groups.get(entry.contentId).push(entry);
    }
    const pages = [];
    for (const group of groups.values()) {
        const english = group.find(entry => entry.siteLocale === 'en');
        if (!english) {
            reports.push({kind: 'missing_english_identity', contentId: group[0].contentId});
            continue;
        }
        const navigationRoutes = Object.fromEntries(group.map(entry => [entry.siteLocale, entry.route]));
        const availableTranslations = group.filter(entry => entry.indexable && !entry.fallback).map(entry => entry.siteLocale);
        for (const entry of group.filter(item => item.siteLocale === locale)) {
            assert(entry.englishRoute === english.route, `English route mismatch: ${entry.contentId}`);
            pages.push({...entry, sourceSha: sha, navigationRoutes, availableTranslations});
        }
    }
    pages.sort((a, b) => a.contentId.localeCompare(b.contentId));
    const manifest = {schemaVersion, sourceSha: sha, locale, enabledLocales, pages,
        reports: reports.filter(report => !report.locale || enabledLocales.includes(report.locale))};
    manifest.snapshotHash = hash(JSON.stringify({pages, reports: manifest.reports}));
    validateManifest(manifest);
    return manifest;
}

function validateManifest(manifest) {
    assert(manifest.schemaVersion === schemaVersion && /^[a-f0-9]{40}$/.test(manifest.sourceSha), 'Invalid manifest version/source SHA');
    assert(new Set(manifest.enabledLocales).size === manifest.enabledLocales.length && manifest.enabledLocales.includes(manifest.locale), 'Invalid enabled locales');
    const ids = new Set();
    for (const page of manifest.pages) {
        assert(['docs', 'page', 'blog', 'utility'].includes(page.kind) && page.contentId && !ids.has(page.contentId), 'Invalid/duplicate content identity');
        ids.add(page.contentId);
        assert(page.siteLocale === manifest.locale && page.sourceSha === manifest.sourceSha, 'Mixed source/locale manifest');
        assert(isRoute(page.route) && isRoute(page.englishRoute), 'Invalid native route');
        assert(typeof page.state === 'string' && typeof page.indexable === 'boolean' && typeof page.fallback === 'boolean' && typeof page.renderIntegrated === 'boolean', 'Invalid content decision');
        assert(manifest.enabledLocales.includes(page.contentLocale) && (page.fallback ? page.contentLocale === 'en' && !page.indexable : page.contentLocale === page.siteLocale), 'Invalid fallback decision');
        assert(page.kind !== 'utility' || !page.indexable, 'Utility must not be indexed');
        assert(['automatic-docs', 'automatic-blog', 'native-manual-docs', 'manual'].includes(page.updatePolicy), 'Invalid update policy');
        assert(Object.entries(page.navigationRoutes).every(([locale, route]) => manifest.enabledLocales.includes(locale) && isRoute(route)), 'Disabled/invalid navigation route');
        assert(page.navigationRoutes[page.siteLocale] === page.route && page.navigationRoutes.en === page.englishRoute, 'Missing self/English navigation route');
        assert(new Set(page.availableTranslations).size === page.availableTranslations.length && page.availableTranslations.every(locale => page.navigationRoutes[locale]), 'Invalid available translations');
        assert(page.availableTranslations.includes(page.siteLocale) === (page.indexable && !page.fallback), 'Fallback advertised as a translation');
    }
    return manifest;
}

// Consumers request one content identity; the full registry never enters globalData.
function routeData(page) {
    // Build identity stays in the full manifest. Unchanged browser routing data
    // must keep stable bytes across source commits for content-addressed caches.
    return {schemaVersion, contentId: page.contentId, kind: page.kind,
        siteLocale: page.siteLocale, contentLocale: page.contentLocale, fallback: page.fallback, renderIntegrated: page.renderIntegrated,
        indexable: page.indexable, ...(page.aggregate && {aggregate: true}),
        navigationRoutes: page.navigationRoutes, availableTranslations: page.availableTranslations};
}
module.exports = {schemaVersion, docsId, sourceSha, adaptDoc, buildManifest, validateManifest, routeData};
