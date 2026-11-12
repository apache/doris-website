const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {checkChangedTranslations, needsNativeInventory} = require('../check-translations.cjs');
function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'admission-scope-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = (file, value) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), value);};
    write('translations/config.json', JSON.stringify({schemaVersion: 1, locales: {ja: {sourceLocale: 'en', sourceOverrides: [], languageName: 'Japanese', scriptPattern: '[日]'}}}));
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: 'pipe'}).trim();
    const commit = () => {git('add', '.'); git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'change');};
    git('init', '-q'); commit(); const base = git('rev-parse', 'HEAD');
    return {root, write, base, commit};
}

test('shared renderer and English source edits skip empty native admission without claiming freshness', async t => {
    const {root, write, base, commit} = fixture(t);
    write('src/utils/translation.ts', '// Shared implementation\n'); write('docs/topic.md', '# Updated English\n'); commit();
    const result = await checkChangedTranslations({root, base, locale: 'ja', collectPages: () => {throw Error('Unnecessary full inventory');}});
    assert.equal(result.checked, 0);
    assert.deepEqual(result.errors, []);
    assert.equal(result.inventorySkipped, true);
    assert.equal(result.freshness, null);
    assert.match(result.inventorySkipReason, /freshness was not scanned/);
});

test('edited translations still require native registration and cannot pass as an empty check', async t => {
    const {root, write, base, commit} = fixture(t);
    write('i18n/ja/docusaurus-plugin-content-docs/current/orphan.md', '# Unregistered target\n'); commit();
    let calls = 0;
    const result = await checkChangedTranslations({root, base, locale: 'ja', collectPages: async () => {calls++; return {pages: [], reports: []};}});
    assert.equal(calls, 1);
    assert.equal(result.inventorySkipped, false);
    assert(result.errors.some(error => /no registered source/.test(error.message)));
    assert(needsNativeInventory(['translations/state/ja/docs.json'], 'ja'));
    assert(needsNativeInventory(['translations/state/ja/pages/default/current/topic.json'], 'ja'));
    assert(needsNativeInventory(['i18n/ja/docusaurus-plugin-content-docs-course-ui/current/page.tsx'], 'ja'));
    assert(!needsNativeInventory(['i18n/ko/docusaurus-plugin-content-docs/current/topic.md'], 'ja'));
});

test('the empty-admission path still rejects invalid protection exceptions and unknown locales', async t => {
    const {root, write, base, commit} = fixture(t);
    write('translations/protection-exceptions/ja.json', JSON.stringify({schemaVersion: 1, pages: [{reason: 'invalid baseline'}]})); commit();
    await assert.rejects(checkChangedTranslations({root, base, locale: 'ja'}), /baseline commit/);
    await assert.rejects(checkChangedTranslations({root, base, locale: 'unconfigured'}), /Unconfigured/);
});
