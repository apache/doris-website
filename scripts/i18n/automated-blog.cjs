// Blog automation uses the existing per-page automation ledger and write guards.
// Legacy manual blog shards remain archival/manual inputs, never a second bot ledger.
const fs = require('node:fs'),
    path = require('node:path'),
    assert = require('node:assert/strict');
const { hash, identity, loadConfig, loadRecords, stateFileFor, decide } = require('./state.cjs');
const { releasePolicy, loadBaseline } = require('./release-policy.cjs');
const group = {
    id: 'BLOG',
    pluginId: 'blog',
    version: 'current',
    kind: 'blog',
    sourceRoot: 'blog',
    routeBasePath: '/blog',
    sourcePolicy: { mode: 'new-only', baseline: 'translations/blog-baseline.json' },
};
function validateSettings(root, baseline) {
    assert(
        Array.isArray(baseline.locales) &&
            new Set(baseline.locales).size === baseline.locales.length &&
            baseline.locales.every(l => Object.hasOwn(loadConfig(root).locales, l)),
        'Invalid blog automation locales',
    );
    const supported = require('../../config/i18n').localeRegistry.map(l => l.code);
    assert(
        Array.isArray(baseline.historicalFallbackLocales) &&
            new Set(baseline.historicalFallbackLocales).size === baseline.historicalFallbackLocales.length &&
            baseline.historicalFallbackLocales.every(l => l !== 'en' && supported.includes(l)) &&
            baseline.locales.every(l => baseline.historicalFallbackLocales.includes(l)),
        'Invalid historical blog fallback locales',
    );
}
function policy(root) {
    if (!fs.existsSync(path.join(root, group.sourcePolicy.baseline))) return null;
    const baseline = loadBaseline(root, group).data;
    validateSettings(root, baseline);
    return { data: baseline, history: releasePolicy(root, group) };
}
function pageFor(file, locale, source) {
    return {
        pluginId: 'blog',
        version: 'current',
        docId: file,
        locale,
        sourceLocale: 'en',
        sourcePath: 'blog/' + file,
        englishPath: 'blog/' + file,
        targetPath: `i18n/${locale}/docusaurus-plugin-content-blog/${file}`,
        sourceHash: hash(source),
    };
}
async function decision(root, locale, file, selected = policy(root), records) {
    if (!selected || !selected.data.historicalFallbackLocales.includes(locale)) return null;
    const source = fs.readFileSync(path.join(root, 'blog', file), 'utf8'),
        page = pageFor(file, locale, source),
        eligibility = selected.history.classify(page);
    let record, automatic;
    if (eligibility.kind !== 'eligible')
        automatic = {
            ...page,
            status: eligibility.kind,
            useTarget: false,
            indexable: false,
            contentLocale: 'en',
            sourceHash: hash(source),
            targetHash: null,
            reviewStatus: 'unverified',
        };
    else {
        if (!selected.data.locales.includes(locale)) return null;
        record = (records ?? loadRecords(root, locale)).get(identity(page));
        const targetFile = path.join(root, page.targetPath),
            target = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : undefined;
        automatic = decide({
            page,
            source,
            target,
            record,
            technicalHash:
                target === undefined
                    ? undefined
                    : (await require('./structure.cjs').structure(source, path.extname(file))).technicalHash,
        });
    }
    return {
        ...automatic,
        eligibility,
        state: automatic.status === 'current' ? 'ready' : automatic.status,
        fallback: !automatic.useTarget,
        updatePolicy: 'automatic-blog',
        statePath: stateFileFor(page),
    };
}
async function collect(root, locale) {
    const file = path.join(root, `translations/scope/${locale}.json`);
    if (!fs.existsSync(file) || !JSON.parse(fs.readFileSync(file)).groups.some(g => g.kind === 'blog'))
        return { pages: [], reports: [], versions: [] };
    const inventory = await require('./blog-inventory.cjs').collect(root);
    const pages = [],
        reports = [];
    for (const instance of inventory.instances.filter(i => i.pluginId === 'default')) {
        const sources = new Map(instance.posts.map(p => [p.contentId, p]));
        for (const entry of instance.contentIdentity.entries.filter(
            e => e.kind === 'blog' && !e.aggregate && e.siteLocale === locale,
        )) {
            assert(entry.automation, 'Missing native blog automation decision');
            pages.push({
                ...entry.automation,
                permalink: entry.route,
                englishPermalink: entry.englishRoute,
                sourcePermalink: entry.englishRoute,
                draft: !!sources.get(entry.contentId)?.frontMatter.draft,
                unlisted: !!sources.get(entry.contentId)?.unlisted,
            });
        }
        reports.push(...instance.reports.filter(r => !r.locale || r.locale === locale));
    }
    return { pages, reports, versions: [{ pluginId: 'blog', version: 'current', order: new Map() }] };
}
function excluded(root, locale, file, selected = policy(root)) {
    if (!selected || !selected.data.historicalFallbackLocales.includes(locale)) return false;
    const sourcePath = 'blog/' + file,
        full = path.join(root, sourcePath);
    const entry = {
        pluginId: 'blog',
        version: 'current',
        docId: file,
        sourcePath,
        sourceHash: fs.existsSync(full) ? hash(fs.readFileSync(full, 'utf8')) : '',
    };
    return selected.history.classify(entry).kind !== 'eligible';
}
function publication(value) {
    return Object.fromEntries(
        ['state', 'sourceHash', 'targetHash', 'contentLocale', 'fallback', 'indexable', 'reviewStatus', 'translatedAt']
            .filter(key => Object.hasOwn(value, key))
            .map(key => [key, value[key]]),
    );
}
function reader(root) {
    const selected = policy(root),
        records = new Map(),
        results = new Map();
    return (locale, file) => {
        const key = locale + '\0' + file;
        if (!results.has(key)) {
            const source = fs.readFileSync(path.join(root, 'blog', file), 'utf8');
            const eligible =
                selected?.data.locales.includes(locale) &&
                selected.history.classify(pageFor(file, locale, source)).kind === 'eligible';
            if (eligible && !records.has(locale)) records.set(locale, loadRecords(root, locale));
            results.set(key, decision(root, locale, file, selected, records.get(locale)));
        }
        return results.get(key);
    };
}
module.exports = { group, policy, validateSettings, pageFor, decision, collect, reader, publication, excluded };
