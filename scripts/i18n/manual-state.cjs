const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {hash} = require('./state.cjs');
const safePath = value => typeof value === 'string' && value && !path.isAbsolute(value) && !value.split(/[\\/]/).includes('..');
function readJson(root, file, fallback) {
    const full = path.join(root, file);
    return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : fallback;
}
function loadManual(root, kind) {
    const data = readJson(root, `translations/${kind}/state.json`, {schemaVersion: 1, pages: []});
    assert(data.schemaVersion === 1 && Array.isArray(data.pages), `Invalid manual ${kind} state`);
    const seen = new Set();
    for (const page of data.pages) {
        const key = JSON.stringify([page.contentId, page.locale]);
        assert(page.contentId && page.locale !== 'en' && page.locale && !seen.has(key), 'Invalid/duplicate manual identity');
        assert(['missing', 'ready', 'needs-update', 'blocked'].includes(page.state), 'Invalid manual state');
        assert(Array.isArray(page.sourceFiles) && page.sourceFiles.length && page.sourceFiles.every(safePath), 'Manual source dependencies required');
        assert(Array.isArray(page.targetFiles) && page.targetFiles.every(safePath), 'Invalid manual target dependencies');
        if (['ready', 'needs-update'].includes(page.state)) {
            assert(page.targetFiles.length && /^[a-f0-9]{64}$/.test(page.sourceHash) && /^[a-f0-9]{64}$/.test(page.targetHash), 'Published manual content needs both digests');
            assert(['machine', 'human', 'unverified'].includes(page.reviewStatus), 'Manual review identity required');
        }
        seen.add(key);
    }
    return data.pages;
}
function englishFallbackLocales(registry) {
    const values = registry.englishFallbackLocales ?? [];
    const supported = require('../../config/i18n').localeRegistry.map(locale => locale.code);
    assert(Array.isArray(values) && new Set(values).size === values.length
        && values.every(locale => locale !== 'en' && supported.includes(locale)), 'Invalid English fallback locale policy');
    return values;
}
function digestFiles(root, files) {
    return hash(JSON.stringify([...new Set(files)].sort().map(file => {
        assert(safePath(file), `Invalid dependency: ${file}`);
        const bytes = fs.readFileSync(path.join(root, file));
        const text = /\.(?:mdx?|[cm]?[jt]sx?|json|css|scss|html?|svg|txt|ya?ml|csv|tsv|sql)$/i.test(file);
        return [file, text ? hash(bytes.toString('utf8')) : createHash('sha256').update(bytes).digest('hex')];
    })));
}
function decideManual({root, record, sourceFiles, targetFiles = []}) {
    // Keep explicitly declared inputs and discover additions at build time.
    // The published hash stays unchanged until a translation is reviewed.
    const sourceHash = digestFiles(root, [...(record?.sourceFiles ?? []), ...sourceFiles]);
    if (!record || ['missing', 'blocked'].includes(record.state)) return {state: record?.state ?? 'missing', sourceHash,
        targetHash: null, contentLocale: 'en', fallback: true, indexable: false, reviewStatus: record?.reviewStatus ?? 'unverified'};
    const targetHash = digestFiles(root, record.targetFiles ?? targetFiles);
    // A broken/edited target needs an explicit new publication decision. Do not
    // silently mask invalid translations with English during a release build.
    assert(record.targetHash === targetHash, `Manual target digest mismatch: ${record.contentId}/${record.locale}`);
    return {state: record.sourceHash === sourceHash ? record.state : 'needs-update', sourceHash, targetHash,
        contentLocale: record.locale, fallback: false, indexable: true, reviewStatus: record.reviewStatus};
}
module.exports = {readJson, loadManual, digestFiles, decideManual, englishFallbackLocales};
