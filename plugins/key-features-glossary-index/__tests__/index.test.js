const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { parseEntry } = require('../index');

const FIXTURES = path.join(__dirname, '..', '__fixtures__');

test('parseEntry: full frontmatter', () => {
    const entry = parseEntry(path.join(FIXTURES, 'valid-entry.md'));
    assert.deepEqual(entry, {
        slug: 'bm25',
        title: 'BM25',
        summary: 'Probabilistic ranking function for full-text relevance scoring.',
        tags: ['search', 'indexing', 'algorithm'],
    });
});

test('parseEntry: minimal frontmatter falls back to filename slug, empty tags', () => {
    const entry = parseEntry(path.join(FIXTURES, 'minimal-entry.md'));
    assert.deepEqual(entry, {
        slug: 'minimal-entry',
        title: 'Minimal',
        summary: undefined,
        tags: [],
    });
});

test('parseEntry: no frontmatter returns null (skipped)', () => {
    const entry = parseEntry(path.join(FIXTURES, 'no-frontmatter.md'));
    assert.equal(entry, null);
});
