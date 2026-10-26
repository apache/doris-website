const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const sampler = require('../ci-blog-sample.cjs');
const {DEFAULT_OPTIONS} = require('@docusaurus/plugin-content-blog/lib/options.js');

test('blog lists/tags contain representative bodies and all changed import owners, while metadata stays complete', async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-blog-sample-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    fs.mkdirSync(path.join(root, 'blog'));
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(path.join(root, 'src/Widget.tsx'), 'export default function Widget(){return null;}');
    const contents = {'new.md': '# New', 'rich.mdx': '# Rich\n\n```sql\nSELECT 1;\n```',
        'old.md': '# Old', 'owner.mdx': 'import Widget from "@site/src/Widget.tsx";\n\n<Widget/>', 'other.md': '# Other'};
    for (const [file, text] of Object.entries(contents)) fs.writeFileSync(path.join(root, 'blog', file), text);
    const blogPosts = Object.keys(contents).map(file => ({id: file, metadata: {
        source: '@site/blog/' + file, permalink: '/ja/blog/' + file, title: file, tags: [], unlisted: false,
        frontMatter: file === 'old.md' ? {order: 1, picked: true} : {},
    }}));
    const entries = blogPosts.map(post => ({siteLocale: 'ja', route: post.metadata.permalink,
        englishPath: 'blog/' + post.id, fallback: post.id !== 'rich.mdx', indexable: post.id === 'rich.mdx'}));
    const content = {blogPosts, contentIdentity: {entries}};
    const context = {siteDir: root, baseUrl: '/ja/', i18n: {currentLocale: 'ja'}, siteConfig: {markdown: {format: 'detect'}}};
    const options = {...DEFAULT_OPTIONS, id: 'default', postsPerPage: 'ALL'};
    let restore = sampler.enable({mode: 'sample', files: []});
    let selected = await sampler.sample(context, options, content);
    assert.deepEqual(selected.blogPosts.map(post => post.id), ['new.md', 'rich.mdx', 'old.md']);
    assert.deepEqual(selected.blogListPaginated.flatMap(page => page.items), ['new.md', 'rich.mdx', 'old.md']);
    assert.equal(selected.contentIdentity.entries.length, 5);
    assert.equal(content.blogPosts.length, 5);
    restore();
    restore = sampler.enable({mode: 'sample', files: ['src/Widget.tsx']});
    selected = await sampler.sample(context, options, content);
    assert(selected.blogPosts.some(post => post.id === 'owner.mdx'));
    assert(!selected.blogPosts.some(post => post.id === 'other.md'));
    restore();
    for (const file of ['blog/owner.mdx', 'i18n/ja/docusaurus-plugin-content-blog/owner.mdx', 'translations/blog/pages/ja/owner.mdx.json']) {
        restore = sampler.enable({mode: 'sample', files: [file]});
        assert.equal(await sampler.sample(context, options, content), undefined);
        restore();
    }
    assert.equal(sampler.enabled(), false);
});
