const assert = require('node:assert/strict');
const test = require('node:test');
const recentBlogsPlugin = require('./recent-blogs-plugin.cjs');

function post(name, date, overrides = {}) {
    return {metadata: {
        title: name,
        permalink: `/blog/${name}`,
        date,
        frontMatter: {},
        ...overrides,
    }};
}

function collect(blogPosts, locale = 'en') {
    let data;
    recentBlogsPlugin({i18n: {currentLocale: locale}}).allContentLoaded({
        allContent: {'docusaurus-plugin-content-blog': {default: {blogPosts}}},
        actions: {setGlobalData(value) { data = value; }},
    });
    return data;
}

test('selects the latest published posts with an extra candidate for excluding the current article', () => {
    const posts = [
        post('oldest', '2026-01-01'),
        post('draft', '2026-12-31', {frontMatter: {draft: true}}),
        post('unlisted', '2026-12-30', {unlisted: true}),
        post('dev-unlisted', '2026-12-29', {unlisted: false, frontMatter: {unlisted: true}}),
        post('middle', '2026-07-01'),
        post('latest', new Date('2026-11-03')),
        post('fourth', '2026-05-01'),
        post('second', '2026-10-29'),
        post('fifth', '2026-02-01'),
    ];
    const originalOrder = posts.map(item => item.metadata.title);
    const data = collect(posts);

    assert.equal(data.count, 4);
    assert.deepEqual(data.posts.map(item => item.title), ['latest', 'second', 'middle', 'fourth', 'fifth']);
    assert.deepEqual(posts.map(item => item.metadata.title), originalOrder);
    assert.deepEqual(data.posts.filter(item => item.permalink !== '/blog/latest').map(item => item.title),
        ['second', 'middle', 'fourth', 'fifth']);
});

test('uses native localized permalinks and identifies English fallback titles', () => {
    const data = collect([
        post('translated', '2026-11-03', {
            title: '最新文章',
            permalink: '/zh-CN/blog/translated/',
            dorisContent: {contentLocale: 'zh-CN'},
        }),
        post('fallback', '2026-10-29', {
            permalink: '/zh-CN/blog/fallback/',
            dorisContent: {contentLocale: 'en', fallback: true},
        }),
    ], 'zh-CN');

    assert.deepEqual(data.posts, [
        {title: '最新文章', permalink: '/zh-CN/blog/translated/', contentLocale: 'zh-CN'},
        {title: 'fallback', permalink: '/zh-CN/blog/fallback/', contentLocale: 'en'},
    ]);
});

test('deduplicates native routes and gives equal publication dates a stable order', () => {
    const data = collect([
        post('z', '2026-11-03'),
        post('a', '2026-11-03'),
        post('a', '2026-11-03'),
    ]);

    assert.deepEqual(data.posts.map(item => item.title), ['a', 'z']);
});

test('handles empty blogs and refreshes after an article is added', () => {
    assert.deepEqual(collect([]), {posts: [], count: 4});
    const posts = [post('existing', '2026-10-29')];
    assert.equal(collect(posts).posts[0].title, 'existing');
    posts.push(post('new', '2026-11-03'));
    assert.deepEqual(collect(posts).posts.map(item => item.title), ['new', 'existing']);
});
