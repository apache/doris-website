const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const ts = require('typescript');
const {localizedOptions, buildLocalizedIndexes} = require('../search-plugin.cjs');
const {normalizeRussianSearch} = require('../../../src/utils/searchNormalization.js');
const root = path.resolve(__dirname, '../../..');

test('native Russian-only indexing drops ASCII technical terms', () => {
    const output = execFileSync(process.execPath, ['-e', `
        const {buildIndex} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/buildIndex');
        const index = buildIndex([[{i:1,t:'Запрос SQL query_vector',u:'/ru/docs/dev/test/'}]], {language:['ru']})[0].index;
        console.log(JSON.stringify(['SQL','query_vector'].map(query => index.search(query).length)));
    `], {cwd:root, encoding:'utf8'});
    assert.deepEqual(JSON.parse(output), [0,0]);
});

test('Russian and English analyzers preserve identifiers, inflections and original highlight positions', () => {
    const config = localizedOptions({}, 'ru', {});
    assert.deepEqual(config.language, ['en','ru']);
    const text = "Запросы: отчёты SQL match(query_vector, 'summer')";
    const result = buildLocalizedIndexes([[{i:1,t:text,u:'/ru/docs/dev/test/'}]], config)[0];
    for (const query of ['SQL','sql','ЗАПРОСЫ','запрос','отчёты','отчеты','ОТЧЁТЫ','query_vector','match'])
        assert.equal(result.index.search(normalizeRussianSearch(query)).length, 1, query);
    assert.equal(result.index.search('nonexistent_russian_search_word').length, 0);
    const matches = result.index.search('query_vector');
    assert.deepEqual(matches[0].matchData.metadata.query_vector.t.position,
        [[text.indexOf('query_vector'),'query_vector'.length]]);
    assert.equal(result.documents[0].t, text);
    assert.equal(normalizeRussianSearch(text).length, text.length);
});

test('the actual UI worker boundary receives the same Russian normalization as indexing', async () => {
    const file = path.join(root, 'src/utils/searchInput.js');
    const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'),
        {compilerOptions:{module:ts.ModuleKind.CommonJS}});
    const module = {exports:{}};
    const imports = {'./tokenize':{usesSegmenterTokenizer:()=>false},
        './proxiedGeneratedConstants':{language:['en','ru']},
        './searchNormalization':{normalizeRussianSearch}};
    new Function('require','module','exports',outputText)(name=>{
        assert(Object.hasOwn(imports,name), name);return imports[name];
    },module,module.exports);
    const calls = [];
    await module.exports.searchWithLocaleFallback(async (...args)=>{calls.push(args);return [];},
        '/ru/', 'docs/dev', "Ёж query_vector()", 10);
    assert.deepEqual(calls, [['/ru/','docs/dev', 'Еж query_vector  ',10]]);
});
