const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const jsx = require('react/jsx-runtime');
const recovery = require('../../../config/download-recovery.json');
const plugin = require('../download-recovery-remark.cjs');
const key = 'apache-doris-4.1.5-bin-x64.tar.gz';
const old = 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/' + key;

async function render(source, options = {}) {
    const {evaluate} = await import('@mdx-js/mdx');
    const {format = 'mdx', ...settings} = options;
    const raw = format === 'md' ? [(await import('rehype-raw')).default] : [];
    const directive = (await import('remark-directive')).default;
    const result = await evaluate(source, {...jsx, format, rehypePlugins: raw, remarkPlugins: [directive, [plugin,
        {catalog: recovery, locale: 'en', label: 'Unavailable', notice: 'Package files are unavailable.', ...settings}]]});
    return renderToStaticMarkup(React.createElement(result.default));
}

test('missing download links and commands migrate together and display an explicit notice', async () => {
    const html = await render(`# Topic\n\n[Binary](${old})\n\n\`\`\`sh\ncurl ${old}\n\`\`\``);
    assert(!html.includes('aliyuncs.com'));
    assert(html.includes(recovery.baseUrl + key));
    assert(html.includes('role="note"'));
    assert(html.includes('aria-disabled="true"'));
    assert(!html.includes('<a '));
    assert(html.indexOf('<h1>') < html.indexOf('<blockquote'));
});

test('verified files remain real links and do not produce a missing-file notice', async () => {
    const catalog = {...recovery, objects: {[key]: {bytes: 123, sha256: 'a'.repeat(64), verified: true}}};
    const html = await render(`[Binary](${old})`, {catalog});
    assert(html.includes(`href="${recovery.baseUrl + key}"`));
    assert(!html.includes('role="note"'));
    assert(!html.includes('aria-disabled'));
});

test('native MDX anchors with static download attributes cannot keep broken active links', async () => {
    for (const href of [`"${old}"`, `{'${old}'}`]) {
        const html = await render(`<a href=${href}>Binary</a>`, {locale: 'ja', label: '利用不可'});
        assert(!html.includes('aliyuncs.com'));
        assert(!html.includes('<a '));
        assert(html.includes('lang="ja"'));
        assert(html.includes('利用不可'));
    }
});

test('ordinary internal and external links remain unchanged', async () => {
    const html = await render('[Guide](/docs/dev/intro)\n\n[Source](https://downloads.apache.org/doris/source.tar.gz)');
    assert(html.includes('href="/docs/dev/intro"'));
    assert(html.includes('href="https://downloads.apache.org/doris/source.tar.gz"'));
    assert(!html.includes('role="note"'));
});

test('admonition directive attributes remain compatible with the documentation pipeline', async () => {
    const html = await render(':::note{#tip}\nA documentation tip.\n:::\n\n[Guide](/docs/dev/intro)', {format: 'md'});
    assert(html.includes('A documentation tip.'));
    assert(html.includes('href="/docs/dev/intro"'));
    assert(!html.includes('aria-disabled'));
});

test('CommonMark links and raw HTML retain no active missing-download href', async () => {
    for (const source of [`[Binary](${old})`, `<a id="download" href="${old}">Binary</a>`]) {
        const html = await render(source, {format: 'md'});
        assert(html.includes('aria-disabled="true"'));
        assert(!html.includes('href='));
        assert(html.includes('role="note"'));
        assert(!html.includes('aliyuncs.com'));
    }
});
