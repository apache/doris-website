const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {mapReportText} = require('../../../src/components/community-report-next/report-localization');
const {reportMessages, reportSources, readReport} = require('../report-messages.cjs');
const {validateMessages} = require('../page-body.cjs');
const root = path.resolve(__dirname, '../../..');
const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'i18n/zh-CN/code.json')));
const prose = new Set(['label', 'week', 'lead', 'title', 'name', 'narrative', 'mergedNarrative', 'inProgressNarrative']);
function technical(value, field = '') {
    if (typeof value === 'string') return (prose.has(field) || field === 'highlights') ? '<prose>' : value;
    if (Array.isArray(value)) return value.map(item => technical(item, field));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'sourceTitle')
        .map(([key, item]) => [key, technical(item, key)]));
}
test('Chinese history covers every visible report field and preserves references, statistics and source data', () => {
    const files = reportSources(root);
    assert(files.length >= 16);
    for (const file of files) {
        const source = readReport(root, file), before = JSON.stringify(source);
        const translated = mapReportText(path.basename(file, '.mdx'), source, (id, message) => {
            assert.equal(typeof dictionary[id]?.message, 'string', id);
            assert(/[\u3400-\u9fff]/.test(dictionary[id].message), id);
            const inlineCode = value => (value.match(/`[^`]+`/g) ?? []).sort();
            assert.deepEqual(inlineCode(dictionary[id].message), inlineCode(message), id);
            return dictionary[id].message;
        });
        assert.equal(JSON.stringify(source), before, 'Source mutated: ' + file);
        assert.deepEqual(technical(translated), technical(source), file);
        function citations(original, localized) {
            if (!original || typeof original !== 'object') return;
            if (typeof original.num === 'number' && original.url) {
                assert.equal(localized.sourceTitle, original.title);
                assert.notEqual(localized.title, original.title);
                return;
            }
            Object.entries(original).forEach(([key, value]) => citations(value, localized[key]));
        }
        citations(source, translated);
    }
});
test('a missing historical reference title blocks Chinese page publication', t => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-report-zh-'));
    t.after(() => fs.rmSync(fixture, {recursive: true, force: true}));
    const source = reportSources(root)[0];
    fs.mkdirSync(path.dirname(path.join(fixture, source)), {recursive: true});
    fs.copyFileSync(path.join(root, source), path.join(fixture, source));
    fs.mkdirSync(path.join(fixture, 'src/pages'), {recursive: true});
    fs.writeFileSync(path.join(fixture, 'src/pages/index.tsx'), 'export default function Page(){return null;}');
    fs.mkdirSync(path.join(fixture, 'i18n/zh-CN'), {recursive: true});
    const copy = {...dictionary};
    const missing = [...reportMessages(fixture).keys()].find(id => id.startsWith('landing.reportRefs.'));
    delete copy[missing];
    fs.writeFileSync(path.join(fixture, 'i18n/zh-CN/code.json'), JSON.stringify(copy));
    assert.throws(() => validateMessages(fixture, {id: 'P14', sourcePath: 'src/pages/index.tsx'}, 'zh-CN'),
        error => error.message.includes('Incomplete page messages: P14/zh-CN/' + missing));
});
