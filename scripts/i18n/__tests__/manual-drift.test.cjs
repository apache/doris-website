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
    assert.equal(manualReport(root).pages.find(row => row.locale === 'ja').state, 'needs-update');
    write('translations/pages/registry.json', {schemaVersion: 1, englishFallbackLocales: ['zh-CN'], pages: [{id: 'sample', kind: 'page', sourcePath: source}]});
    fs.appendFileSync(path.join(root, source), '\n// A source revision.\n');
    const report = manualReport(root);
    assert.equal(report.pending.length, 1); assert.equal(report.pending[0].contentLocale, 'ja');
    assert.equal(report.pending[0].fallback, false); assert.equal(report.automaticTranslation, false);
    assert.equal(report.pages.filter(row => row.state === 'missing').length, 3);
    write(target, {}); assert.throws(() => manualReport(root), /Incomplete page messages/);
    write(target, {'sample.title': {message: 'Changed target'}}); assert.throws(() => manualReport(root), /digest mismatch/);
});

test('new imported content is tracked without editing the published dependency list', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-import-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = (file, value) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), typeof value === 'string' ? value : JSON.stringify(value));};
    const source = 'src/pages/sample.tsx', target = 'i18n/ja/code.json', document = 'src/pages/_content/guide.mdx';
    write(source, 'export default function Page(){return null;}');
    write(target, {});
    write('translations/pages/registry.json', {schemaVersion: 1, pages: [{id: 'sample', kind: 'page', sourcePath: source}]});
    write('translations/pages/state.json', {schemaVersion: 1, pages: [{contentId: 'page:sample', locale: 'ja', state: 'ready',
        sourceFiles: [source], targetFiles: [target], sourceHash: digestFiles(root, [source]), targetHash: digestFiles(root, [target]), reviewStatus: 'machine'}]});
    write(source, "import Guide from './_content/guide.mdx'; export default Guide;");
    const before = fs.readFileSync(path.join(root, 'translations/pages/state.json'), 'utf8');
    write(document, '# New guide\n');
    const decision = () => manualReport(root).pages.find(row => row.locale === 'ja');
    const added = decision();
    assert.equal(added.state, 'needs-update');
    assert.equal(added.fallback, false);
    assert.equal(added.sourceHash, digestFiles(root, [source, document]));
    write(document, '# Revised guide\n');
    assert.notEqual(decision().sourceHash, added.sourceHash);
    assert.equal(fs.readFileSync(path.join(root, 'translations/pages/state.json'), 'utf8'), before);
    write(document.replace('.mdx', '.tsx'), "import {translate} from '@docusaurus/Translate'; export default translate({id:'new.title', message:'New title'});");
    write(source, "export {default} from './_content/guide';");
    assert.throws(decision, /Incomplete page messages/);
});

test('new reports preserve published translations and fall back without dependency registration', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-report-addition-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = (file, value) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), typeof value === 'string' ? value : JSON.stringify(value));};
    const source = 'src/pages/community-report/index.tsx', oldReport = 'src/pages/community-report/_reports/2026-10-12.mdx';
    const newReport = 'src/pages/community-report/_reports/2026-10-19.mdx', coverage = 'translations/community-reports.json';
    write(source, 'export default function Page(){return null;}');
    write(oldReport, 'export const label = "Week 42"; export const report = {"summary":{"lead":"Previous week"}};');
    write(coverage, {schemaVersion: 1, translatedReports: {}});
    const sourceFiles = [source, oldReport, coverage];
    write('translations/pages/registry.json', {schemaVersion: 1, pages: [{id: 'P14', kind: 'page', sourcePath: source, sourceFiles}]});
    const pages = ['zh-CN', 'ja', 'ko', 'ru'].map(locale => {
        const target = `i18n/${locale}/code.json`;
        write(target, {});
        return {contentId: 'page:P14', locale, state: 'ready', sourceFiles, targetFiles: [target],
            sourceHash: digestFiles(root, sourceFiles), targetHash: digestFiles(root, [target]), reviewStatus: 'machine'};
    });
    write('translations/pages/state.json', {schemaVersion: 1, pages});
    assert(manualReport(root).pages.every(row => row.state === 'ready'));
    write(newReport, 'export const label = "Week 43"; export const report = {"summary":{"lead":"New week"}};');
    const report = manualReport(root);
    assert.equal(report.pending.length, 4);
    for (const row of report.pages) {
        assert.equal(row.state, 'needs-update');
        assert.equal(row.fallback, false);
        assert.equal(row.sourceHash, digestFiles(root, [...sourceFiles, newReport]));
    }
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'translations/pages/state.json'))).pages, pages);
});
