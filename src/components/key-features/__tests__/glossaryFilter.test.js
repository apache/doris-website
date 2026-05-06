const test = require('node:test');
const assert = require('node:assert/strict');

// Mock the @site/... alias before requiring the filter module.
// The test runs in raw Node (no webpack), so the alias must be intercepted at require time.
const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
    if (request === '@site/src/utils/key-features-tags') {
        return require.resolve('./_mock-tags.js');
    }
    return originalResolve.call(this, request, ...rest);
};

const { applyFilter } = require('../glossaryFilter');

const ENTRIES = [
    { slug: 'bm25', title: 'BM25', tags: ['search', 'indexing', 'algorithm'] },
    { slug: 'iceberg', title: 'Iceberg', tags: ['lakehouse', 'file-format'] },
    { slug: 'ann-search', title: 'ANN Search', tags: ['search', 'algorithm'] },
    { slug: 'inverted-index', title: 'Inverted Index', tags: ['indexing', 'data-structure'] },
];

test('no filters returns all entries', () => {
    assert.equal(applyFilter(ENTRIES, [], '').length, 4);
});

test('single tag filters by that tag', () => {
    const result = applyFilter(ENTRIES, ['search'], '');
    assert.deepEqual(result.map(e => e.slug), ['bm25', 'ann-search']);
});

test('two tags in same group OR together', () => {
    const result = applyFilter(ENTRIES, ['search', 'indexing'], '');
    assert.deepEqual(result.map(e => e.slug), ['bm25', 'ann-search', 'inverted-index']);
});

test('tags across groups AND together', () => {
    // (search OR indexing) AND (algorithm)
    const result = applyFilter(ENTRIES, ['search', 'indexing', 'algorithm'], '');
    assert.deepEqual(result.map(e => e.slug), ['bm25', 'ann-search']);
});

test('search matches title startsWith case-insensitive', () => {
    const result = applyFilter(ENTRIES, [], 'ann');
    assert.deepEqual(result.map(e => e.slug), ['ann-search']);
});

test('search combines with tags via AND', () => {
    const result = applyFilter(ENTRIES, ['indexing'], 'bm');
    assert.deepEqual(result.map(e => e.slug), ['bm25']);
});

test('unregistered tag is silently dropped (does not constrain results)', () => {
    const result = applyFilter(ENTRIES, ['search', 'nonexistent-tag'], '');
    // 'nonexistent-tag' has no group → dropped → behaves as if only 'search' was active
    assert.deepEqual(result.map(e => e.slug), ['bm25', 'ann-search']);
});
