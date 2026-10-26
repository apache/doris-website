const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {indexGroups} = require('../search-plugin.cjs');

const root = path.resolve(__dirname, '../../..');
const pluginClient = path.dirname(require.resolve('@yang1666204/docusaurus-search-local/dist/client/client/utils/sortSearchResults.js'));

// Transpile the ES module sources the browser bundle uses, including the
// installed plugin's own sort, so the merge is checked against the worker's.
function load(file, imports = {}) {
    const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true},
    });
    const module = {exports: {}};
    const resolve = name => {
        if (Object.hasOwn(imports, name)) return imports[name];
        if (name.startsWith('.')) return load(require.resolve(path.resolve(path.dirname(file), name)));
        const resolved = require.resolve(name);
        return resolved.startsWith(path.dirname(path.dirname(pluginClient))) ? load(resolved) : require(name);
    };
    new Function('require', 'module', 'exports', outputText)(resolve, module, module.exports);
    return module.exports;
}

const plugin = name => load(path.join(pluginClient, `${name}.js`));
const japanese = {
    searchContextByPaths: ['docs/dev', 'docs/4.x', 'community'].map(value => ({path: value, label: {ja: value}})),
    useAllContextsWithNoSearchContext: true,
};
const english = {searchContextByPaths: ['docs', 'course'], useAllContextsWithNoSearchContext: false};
const searchContexts = generated => load(path.join(root, 'src/utils/searchContexts.js'), {'./proxiedGenerated': generated});

// Raw worker hits for one context: a page title and two sections of each page.
function hits(prefix, scores) {
    return scores.flatMap(([title, ...sections], i) => {
        const page = {i: `${prefix}${i}`, t: `${prefix} page ${i}`, u: `/ja/${prefix}/${i}/`};
        return [{document: page, type: 0, score: title, tokens: ['sql']},
            ...sections.map((score, j) => ({document: {i: `${prefix}${i}-${j}`, p: page.i, u: page.u},
                type: 4, page, score, tokens: ['sql']}))];
    });
}
// What the worker returns: its own ranking applied to fresh result objects.
function ranked(results) {
    const copy = results.map(result => ({...result}));
    plugin('sortSearchResults').sortSearchResults(copy);
    plugin('processTreeStatusOfSearchResults').processTreeStatusOfSearchResults(copy);
    return copy;
}
const shape = results => results.map(({document, type, score, isInterOfTree, isLastOfTree}) =>
    ({id: document.i, type, score, tree: isInterOfTree ? 'inter' : isLastOfTree ? 'last' : ''}));

test('a page outside every context searches each context index, not a union', async () => {
    const {indexContexts, fetchContextIndexes, searchAcrossContexts} = searchContexts(japanese);
    assert.deepEqual(indexContexts(''), ['docs/dev', 'docs/4.x', 'community']);
    assert.deepEqual(indexContexts('docs/4.x'), ['docs/4.x']);
    const fetched = [];
    await fetchContextIndexes(async (...args) => {fetched.push(args);}, '/ja/', '');
    assert.deepEqual(fetched, [['/ja/', 'docs/dev'], ['/ja/', 'docs/4.x'], ['/ja/', 'community']]);
    const calls = [];
    const search = searchAcrossContexts(async (...args) => {calls.push(args); return [];});
    await search('/ja/', 'community', 'sql', 10);
    assert.deepEqual(calls, [['/ja/', 'community', 'sql', 10]]);
    calls.length = 0;
    await search('/ja/', '', 'sql', 10);
    assert.deepEqual(calls.map(call => call[1]), ['docs/dev', 'docs/4.x', 'community']);
});

test('without useAllContextsWithNoSearchContext the root index stays the only one', async () => {
    const {indexContexts, searchAcrossContexts} = searchContexts(english);
    assert.deepEqual(indexContexts(''), ['']);
    const calls = [];
    await searchAcrossContexts(async (...args) => {calls.push(args); return [];})('/', '', 'sql', 10);
    assert.deepEqual(calls, [['/', '', 'sql', 10]]);
});

test('merged context results rank like one index over all of their hits', () => {
    const {mergeSearchResults} = searchContexts(japanese);
    const dev = hits('dev', [[3, 9, 1], [8, 2]]);
    const community = hits('community', [[6, 7], [1, 10, 4]]);
    const merged = mergeSearchResults([ranked(dev), ranked(community)], 100);
    // Titles keep the single boost the worker applies, and every section still
    // follows its own page title with correct tree markers.
    assert.deepEqual(shape(merged), shape(ranked([...dev, ...community])));
    assert.equal(merged.find(result => result.document.i === 'dev1').score, 12);
    const limited = mergeSearchResults([ranked(dev), ranked(community)], 4);
    assert.deepEqual(shape(limited), shape(ranked([...dev, ...community]).slice(0, 4)).map((item, i, all) =>
        i === all.length - 1 && item.tree === 'inter' ? {...item, tree: 'last'} : item));
});

test('the localized root index holds only documents outside every context', () => {
    const doc = (u, i) => ({i, u, t: u});
    const all = [[doc('/ja/docs/dev/a/', 1), doc('/ja/docs/4.x/a/', 2), doc('/ja/community/a/', 3)], []];
    const selected = new Map([['/ja/docs/dev/a', 'docs/dev'], ['/ja/docs/4.x/a', 'docs/4.x'], ['/ja/community/a', 'community']]);
    const groups = indexGroups(all, selected);
    assert.deepEqual([...groups.keys()], ['docs/dev', 'docs/4.x', 'community', 'course', '']);
    assert.deepEqual(groups.get('docs/4.x'), [[doc('/ja/docs/4.x/a/', 2)], []]);
    assert.deepEqual(groups.get(''), [[], []]);
    assert.deepEqual(indexGroups([[doc('/ja/other/', 4)]], selected).get(''), [[doc('/ja/other/', 4)]]);
});
