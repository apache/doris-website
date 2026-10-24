const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const {manualReport} = require('../manual-report.cjs');
const {digestFiles} = require('../manual-state.cjs');
test('manual admission preserves stale translated bodies and blocks damaged ready targets', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-drift-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = (file, value) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), typeof value === 'string' ? value : JSON.stringify(value));};
    const source = 'src/pages/sample.tsx', target = 'i18n/ja/code.json';
    write(source, "import {translate} from '@docusaurus/Translate'; export const title=translate({id:'sample.title', message:'Original title'});");
    write(target, {'sample.title': {message: '見出し'}});
    write('translations/pages/registry.json', {schemaVersion: 1, pages: [{id: 'sample', kind: 'page', sourcePath: source}]});
    write('translations/pages/state.json', {schemaVersion: 1, pages: [{contentId: 'page:sample', locale: 'ja', state: 'ready',
        sourceFiles: [source], targetFiles: [target], sourceHash: digestFiles(root, [source]), targetHash: digestFiles(root, [target]), reviewStatus: 'machine'}]});
    assert.equal(manualReport(root).pages.find(row => row.locale === 'ja').state, 'ready');
    write('translations/pages/registry.json', {schemaVersion: 1, englishFallbackLocales: ['ja'], pages: [{id: 'sample', kind: 'page', sourcePath: source}]});
    assert.throws(() => manualReport(root), /disabled by English fallback policy/);
    write('translations/pages/registry.json', {schemaVersion: 1, englishFallbackLocales: ['zh-CN'], pages: [{id: 'sample', kind: 'page', sourcePath: source}]});
    assert.equal(manualReport(root).pages.find(row => row.locale === 'zh-CN').intentionalEnglishFallback, true);
    write('static/declared-frame.html', '<html lang="en">Declared frame</html>');
    write('translations/pages/registry.json', {schemaVersion: 1, englishFallbackLocales: ['zh-CN'],
        pages: [{id: 'sample', kind: 'page', sourcePath: source, sourceFiles: [source, 'static/declared-frame.html']}]});
    assert.throws(() => manualReport(root), /Untracked body dependency/);
    write('translations/pages/registry.json', {schemaVersion: 1, englishFallbackLocales: ['zh-CN'], pages: [{id: 'sample', kind: 'page', sourcePath: source}]});
    fs.appendFileSync(path.join(root, source), '\n// A source revision.\n');
    const report = manualReport(root);
    assert.equal(report.pending.length, 1); assert.equal(report.pending[0].contentLocale, 'ja');
    assert.equal(report.pending[0].fallback, false); assert.equal(report.automaticTranslation, false);
    assert.equal(report.pages.filter(row => row.state === 'missing').length, 3);
    write(target, {}); assert.throws(() => manualReport(root), /Incomplete page messages/);
    write(target, {'sample.title': {message: 'Changed target'}}); assert.throws(() => manualReport(root), /digest mismatch/);
});
