const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const matter = require('gray-matter');
const {createProcessorUncached} = require('@docusaurus/mdx-loader/lib/processor');
const {getFormat} = require('@docusaurus/mdx-loader/lib/format');
const {escapeMarkdownHeadingIds} = require('@docusaurus/utils');
const {structure, alignHeadings} = require('../structure.cjs');
const {protectionSignature} = require('../protection.cjs');

const root = path.resolve(__dirname, '../../..');

// Compile through Docusaurus itself: comparing two calls to structure() would
// miss a parser difference shared by source and translation, as the deploy did.
async function nativeHeadingIds(raw, extension) {
    const {visit} = await import('unist-util-visit');
    const {data, content} = matter(raw);
    const format = getFormat({filePath: `doc${extension}`, frontMatterFormat: data.mdx?.format,
        markdownConfigFormat: 'detect'});
    const ids = [];
    const processor = await createProcessorUncached({format, options: {
        siteDir: root, staticDirs: [path.join(root, 'static')], admonitions: true,
        markdownConfig: {format: 'detect', anchors: {maintainCase: false}, mermaid: false,
            mdx1Compat: {comments: true}},
        rehypePlugins: [() => tree => {
            visit(tree, 'element', node => {
                if (/^h[1-6]$/.test(node.tagName)) ids.push(node.properties.id ?? '');
            });
        }],
    }});
    await processor.process({content: format === 'mdx' ? escapeMarkdownHeadingIds(content) : content,
        filePath: path.join(root, `docs/heading-fixture${extension}`), frontMatter: data, compilerName: 'server'});
    return ids;
}

for (const extension of ['.md', '.mdx']) {
    test(`${extension} heading alignment matches native directives, duplicate IDs and explicit IDs`, async () => {
        const source = '## SSL connection error:protocol version mismatch\n\n'
            + '## SSL connection error:protocol version mismatch\n\n'
            + '## See :abbr[SQL] {#CaseID}\n\n'
            + ':::note\n## Nested heading\n:::\n\n```md\n## Not a heading\n```\n';
        const target = '## SSL 接続エラー: protocol version mismatch\n\n'
            + '## SSL 接続エラー: protocol version mismatch\n\n'
            + '## :abbr[SQL] を参照\n\n'
            + ':::note\n## 入れ子の見出し\n:::\n\n```md\n## Not a heading\n```\n';
        const parsed = await structure(source, extension);
        const expected = await nativeHeadingIds(source, extension);
        assert.deepEqual(expected, ['ssl-connection-error-version-mismatch',
            'ssl-connection-error-version-mismatch-1', 'CaseID', 'nested-heading']);
        assert.deepEqual(parsed.headings.map(heading => heading.id), expected);
        const aligned = await alignHeadings(parsed, target, extension);
        assert.deepEqual(await nativeHeadingIds(aligned, extension), expected);
        assert.equal(protectionSignature(await structure(aligned, extension)), protectionSignature(parsed));
        assert(aligned.includes('```md\n## Not a heading\n```'));
    });
}

test('BI FAQ reproducer preserves its legacy fingerprint and native English anchor', async () => {
    const source = '### Q2. SSL connection error:protocol version mismatch Failed to connect to the MySQL server\n';
    const target = '### Q2. SSL 接続エラー: protocol version mismatch Failed to connect to the MySQL server\n';
    const parsed = await structure(source, '.md');
    assert.equal(parsed.technicalHash, '09f2b78fdc50b79811dc2e8c696e4e38ceb2fb060f36c45219ac232eb0f076b9');
    assert.equal(parsed.semanticHash, '0cf300eea389c68ece856262d11a140d0213d6d6111cf79497785c4e6a858b76');
    const expected = await nativeHeadingIds(source, '.md');
    assert.deepEqual(expected, ['q2-ssl-connection-error-version-mismatch-failed-to-connect-to-the-mysql-server']);
    assert.deepEqual(parsed.headings.map(heading => heading.id), expected);
    const aligned = await alignHeadings(parsed, target, '.md');
    assert.deepEqual(await nativeHeadingIds(aligned, '.md'), expected);
    assert.equal(protectionSignature(await structure(aligned, '.md')), protectionSignature(parsed));
});
