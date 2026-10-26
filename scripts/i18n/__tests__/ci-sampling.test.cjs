const test = require('node:test'),
    assert = require('node:assert/strict'),
    fs = require('node:fs'),
    path = require('node:path'),
    os = require('node:os');
const {execFileSync} = require('node:child_process');
const {policy, plan} = require('../ci-plan.cjs');
const {prune, dependencies, stripUnbuiltAnchors, selectDocs, chooseRepresentatives, indexedRouteMatcher} = require('../ci-sample.cjs');
const {buildLocales} = require('../../build-locales.cjs');
function directory(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-sampling-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    return root;
}
test('PR policy separates fixtures, real samples, full upgrades and lightweight prose', () => {
    assert.equal(policy(['.github/workflows/build-check.yml']).mode, 'fixtures');
    assert.equal(policy(['scripts/publish/apache.cjs']).mode, 'fixtures');
    assert.equal(policy(['scripts/i18n/ci-sample.cjs']).mode, 'fixtures');
    assert.equal(policy(['src/theme/DocItem/Content/index.tsx']).mode, 'sample');
    assert.equal(policy(['docs/topic.mdx']).mode, 'sample');
    assert.equal(
        policy(['i18n/ja/docusaurus-plugin-content-docs/current/topic.md']).mode,
        'sample',
    );
    assert.equal(policy(['static/images/logo.svg']).mode, 'sample');
    for (const file of ['package.json', 'yarn.lock', 'versions.json', 'unknown-input.bin'])
        assert.equal(policy([file]).mode, 'full');
    assert.equal(policy(['plan-doc/notes.md']).mode, 'skip');
    assert.equal(policy(['translations/CONTENT_MANIFEST.md']).mode, 'skip');
    assert.equal(
        policy(['src/utils/localizedRoute.ts', 'translations/CONTENT_MANIFEST.md']).mode,
        'sample',
    );
    assert.equal(policy(['README.md']).mode, 'skip');
    assert.equal(policy(['docs/topic.md'], {forceFull: true}).mode, 'full');
    assert.equal(policy([], {forceSample: true}).mode, 'sample');
});
test('shared UI registry selects real samples and content fixtures while unknown inputs still require full validation', () => {
    const registry = 'translations/shared/registry.json';
    const selected = policy([registry]);
    assert.equal(selected.mode, 'sample');
    assert.equal(selected.selection, 'representative');
    assert.equal(selected.runContentFixture, true);
    assert.equal(selected.publicationAllowed, false);
    for (const file of ['translations/shared/unknown.json', 'unknown-input.bin', 'package.json', 'versions.json'])
        assert.equal(policy([registry, file]).mode, 'full', file);
    assert.equal(policy([registry], {forceFull: true}).mode, 'full');
    assert.equal(policy([registry, 'translations/shared/unknown.json'], {forceSample: true}).mode, 'full');
});
test('community translation metadata does not upgrade a landing-page PR to full compilation', () => {
    const files = ['translations/COMMUNITY_ENTRIES.md', 'translations/community-reports.json',
        'translations/pages/registry.json', 'translations/pages/state.json',
        'i18n/ja/code.json', 'src/components/community-report-next/CommunityReportNext.tsx'];
    const selected = policy(files);
    assert.equal(selected.mode, 'sample');
    assert.equal(selected.selection, 'representative');
    assert.equal(selected.publicationAllowed, false);
    assert.equal(selected.runPublishFixture, false);
    assert.equal(selected.runDocsReport, false);
    assert.equal(policy(['translations/community-reports.json']).mode, 'sample');
    for (const note of ['COMMUNITY_ENTRIES', 'FIRST_RELEASE', 'SHARED_UI', 'README'])
        assert.equal(policy([`translations/${note}.md`]).mode, 'skip');
    assert.equal(policy([...files, 'translations/unknown.json']).mode, 'full');
    assert.equal(policy(files, {forceFull: true}).mode, 'full');
});
test('CI tooling only runs the fixtures for its own subsystem', () => {
    const language = policy(['scripts/i18n/verify-global-language.cjs']);
    assert.equal(language.mode, 'fixtures');
    assert.equal(language.runContentFixture, true);
    assert.equal(language.runSamplingFixture, false);
    assert.equal(language.runPublishFixture, false);
    const sampler = policy(['scripts/i18n/ci-sample.cjs']);
    assert.equal(sampler.runSamplingFixture, true);
    assert.equal(sampler.runPublishFixture, false);
    const publishing = policy(['scripts/publish/apache.cjs']);
    assert.equal(publishing.runPublishFixture, true);
    assert.equal(publishing.runSamplingFixture, false);
    const docs = policy(['docs/topic.md']);
    assert.equal(docs.runTranslationTests, false);
    assert.equal(docs.runDocsReport, true);
    const dictionary = policy(['i18n/ja/code.json']);
    assert.equal(dictionary.runTranslationTests, false);
    assert.equal(dictionary.runDocsReport, false);
    assert.equal(policy(['src/utils/localizedRoute.ts']).runTranslationTests, true);
    const full = policy([], {forceFull: true});
    assert.equal(full.runTranslationTests, true);
    assert.equal(full.runDocsReport, true);
});
test('a registry-only commit samples all configured languages and active versions without claiming publication coverage', t => {
    const root = directory(t), registry = 'translations/shared/registry.json';
    fs.mkdirSync(path.join(root, 'translations/shared'), {recursive: true});
    fs.writeFileSync(path.join(root, 'versions.json'), JSON.stringify(['4.x', '3.x', '2.1']));
    fs.writeFileSync(path.join(root, registry), JSON.stringify({schemaVersion: 1, messages: {label: 'Before'}}));
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: 'pipe'}).trim();
    const commit = () => {git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'Fixture');};
    git('init', '-q'); commit();
    const base = git('rev-parse', 'HEAD');
    fs.writeFileSync(path.join(root, registry), JSON.stringify({schemaVersion: 1, messages: {label: 'After'}}));
    commit();
    const selected = plan({root, base});
    assert.deepEqual(selected.files, [registry]);
    assert.equal(selected.mode, 'sample');
    assert.equal(selected.selection, 'representative');
    assert.deepEqual(selected.locales, require('../../../config/i18n').locales);
    assert.deepEqual(selected.activeVersions, ['current', '4.x', '3.x', '2.1']);
    assert.equal(selected.impact.skip_build, false);
    assert.deepEqual(selected.impact.json, [registry]);
    assert.equal(selected.runContentFixture, true);
    assert.equal(selected.publicationAllowed, false);
    assert.equal(plan({root, base, event: {pull_request: {labels: [{name: 'ci/full'}]}}}).mode, 'full');
});
test('unselected MDX modules leave the compiler graph while native layouts and non-doc pages remain', () => {
    const routes = [
        {
            path: '/docs',
            plugin: {name: 'docusaurus-plugin-content-docs'},
            routes: [
                {
                    path: '/docs/4.x',
                    component: 'Layout',
                    routes: [
                        {path: '/docs/4.x/a/', component: 'Doc', modules: {content: 'a.mdx'}},
                        {path: '/docs/4.x/b/', component: 'Doc', modules: {content: 'b.mdx'}},
                    ],
                },
            ],
        },
        {path: '/', component: 'Home'},
    ];
    const output = prune(
        routes,
        new Set(['/docs/4.x/a', '/docs/4.x/b']),
        new Set(['/docs/4.x/a']),
        [],
    );
    assert.equal(output[0].routes[0].component, 'Layout');
    assert.deepEqual(
        output[0].routes[0].routes.map(r => r.modules.content),
        ['a.mdx'],
    );
    assert.equal(output[1].component, 'Home');
    assert.equal(routes[0].routes[0].routes.length, 2);
});
test('one rich document covers several sample requirements without losing entry or fallback coverage', t => {
    const root = directory(t);
    const source = {entry: '# Entry', sql: '```sql\nSELECT 1;\n```', math: '$$x$$',
        rich: 'import X from "x";\n\n```sql\nSELECT 1;\n```\n\n$$x$$\n\n![image](./image.png)'};
    const rows = Object.entries(source).map(([docId, text]) => {
        fs.writeFileSync(path.join(root, docId + '.mdx'), text);
        return {pluginId: 'default', version: 'current', docId, englishPath: docId + '.mdx', main: docId === 'entry',
            decisions: [{locale: 'en', fallback: false, indexable: true},
                {locale: 'ja', fallback: docId !== 'rich', indexable: docId === 'rich'}]};
    });
    const {selected} = chooseRepresentatives(rows, root);
    assert.deepEqual([...selected.values()].map(({row}) => row.docId), ['entry', 'rich']);
    const reasons = [...selected.values()].flatMap(item => item.reasons);
    for (const reason of ['version/plugin entry', 'MDX/import', 'SQL', 'math', 'media/link', 'en real body', 'ja real body', 'ja fallback'])
        assert(reasons.includes(reason), reason);
});
test('fixture selection follows the changed subsystem and preserves sampler-specific verification', () => {
    const css = policy(['src/scss/_variables.scss']);
    assert.equal(css.mode, 'sample');
    assert.equal(css.runContentFixture, false);
    assert.equal(css.runPublishFixture, false);
    assert.equal(css.checkRenderedLinks, false);
    for (const file of ['docs/topic.mdx', 'src/utils/localizedRoute.ts', 'static/images/logo.svg', 'docusaurus.config.js'])
        assert.equal(policy([file]).checkRenderedLinks, true, file);
    assert.equal(policy(['src/utils/localizedRoute.ts']).runContentFixture, true);
    assert.equal(policy(['static/.htaccess']).runPublishFixture, true);
    assert.equal(policy(['scripts/i18n/ci-sample.cjs', 'src/utils/localizedRoute.ts']).runSamplingFixture, true);
});
test('indexed link checking retains native fixed/dynamic route matching, case and slash rules', () => {
    const {matchRoutes} = require('react-router-config');
    let scanned = 0;
    const indexed = indexedRouteMatcher((routes, pathname) => {
        scanned += routes.length;
        return matchRoutes(routes, pathname);
    });
    const routes = [
        ...Array.from({length: 2000}, (_, i) => ({path: '/docs/topic-' + i, exact: true})),
        {path: '/Strict/', exact: true, strict: true, sensitive: true},
        {path: '/blog/:post', exact: true}, {path: '/中文', exact: true},
        {path: '/nested', routes: [{path: '/nested/child', exact: true}]},
    ];
    for (const pathname of ['/docs/topic-1', '/DOCS/TOPIC-1/', '/Strict/', '/strict/', '/Strict',
        '/blog/post', '/blog/post/extra', '/中文', '/nested/child', '/absent'])
        assert.equal(indexed(routes, pathname).length > 0, matchRoutes(routes, pathname).length > 0, pathname);
    const before = scanned;
    indexed(routes, '/absent');
    assert.equal(scanned, before, 'repeated invalid targets reuse the negative result');
    assert(scanned < 50, 'fixed routes are indexed instead of rescanned');
});
test('dependency discovery follows MDX imports and their transitive code imports, not fenced examples', async t => {
    const root = directory(t);
    fs.mkdirSync(path.join(root, 'docs'));
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(
        path.join(root, 'docs/a.mdx'),
        'import Child from "./part.mdx";\n\n<Child/>\n\n```js\nimport Fake from "./absent.mdx"\n```\n',
    );
    fs.writeFileSync(
        path.join(root, 'docs/part.mdx'),
        'import {value} from "@site/src/value.js";\n\n{value}\n',
    );
    fs.writeFileSync(path.join(root, 'src/value.js'), 'export const value = "real";');
    const output = await dependencies(root, path.join(root, 'docs/a.mdx'));
    assert.deepEqual([...output.files].map(f => path.relative(root, f)).sort(), [
        'docs/a.mdx',
        'docs/part.mdx',
        'src/value.js',
    ]);
    assert.equal(output.uncertain, false);
});
test('known unbuilt anchors are reported as unverified, while unknown paths and compiled anchors remain checked', () => {
    const result = stripUnbuiltAnchors(
        {
            '/a/': {
                links: ['/b/#not-rendered', '/a/#must-exist', '/unknown/'],
                anchors: ['must-exist'],
            },
        },
        new Set(['/a', '/b']),
        new Set(['/a']),
        new Map(),
    );
    assert.equal(result.skipped, 1);
    assert.deepEqual(result.collected['/a/'].links, ['/a/#must-exist', '/unknown/']);
});
test('dependency parsing follows native Markdown detection and front matter overrides', async t => {
    const root = directory(t);
    fs.writeFileSync(
        path.join(root, 'plain.md'),
        'Use import with <placeholder>.\n\nimport Example from "./absent.js";\n',
    );
    fs.writeFileSync(path.join(root, 'typed.ts'), 'export const value = <number>1;');
    fs.writeFileSync(
        path.join(root, 'override.md'),
        '---\nformat: mdx\n---\n\nimport {value} from "./typed.ts";\n\n{value}\n',
    );
    fs.writeFileSync(
        path.join(root, 'markdown.mdx'),
        '---\nformat: md\n---\n\nimport Example from "./absent.js";\n',
    );
    const scan = file => dependencies(root, path.join(root, file), new Map(), new Set(), 'detect');
    const plain = await scan('plain.md');
    assert.equal(plain.uncertain, false);
    assert.deepEqual([...plain.files], [path.join(root, 'plain.md')]);
    const mdx = await scan('override.md');
    assert.equal(mdx.uncertain, false);
    assert(mdx.files.has(path.join(root, 'typed.ts')));
    assert.equal((await scan('markdown.mdx')).uncertain, false);
    // Actual malformed MDX still selects its owner conservatively.
    fs.writeFileSync(path.join(root, 'broken.mdx'), 'import X from "./typed.ts";\n\n<Unclosed>\n');
    assert.equal((await scan('broken.mdx')).uncertain, true);
});
test('sample artifacts cannot become publication artifacts or overwrite the full build output', async t => {
    const root = directory(t);
    fs.writeFileSync(path.join(root, '.ci-validation.json'), '{}');
    assert.throws(() => require('../../publish/verify.cjs').verify(root), /must not be published/);
    assert.throws(
        () => require('../../publish/optimize.cjs').optimize({site: root, locales: []}),
        /must not be published/,
    );
    await assert.rejects(
        buildLocales({siteDir: root, outDir: 'build', samplePlan: 'plan.json'}),
        /must stay under/,
    );
});

