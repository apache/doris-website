const test = require('node:test'),
    assert = require('node:assert/strict'),
    fs = require('node:fs'),
    path = require('node:path'),
    os = require('node:os');
const {policy} = require('../ci-plan.cjs');
const {prune, dependencies, stripUnbuiltAnchors, selectDocs} = require('../ci-sample.cjs');
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
    assert.equal(policy(['README.md']).mode, 'skip');
    assert.equal(policy(['docs/topic.md'], {forceFull: true}).mode, 'full');
    assert.equal(policy([], {forceSample: true}).mode, 'sample');
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
        'import {value} from "@site/src/value.js";\n\n{value}',
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
    fs.rmSync(path.join(root, 'src/nested.js'));
    const deleted = await selectDocs(props, {files: ['src/nested.js'], baseSha: 'HEAD'});
    assert(
        deleted.selected
            .get(JSON.stringify(['default', 'current', 'owner']))
            .reasons.includes('conservative dynamic/unparsed import'),
    );
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
});
