// Manual content never enters the model translation queue. Validate declared
// publication inputs and report drift without changing the publication decision.
const fs = require('node:fs');
const path = require('node:path');
const {readJson, loadManual, decideManual, digestFiles} = require('./manual-state.cjs');
const {bodyDependencies, validateMessages} = require('./page-body.cjs');
const {locales} = require('../../config/i18n');
function manualReport(root) {
    const registry = readJson(root, 'translations/pages/registry.json', {schemaVersion: 1, pages: []});
    if (registry.schemaVersion !== 1 || !Array.isArray(registry.pages)) throw new Error('Invalid page registry');
    const records = loadManual(root, 'pages'), blogs = loadManual(root, 'blog');
    const pages = [];
    for (const registration of registry.pages) {
        const contentId = `${registration.kind}:${registration.id}`;
        const dependencies = bodyDependencies(root, registration.sourcePath);
        for (const locale of locales.filter(locale => locale !== 'en')) {
            const record = records.find(row => row.contentId === contentId && row.locale === locale);
            if (record && ['ready', 'needs-update'].includes(record.state)) {
                validateMessages(root, registration, locale);
                for (const file of dependencies.files) if (!record.sourceFiles.includes(file)) throw new Error(`Untracked body dependency: ${contentId}/${locale}/${file}`);
            }
            pages.push({contentId, locale, kind: registration.kind,
                ...decideManual({root, record, sourceFiles: dependencies.files}),
                action: 'manual', publishedSourceHash: record?.sourceHash ?? null});
        }
    }
    for (const record of records.filter(row => !registry.pages.some(page => `${page.kind}:${page.id}` === row.contentId)))
        pages.push({contentId: record.contentId, locale: record.locale, exception: 'source_deleted', action: 'manual'});
    for (const record of blogs) pages.push({contentId: record.contentId, locale: record.locale, kind: 'blog',
        ...decideManual({root, record, sourceFiles: record.sourceFiles}), action: 'manual', publishedSourceHash: record.sourceHash ?? null});
    const shared = readJson(root, 'translations/shared/registry.json', null);
    let sharedUi = null;
    if (shared) {
        const liveMessages = new Map();
        for (const entry of shared.entryFiles ?? [])
            bodyDependencies(root, entry, {shared: true}).messages.forEach((source, id) => liveMessages.set(id, source));
        const requiredMessages = {...shared.messages, ...Object.fromEntries(liveMessages)};
        for (const locale of locales.filter(locale => locale !== 'en')) {
            const dictionary = readJson(root, `i18n/${locale}/code.json`, {});
            for (const [id, source] of Object.entries(requiredMessages)) {
                const target = dictionary[id]?.message;
                const placeholders = text => [...new Set([...text.matchAll(/\{\w+\}/g)].map(m => m[0]))].sort().join();
                if (typeof target !== 'string' || !target.trim() || placeholders(source) !== placeholders(target))
                    throw new Error(`Incomplete shared message: ${locale}/${id}`);
            }
        }
        const sourceHash = digestFiles(root, shared.sourceFiles);
        sharedUi = {sourceHash, publishedSourceHash: shared.sourceHash, state: sourceHash === shared.sourceHash ? 'ready' : 'needs-update',
            locales: locales.filter(locale => locale !== 'en'), messageIds: Object.keys(shared.messages), action: 'manual'};
    }
    return {schemaVersion: 1, scope: 'declared manual dependencies; native route coverage is reported after build', pages, sharedUi,
        pending: pages.filter(page => page.state === 'needs-update' || page.exception), automaticTranslation: false};
}
function coverage(manifests, {partial = false} = {}) {
    const identities = new Map(), groups = new Map(), exceptions = [];
    const sourceGroups = new Map();
    for (const manifest of manifests) for (const page of manifest.pages) {
        if (page.siteLocale !== 'en' || page.kind === 'utility') continue;
        const key = JSON.stringify([page.kind, page.pluginId ?? 'default', page.version ?? 'unversioned']);
        if (!sourceGroups.has(key)) sourceGroups.set(key, new Set());
        sourceGroups.get(key).add(page.contentId);
    }
    const sources = new Set(manifests.map(m => m.sourceSha));
    if (sources.size > 1) throw new Error('Mixed source snapshots in coverage report');
    for (const manifest of manifests) {
        exceptions.push(...(manifest.reports ?? []).map(report => ({...report, manifestLocale: manifest.locale})));
        for (const page of manifest.pages) {
            if (page.kind === 'utility') {exceptions.push({kind: 'utility_excluded', locale: page.siteLocale, contentId: page.contentId}); continue;}
            const family = [page.kind, page.pluginId ?? 'default', page.version ?? 'unversioned'];
            const key = JSON.stringify([page.siteLocale, ...family]);
            if (!groups.has(key)) groups.set(key, {locale: page.siteLocale, family: family[0], pluginId: family[1], version: family[2],
                denominator: 0, routes: 0, realTranslations: 0, englishSource: 0, englishFallback: 0, needsUpdate: 0, blocked: 0});
            const identity = JSON.stringify([page.siteLocale, page.contentId]);
            if (identities.has(identity)) throw new Error(`Duplicate coverage identity: ${identity}`);
            identities.set(identity, page);
            const row = groups.get(key); row.denominator++; row.routes++;
            if (page.fallback) row.englishFallback++;
            else if (page.siteLocale === 'en') row.englishSource++;
            else row.realTranslations++;
            if (['needs-update', 'stale_prose'].includes(page.state)) row.needsUpdate++;
            if (page.state === 'blocked') row.blocked++;
        }
    }
    for (const row of groups.values()) {
        const denominator = sourceGroups.get(JSON.stringify([row.family, row.pluginId, row.version]))?.size ?? row.denominator;
        row.denominator = denominator; row.missingRoutes = Math.max(0, denominator - row.routes);
    }
    return {schemaVersion: 1, sourceSha: [...sources][0], partialCompilation: partial,
        coverageBasis: 'native manifest decisions, not compiled-page count or public deployment',
        groups: [...groups.values()], exceptions,
        pending: [...identities.values()].filter(page => ['needs-update', 'stale_prose', 'blocked'].includes(page.state))
            .map(({contentId, siteLocale, kind, version, route, state, updatePolicy}) => ({contentId, locale: siteLocale, kind, version, route, state, updatePolicy}))};
}
if (require.main === module) {
    const root = process.cwd(), args = process.argv.slice(2), native = args.includes('--coverage');
    let report;
    if (native) {
        const dir = path.join(root, '.i18n-build/content-manifests');
        const manifests = fs.readdirSync(dir).filter(file => /^(en|zh-CN|ja|ko|ru)\.json$/.test(file)).map(file => readJson(dir, file));
        if (!manifests.length) throw new Error('Native coverage manifests missing');
        const plan = readJson(root, '.i18n-build/ci-plan.json', null);
        report = coverage(manifests, {partial: plan ? plan.mode !== 'full' : false});
    } else report = manualReport(root);
    report.source = {sha: require('./content-manifest.cjs').sourceSha(root),
        trackedDiffHash: require('node:crypto').createHash('sha256').update(require('node:child_process').execFileSync('git', ['diff', 'HEAD', '--binary'], {cwd: root, maxBuffer: 16 * 1024 * 1024})).digest('hex')};
    fs.mkdirSync(path.join(root, '.i18n-build'), {recursive: true});
    fs.writeFileSync(path.join(root, `.i18n-build/${native ? 'coverage' : 'manual-drift'}.json`), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(native ? report.groups : {pages: report.pages.length, pending: report.pending.length, sharedUi: report.sharedUi?.state}));
}
module.exports = {manualReport, coverage};
