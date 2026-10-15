const assert = require('node:assert/strict');
const test = require('node:test');

const { filterBlogs, matchesBlogSearch } = require('./blog-search.logic');

const blogs = [
    {
        frontMatter: {
            title: 'Real-Time Analytics with Apache Doris',
            summary: 'Build fast dashboards for customer-facing workloads.',
            author: 'Apache Doris Team',
            tags: ['Best Practice'],
        },
        metadata: {
            title: 'Real-Time Analytics with Apache Doris',
            permalink: '/blog/real-time-analytics',
        },
    },
    {
        frontMatter: {
            title: 'Lakehouse Integration',
            description: 'Query Iceberg tables directly from Doris.',
            authors: [{ name: 'Jane Doe' }],
            tags: [{ label: 'Tech Sharing' }],
            keywords: 'Open table format',
        },
        metadata: {
            title: 'Lakehouse Integration',
            permalink: '/blog/lakehouse-integration',
        },
    },
];

test('matches title, summary, description, author, and tag fields case-insensitively', () => {
    assert.equal(matchesBlogSearch(blogs[0], 'REAL-TIME'), true);
    assert.equal(matchesBlogSearch(blogs[0], 'dashboards'), true);
    assert.equal(matchesBlogSearch(blogs[0], 'doris team'), true);
    assert.equal(matchesBlogSearch(blogs[0], 'best practice'), true);
    assert.equal(matchesBlogSearch(blogs[1], 'iceberg'), true);
    assert.equal(matchesBlogSearch(blogs[1], 'jane doe'), true);
    assert.equal(matchesBlogSearch(blogs[1], 'tech sharing'), true);
    assert.equal(matchesBlogSearch(blogs[1], 'open table'), true);
});

test('requires every whitespace-separated search term to match', () => {
    assert.deepEqual(filterBlogs(blogs, 'doris dashboards'), [blogs[0]]);
    assert.deepEqual(filterBlogs(blogs, 'dashboards iceberg'), []);
});

test('treats blank searches as an unfiltered list', () => {
    assert.deepEqual(filterBlogs(blogs, '   '), blogs);
});

test('normalizes full-width characters before matching', () => {
    assert.equal(matchesBlogSearch(blogs[0], 'Ｄｏｒｉｓ'), true);
});
