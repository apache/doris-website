const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');

const hash = value => createHash('sha256').update(value.replace(/\r\n/g, '\n')).digest('hex');
const identity = ({pluginId, version, docId, locale}) => JSON.stringify([pluginId, version, docId, locale]);
const relative = (root, file) => path.relative(root, file).split(path.sep).join('/');

function readJson(file, fallback) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}

function loadConfig(root) {
    const config = readJson(path.join(root, 'translations/config.json'), {schemaVersion: 1, locales: {}});
    if (config.schemaVersion !== 1) throw new Error('Unsupported translation config schemaVersion');
    for (const [locale, settings] of Object.entries(config.locales)) {
        if (!/^[a-z]{2}(?:-[A-Za-z0-9]+)*$/.test(locale) || !['en', 'zh-CN'].includes(settings.sourceLocale)) {
            throw new Error(`Invalid translation locale/sourceLocale: ${locale}`);
        }
        if (!Array.isArray(settings.sourceOverrides)) throw new Error(`Missing sourceOverrides for ${locale}`);
        const keys = new Set();
        for (const override of settings.sourceOverrides) {
            const key = identity({...override, locale});
            if (keys.has(key) || !['en', 'zh-CN'].includes(override.sourceLocale)) {
                throw new Error(`Conflicting source override: ${key}`);
            }
            keys.add(key);
        }
    }
    return config;
}

const stateRoot = locale => `translations/state/${locale}`;
const shardRoot = locale => `${stateRoot(locale)}/pages`;
function stateFileFor(record) {
    const parts = [record.pluginId, record.version, ...record.docId.split('/')];
    if (parts.some(part => !part || part === '.' || part === '..' || /[\\/]/.test(part)))
        throw new Error(`Invalid translation state path: ${identity(record)}`);
    return `${shardRoot(record.locale)}/${record.pluginId}/${record.version}/${record.docId}.json`;
}
function listShardFiles(root, locale) {
    const base = path.join(root, shardRoot(locale));
    const files = [];
    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.isFile() && entry.name.endsWith('.json')) files.push(relative(root, full));
        }
    }
    walk(base);
    return files.sort();
}
function collectRecords(locale, data, shards) {
    if (data.schemaVersion !== 1 || !Array.isArray(data.pages)) throw new Error('Invalid translation state schema');
    const records = new Map();
    for (const record of data.pages) {
        const key = identity(record);
        if (record.locale !== locale || records.has(key)) throw new Error(`Duplicate or invalid translation identity: ${key}`);
        records.set(key, record);
    }
    const seenShards = new Set();
    for (const [file, raw] of shards) {
        const shard = JSON.parse(raw);
        const record = shard.page;
        if (shard.schemaVersion !== 1 || !record || record.locale !== locale
            || stateFileFor(record) !== file || seenShards.has(identity(record)))
            throw new Error(`Invalid or duplicate translation shard: ${file}`);
        seenShards.add(identity(record));
        records.set(identity(record), record); // A shard supersedes a legacy docs.json entry.
    }
    return records;
}
function loadRecords(root, locale) {
    const data = readJson(path.join(root, `${stateRoot(locale)}/docs.json`), {schemaVersion: 1, pages: []});
    const shards = listShardFiles(root, locale).map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]);
    return collectRecords(locale, data, shards);
}
function loadRecordsAt(root, locale, ref) {
    const read = file => {
        try {return execFileSync('git', ['show', `${ref}:${file}`],
            {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024});}
        catch {return null;}
    };
    const base = read(`${stateRoot(locale)}/docs.json`);
    const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, '--', shardRoot(locale)],
        {cwd: root, encoding: 'utf8'}).split('\n').filter(Boolean).sort();
    const shards = paths.map(file => [file, read(file)]);
    if (shards.some(([, raw]) => raw === null)) throw new Error('Committed translation shard is unreadable');
    return collectRecords(locale, base === null ? {schemaVersion: 1, pages: []} : JSON.parse(base), shards);
}

function sourceLocaleFor(settings, page) {
    return settings.sourceOverrides.find(override => identity({...override, locale: page.locale}) === identity(page))?.sourceLocale
        ?? settings.sourceLocale;
}

// Freshness, review identity, and ownership are independent. A prose exception
// requires a human decision bound to BOTH revisions and the unchanged target.
// Even that exception cannot authorize changes in protected technical content.
function decide({page, source, target, record, technicalHash}) {
    const sourceHash = hash(source);
    const targetHash = target === undefined ? null : hash(target);
    const result = (status, useTarget = false, indexable = false) => ({
        ...page, status, contentLocale: useTarget ? page.locale : 'en',
        useTarget, indexable, sourceHash, targetHash,
        reviewStatus: record?.reviewStatus ?? 'unverified',
        translatedAt: record?.translatedAt ?? null,
    });
    if (target === undefined) return result('untranslated');
    if (!record) return result('unverified');
    if (identity(record) !== identity(page) || record.sourcePath !== page.sourcePath
        || record.targetPath !== page.targetPath || record.sourceLocale !== page.sourceLocale
        || !/^[a-f0-9]{64}$/.test(record.sourceHash ?? '')
        || !/^[a-f0-9]{64}$/.test(record.sourceTechnicalHash ?? '')
        || !/^[a-f0-9]{64}$/.test(record.targetHash ?? '')
        || !['machine', 'human', 'unverified'].includes(record.reviewStatus)
        || !['machine', 'human'].includes(record.ownership)
        || typeof record.glossaryVersion !== 'string'
        || !/^[a-f0-9]{40}$/.test(record.sourceCommit ?? '')
        || !Number.isFinite(Date.parse(record.translatedAt))) return result('state_conflict');
    if (record.targetHash !== targetHash) return result('target_modified');
    if (record.sourceHash === sourceHash) return result('current', true, record.reviewStatus !== 'unverified');
    if (record.sourceTechnicalHash !== technicalHash) return result('stale_technical');
    const approval = record.safeSourceChange;
    if (approval?.kind === 'prose' && approval.fromSourceHash === record.sourceHash
        && approval.toSourceHash === sourceHash && approval.targetHash === targetHash
        && typeof approval.reviewedBy === 'string' && approval.reviewedBy.trim()
        && Number.isFinite(Date.parse(approval.reviewedAt))) return result('stale_prose', true);
    return result('stale_unknown');
}

module.exports = {hash, identity, relative, loadConfig, loadRecords, loadRecordsAt,
    stateFileFor, listShardFiles, sourceLocaleFor, decide};
