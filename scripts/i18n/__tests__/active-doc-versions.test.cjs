const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {activeDocVersions, assertDocVersionCoverage} = require('../active-doc-versions.cjs');

function fixture(t, versions = ['4.x', '3.x']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'active-doc-versions-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = values => fs.writeFileSync(path.join(root, 'versions.json'), JSON.stringify(values));
    write(versions);
    return {root, write};
}
const pages = versions => versions.map(version => ({kind: 'docs', pluginId: 'default', version}));

test('a complete artifact can omit archived 2.1 even when its source directory remains', t => {
    const {root} = fixture(t);
    fs.mkdirSync(path.join(root, 'versioned_docs/version-2.1'), {recursive: true});
    const versions = activeDocVersions(root);
    assert.deepEqual(versions, ['current', '4.x', '3.x']);
    for (const locale of ['en', 'zh-CN', 'ja', 'ko', 'ru'])
        assert.doesNotThrow(() => assertDocVersionCoverage(pages(versions), locale, versions));
});

test('missing active versions still fail and other plugins or pages cannot satisfy coverage', t => {
    const {root} = fixture(t);
    const versions = activeDocVersions(root);
    for (const missing of versions) {
        const incomplete = [...pages(versions.filter(version => version !== missing)),
            {kind: 'docs', pluginId: 'community', version: missing},
            {kind: 'page', pluginId: 'default', version: missing}];
        assert.throws(() => assertDocVersionCoverage(incomplete, 'en', versions),
            error => error.message === `Missing version: en/${missing}`);
    }
});

test('version lifecycle changes follow the authoritative config and reject malformed lists', t => {
    const {root, write} = fixture(t);
    write(['5.x', '4.x']);
    const versions = activeDocVersions(root);
    assert.deepEqual(versions, ['current', '5.x', '4.x']);
    assert.throws(() => assertDocVersionCoverage(pages(['current', '4.x', '3.x']), 'ja', versions), /Missing version: ja\/5.x/);
    assert.doesNotThrow(() => assertDocVersionCoverage(pages(versions), 'ja', versions));
    write([]);
    assert.deepEqual(activeDocVersions(root), ['current']);
    for (const invalid of [null, {}, ['4.x', '4.x'], ['current'], [''], [null]]) {
        write(invalid);
        assert.throws(() => activeDocVersions(root), /versions.json must contain unique released version names/);
    }
});
