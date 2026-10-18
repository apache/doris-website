const test = require('node:test');
const assert = require('node:assert/strict');
const lunr = require('lunr');
const {buildIndex} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/buildIndex');
const {buildLocalizedIndexes} = require('../search-plugin.cjs');
const config = {language:['ko']};

test('Korean SQL identifiers inside calls are searchable with original highlight offsets', () => {
    const text = "쿼리는 match(query_vector, 'summer') 입니다.";
    const documents = [[{i:1,t:text,u:'/ko/docs/dev/guide/'}]];
    assert.equal(buildIndex(documents,config)[0].index.search('query_vector').length,0);
    const tokenizer = lunr.tokenizer;
    const result = buildLocalizedIndexes(documents,config)[0];
    const matches = result.index.search('query_vector');
    assert.equal(matches.length,1);
    assert.deepEqual(matches[0].matchData.metadata.query_vector.t.position,[[text.indexOf('query_vector'),'query_vector'.length]]);
    assert.equal(result.documents[0].t,text);
    assert.equal(lunr.tokenizer,tokenizer);
});

test('an index failure restores the default tokenizer for subsequent work', () => {
    const tokenizer = lunr.tokenizer;
    assert.throws(() => buildLocalizedIndexes([[{i:1,t:'Invalid document'}]],config));
    assert.equal(lunr.tokenizer,tokenizer);
});
