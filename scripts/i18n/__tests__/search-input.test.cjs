const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const {generate} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/generate');

const root = path.resolve(__dirname, '../../..');

function load(file, imports = {}) {
    const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true},
    });
    const module = {exports: {}};
    const resolve = name => {
        if (Object.hasOwn(imports, name)) return imports[name];
        if (name.startsWith('.')) return load(require.resolve(path.resolve(path.dirname(file), name)));
        if (name.endsWith('/client/shared/lunrLanguageZh.js')) return load(name);
        return require(name);
    };
    new Function('require', 'module', 'exports', outputText)(resolve, module, module.exports);
    return module.exports;
}

function searchInput(t, language) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-search-input-'));
    t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
    // Use the installed plugin's real exports so importing a constant from
    // generated.js instead of generated-constants.js fails as it does online.
    generate({language, hashed: false}, dir);
    const generatedPath = '@generated/@yang1666204/docusaurus-search-local/default/';
    const generated = load(path.join(root, 'src/utils/proxiedGenerated.ts'), {
        [`${generatedPath}generated.js`]: load(path.join(dir, 'generated.js')),
    });
    const constants = load(path.join(root, 'src/utils/proxiedGeneratedConstants.ts'), {
        [`${generatedPath}generated-constants.js`]: load(path.join(dir, 'generated-constants.js')),
    });
    return load(path.join(root, 'src/utils/searchInput.js'), {
        './tokenize': load(path.join(root, 'src/utils/tokenize.ts')),
        './proxiedGenerated': generated,
        './proxiedGeneratedConstants': constants,
    }).searchWithLocaleFallback;
}

test('English and Chinese search use the generated language constants', async t => {
    const search = searchInput(t, ['en', 'zh']);
    const calls = [], results = [{document: {t: 'Inverted Index'}}];
    const worker = async (...args) => {calls.push(args); return results;};
    assert.equal(await search(worker, '/docs/dev/', 'docs', 'inverted_index', 100), results);
    assert.deepEqual(calls, [['/docs/dev/', 'docs', 'inverted_index', 100]]);
});

test('Japanese search retries SQL identifier parts only after an empty normalized query', async t => {
    const search = searchInput(t, ['ja']);
    const calls = [], results = [{document: {t: 'query_vector'}}];
    const worker = async (...args) => {
        calls.push(args);
        return args[2] === 'vector' ? results : [];
    };
    assert.equal(await search(worker, '/ja/', 'docs/dev', 'query_vector', 100), results);
    assert.deepEqual(calls, [['/ja/', 'docs/dev', 'query vector', 100], ['/ja/', 'docs/dev', 'vector', 100]]);
});

test('Japanese search keeps a successful normalized result without retrying', async t => {
    const search = searchInput(t, ['ja']);
    const calls = [], results = [{document: {t: 'query_vector'}}];
    const worker = async (...args) => {calls.push(args); return results;};
    assert.equal(await search(worker, '/ja/', 'docs/4.x', 'query-vector', 10), results);
    assert.deepEqual(calls, [['/ja/', 'docs/4.x', 'query vector', 10]]);
});
