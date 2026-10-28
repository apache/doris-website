// Translation state is an automation ledger. A contributor can edit just the
// target: Git supplies the source revisions acknowledged by that target edit.
// Only changes to the corresponding English/Chinese inputs permit regeneration.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const marker = Symbol.for('doris.source-revision-policy');
const files = new Map(),
    trees = new Map(),
    roots = new Map(),
    targetCommits = new Map(),
    scopes = new Map(),
    commitDates = new Map();
const normalize = value => value.replace(/\r\n/g, '\n');
const hash = value => createHash('sha256').update(normalize(value)).digest('hex');
const blob = value => {
    const bytes = Buffer.from(normalize(value));
    return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
};
const git = (root, args) =>
    execFileSync('git', args, {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
const safe = file =>
    typeof file === 'string' &&
    !path.isAbsolute(file) &&
    !/[\\\x00-\x1f\x7f]/.test(file) &&
    file.split('/').every(p => p && p !== '.' && p !== '..');
function enabled(root) {
    const file = path.join(root, 'translations/config.json');
    return fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf8')).maintenancePolicy === 'source-revisions-v1';
}
function pathsFor(root, record) {
    const file = path.join(root, `translations/scope/${record.locale}.json`);
    if (!fs.existsSync(file)) return null;
    const stat = fs.statSync(file, { bigint: true }),
        stamp = String(stat.mtimeNs) + ':' + stat.size;
    if (scopes.get(file)?.stamp !== stamp) scopes.set(file, { stamp, data: JSON.parse(fs.readFileSync(file, 'utf8')) });
    const group = scopes
        .get(file)
        .data.groups.find(
            g => g.pluginId === record.pluginId && g.version === record.version && (!g.kind || g.kind === 'blog'),
        );
    if (!group || !safe(record.sourcePath) || !safe(record.targetPath)) return null;
    const prefix = `i18n/${record.locale}/`;
    if (!record.targetPath.startsWith(prefix)) return null;
    const chinese = 'i18n/zh-CN/' + record.targetPath.slice(prefix.length);
    const suffix =
        group.kind === 'blog'
            ? record.targetPath.split('/docusaurus-plugin-content-blog/')[1]
            : record.targetPath.split(`/${group.version === 'current' ? 'current' : 'version-' + group.version}/`)[1];
    if (!suffix || !safe(suffix)) return null;
    return { en: group.sourceRoot + '/' + suffix, 'zh-CN': chinese };
}
function working(root, file) {
    try {
        const full = path.join(root, file),
            stat = fs.statSync(full, { bigint: true });
        const stamp = `${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;
        if (files.get(full)?.stamp !== stamp) {
            const content = fs.readFileSync(full, 'utf8');
            files.set(full, { stamp, hash: hash(content), blob: blob(content) });
        }
        return files.get(full);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}
function blobAt(root, ref, file) {
    assert(safe(file), 'Invalid source revision path');
    const dir = file.startsWith('i18n/') ? file.split('/').slice(0, 2).join('/') : file.split('/')[0];
    const key = JSON.stringify([root, ref, dir]);
    if (!roots.has(key)) {
        const entry = git(root, ['ls-tree', '-z', ref, '--', dir]).split('\0').filter(Boolean)[0];
        roots.set(key, entry ? entry.split('\t')[0].split(' ')[2] : null);
    }
    const tree = roots.get(key);
    if (!tree) return null;
    if (!trees.has(root + '\0' + tree)) {
        const entries = new Map(
            git(root, ['ls-tree', '-r', '-z', tree])
                .split('\0')
                .filter(Boolean)
                .map(row => {
                    const tab = row.indexOf('\t');
                    return [row.slice(tab + 1), row.slice(0, tab).split(' ')[2]];
                }),
        );
        trees.set(root + '\0' + tree, entries);
    }
    return trees.get(root + '\0' + tree).get(file.slice(dir.length + 1)) ?? null;
}
function snapshot(root, record, ref) {
    const paths = pathsFor(root, record);
    if (!paths) return null;
    return Object.fromEntries(
        Object.entries(paths).map(([locale, file]) => [locale, { path: file, blob: blobAt(root, ref, file) }]),
    );
}
function currentSnapshot(root, record) {
    const paths = pathsFor(root, record);
    return paths
        ? Object.fromEntries(
              Object.entries(paths).map(([lang, file]) => [
                  lang,
                  { path: file, blob: working(root, file)?.blob ?? null },
              ]),
          )
        : null;
}
const info = record => record?.[marker];
function hashesAt(root, ref, paths) {
    if (!paths.length) return new Map();
    const result = execFileSync('git', ['cat-file', '--batch'], {
        cwd: root,
        input: paths.map(p => ref + ':' + p).join('\n') + '\n',
        maxBuffer: 512 * 1024 * 1024,
    });
    let offset = 0;
    const data = new Map();
    for (const file of paths) {
        const end = result.indexOf(10, offset);
        assert(end >= 0, 'Truncated target snapshot');
        const header = result.toString('utf8', offset, end);
        offset = end + 1;
        if (header.endsWith(' missing')) {
            data.set(file, null);
            continue;
        }
        const match = /^([a-f0-9]{40}) blob (\d+)$/.exec(header);
        assert(match, 'Invalid target snapshot');
        const size = Number(match[2]);
        data.set(file, { blob: match[1], hash: hash(result.toString('utf8', offset, offset + size)) });
        offset += size + 1;
    }
    return data;
}
function hydrate(root, locale, records, { ref = 'HEAD', worktree = true } = {}) {
    if (!enabled(root)) return records;
    const head = git(root, ['rev-parse', `${ref}^{commit}`]).trim();
    const historical = worktree
        ? null
        : hashesAt(
              root,
              head,
              [...records.values()].filter(r => pathsFor(root, r)).map(r => r.targetPath),
          );
    const result = new Map();
    for (const [id, raw] of records) {
        const paths = pathsFor(root, raw);
        if (!paths) {
            result.set(id, raw);
            continue;
        }
        let record = { ...raw },
            control;
        try {
            const target = worktree ? working(root, raw.targetPath) : historical.get(raw.targetPath);
            const committedBlob =
                !worktree || target?.hash !== raw.targetHash
                    ? worktree
                        ? blobAt(root, head, raw.targetPath)
                        : (target?.blob ?? null)
                    : target.blob;
            const targetHash = target?.hash ?? null;
            let anchor = raw.sourceCommit,
                manual = false,
                preview = false;
            if (targetHash && targetHash !== raw.targetHash) {
                manual = true;
                preview = worktree && target.blob !== committedBlob;
                const key = JSON.stringify([root, head, raw.targetPath]);
                if (!preview && !targetCommits.has(key))
                    targetCommits.set(key, git(root, ['log', '-1', '--format=%H', head, '--', raw.targetPath]).trim());
                anchor = preview ? head : targetCommits.get(key);
                assert(/^[a-f0-9]{40}$/.test(anchor), 'Cannot establish the target revision');
                const primary = git(root, ['show', `${anchor}:${raw.sourcePath}`]);
                const dateKey = root + '\0' + anchor;
                if (!commitDates.has(dateKey))
                    commitDates.set(dateKey, git(root, ['show', '-s', '--format=%cI', anchor]).trim());
                record = {
                    ...record,
                    sourceCommit: anchor,
                    sourceHash: hash(primary),
                    targetHash,
                    reviewStatus: 'manual',
                    translatedAt: commitDates.get(dateKey),
                };
            }
            const baseline = snapshot(root, record, anchor);
            if (!manual && raw.sourceRevisions)
                assert.deepEqual(raw.sourceRevisions, baseline, 'Source revision ledger mismatch');
            const current = worktree ? currentSnapshot(root, record) : snapshot(root, record, head);
            const changed = Object.keys(paths).filter(lang => baseline[lang].blob !== current[lang].blob);
            control = { head, anchor, manual, preview, baseline, current, changed };
        } catch (error) {
            control = { error: error.message, changed: [] };
        }
        Object.defineProperty(record, marker, { value: control, enumerable: true });
        result.set(id, record);
    }
    return result;
}
function canGenerate(record) {
    if (!record) return true;
    const control = info(record);
    return control ? !control.error && !control.preview && control.changed.length > 0 : record.ownership === 'machine';
}
function resolveRecord(root, page, record, technicalHash, { ref = 'HEAD', worktree = true } = {}) {
    if (record || !enabled(root) || !pathsFor(root, page)) return record;
    const target = worktree
        ? working(root, page.targetPath)
        : hashesAt(root, ref, [page.targetPath]).get(page.targetPath);
    if (!target) return undefined;
    // A zero sentinel deliberately routes an unregistered committed body
    // through the same Git-derived manual-revision path as an edited target.
    const seed = {
        ...page,
        sourceLocale: page.sourceLocale ?? 'en',
        sourceCommit: git(root, ['rev-parse', `${ref}^{commit}`]).trim(),
        sourceHash: '0'.repeat(64),
        targetHash: '0'.repeat(64),
        sourceTechnicalHash: technicalHash ?? '0'.repeat(64),
        ownership: 'human',
        reviewStatus: 'manual',
        translatedAt: '1970-01-01T00:00:00Z',
        glossaryVersion: 'manual',
    };
    return hydrate(root, page.locale, new Map([['body', seed]]), { ref, worktree }).get('body');
}
function referenceSources(root, record) {
    const control = info(record);
    if (!enabled(root) || control?.error) return [];
    const paths = pathsFor(root, record);
    if (!paths) return [];
    const chinese = control?.current['zh-CN'] ?? { path: paths['zh-CN'], blob: working(root, paths['zh-CN'])?.blob };
    return chinese.blob
        ? [{ locale: 'zh-CN', path: chinese.path, content: fs.readFileSync(path.join(root, chinese.path), 'utf8') }]
        : [];
}
module.exports = {
    enabled,
    pathsFor,
    snapshot,
    currentSnapshot,
    hydrate,
    info,
    canGenerate,
    referenceSources,
    resolveRecord,
    blob,
};
