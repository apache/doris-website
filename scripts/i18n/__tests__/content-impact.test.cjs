const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const {execFileSync} = require('node:child_process');
const {analyzeImpact} = require('../content-impact.cjs');
const {buildScope} = require('../build-scope.cjs');
function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'content-impact-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = (file, data) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), typeof data === 'string' ? data : JSON.stringify(data));};
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: 'pipe'}).trim();
    write('src/pages/index.tsx', 'export default function Home(){}');
    write('translations/pages/registry.json', {pages: [{id: 'P01', kind: 'page', sourcePath: 'src/pages/index.tsx', sourceFiles: ['src/pages/index.tsx']}]});
    write('translations/pages/state.json', {pages: [{contentId: 'page:P01', locale: 'ja', state: 'ready', sourceFiles: ['src/pages/index.tsx']}]});
    write('blog/post.md', '# English source');
    write('translations/blog/state.json', {pages: [{contentId: 'blog:post.md', locale: 'ja', state: 'ready', sourceFiles: ['blog/post.md']}]});
    write('i18n/ja/code.json', {label: {message: '例'}});
    git('init', '-q'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'Base');
    return {root, write, base: git('rev-parse', 'HEAD')};
}
test('English source builds actual fallback consumers and reports existing translations for manual sync', t => {
    const {root, base} = fixture(t);
    const impact = analyzeImpact(root, base, ['blog/post.md']);
    assert.equal(impact.complete, true); assert.deepEqual(impact.locales, ['en', 'zh-CN', 'ko', 'ru']);
    assert.deepEqual(impact.manualPending.map(row => row.locale), ['ja']);
    assert.deepEqual(analyzeImpact(root, base, ['src/pages/index.tsx']).locales, ['en', 'zh-CN', 'ja', 'ko', 'ru'],
        'Shared page implementations still affect already-translated bodies');
});
test('single-language messages and manual state changes keep their actual language scope', t => {
    const {root, base, write} = fixture(t);
    assert.deepEqual(analyzeImpact(root, base, ['i18n/ja/code.json']).locales, ['ja']);
    write('translations/pages/state.json', {pages: [{contentId: 'page:P01', locale: 'ko', state: 'ready', sourceFiles: ['src/pages/index.tsx']}]});
    const impact = analyzeImpact(root, base, ['translations/pages/state.json']);
    assert.deepEqual(impact.locales, ['en', 'ja', 'ko']);
    const plan = buildScope(['translations/pages/state.json'], ['4.x', '3.x', '2.1'], ['ja', 'ko', 'ru'], impact);
    assert.deepEqual(plan.locales, ['en', 'ja', 'ko']); assert.equal(plan.optimize_publish, false);
});
test('source additions/deletions widen consumers and unknown dependencies remain conservative', t => {
    const {root, base, write} = fixture(t);
    fs.rmSync(path.join(root, 'src/pages/index.tsx'));
    const impact = analyzeImpact(root, base, ['src/pages/index.tsx']);
    assert.equal(impact.structural, true); assert.equal(impact.locales.length, 5);
    assert.equal(analyzeImpact(root, base, ['src/new-mechanism.ts']).complete, false);
    write('translations/pages/registry.json', '{bad json');
    assert.throws(() => analyzeImpact(root, base, []));
});