test('changed transitive imports and sharded translation state select their owning documents', async t => {
    const root = directory(t);
    fs.mkdirSync(path.join(root, 'docs'));
    fs.mkdirSync(path.join(root, 'src'));
    fs.mkdirSync(path.join(root, 'generated'));
    const docs = ['entry', 'owner', 'state-only'].map(name => ({
        id: name,
        source: '@site/docs/' + name + '.mdx',
        permalink: '/docs/' + name + '/',
    }));
    fs.writeFileSync(path.join(root, 'docs/entry.mdx'), 'Entry body');
    fs.writeFileSync(
        path.join(root, 'docs/owner.mdx'),
        'import {value} from "@site/src/value.js";\nimport Nested from "./state-only.mdx";\n\n{value}\n<Nested/>',
    );
    fs.writeFileSync(path.join(root, 'docs/state-only.mdx'), 'State body');
    fs.writeFileSync(
        path.join(root, 'src/value.js'),
        'export {value} from "./nested.js"; export {default as data} from "./data.json";',
    );
    fs.writeFileSync(path.join(root, 'src/nested.js'), 'export const value = 1;');
    fs.writeFileSync(path.join(root, 'src/data.json'), '{}');
    fs.writeFileSync(
        path.join(root, 'generated/globalData.json'),
        JSON.stringify({
            'docusaurus-plugin-content-docs': {
                default: {versions: [{name: 'current', mainDocId: 'entry'}]},
            },
        }),
    );
    const props = {
        siteDir: root,
        generatedFilesDir: path.join(root, 'generated'),
        i18n: {currentLocale: 'en', locales: ['en']},
        plugins: [
            {
                name: 'docusaurus-plugin-content-docs',
                options: {id: 'default'},
                content: {
                    loadedVersions: [
                        {versionName: 'current', contentPath: path.join(root, 'docs'), docs},
                    ],
                    contentIdentity: {
                        entries: docs.map(doc => ({
                            siteLocale: 'en',
                            pluginId: 'default',
                            version: 'current',
                            docId: doc.id,
                            englishPath: 'docs/' + doc.id + '.mdx',
                            indexable: true,
                            fallback: false,
                        })),
                    },
                },
            },
        ],
    };
    const imported = await selectDocs(props, {files: ['src/nested.js'], baseSha: 'HEAD'});
    assert(
        imported.selected
            .get(JSON.stringify(['default', 'current', 'owner']))
            .reasons.includes('changed import dependency'),
    );
    const data = await selectDocs(props, {files: ['src/data.json'], baseSha: 'HEAD'});
    assert(
        data.selected
            .get(JSON.stringify(['default', 'current', 'owner']))
            .reasons.includes('changed import dependency'),
    );
    const document = await selectDocs(props, {files: ['docs/state-only.mdx'], baseSha: 'HEAD'});
    assert(
        document.selected
            .get(JSON.stringify(['default', 'current', 'owner']))
            .reasons.includes('changed import dependency'),
    );
    fs.rmSync(path.join(root, 'src/nested.js'));
    const deleted = await selectDocs(props, {files: ['src/nested.js'], baseSha: 'HEAD'});
    assert(
        deleted.selected
            .get(JSON.stringify(['default', 'current', 'owner']))
            .reasons.includes('conservative dynamic/unparsed import'),
    );
    fs.writeFileSync(path.join(root, 'src/nested.js'), 'export const value = 1;');
    const state = 'translations/state/ja/pages/topic.json';
    fs.mkdirSync(path.dirname(path.join(root, state)), {recursive: true});
    fs.writeFileSync(
        path.join(root, state),
        JSON.stringify({
            schemaVersion: 1,
            page: {pluginId: 'default', version: 'current', docId: 'state-only'},
        }),
    );
    const changed = await selectDocs(props, {files: [state], baseSha: 'HEAD'});
    assert(
        changed.selected
            .get(JSON.stringify(['default', 'current', 'state-only']))
            .reasons.includes('changed document/state'),
    );
    assert(
        changed.selected
            .get(JSON.stringify(['default', 'current', 'owner']))
            .reasons.includes('changed import dependency'),
    );
});
