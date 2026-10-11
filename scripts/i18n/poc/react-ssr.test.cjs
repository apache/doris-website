const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { PassThrough } = require('node:stream');
const { text } = require('node:stream/consumers');
const { patchReactSsr } = require('../../patch-react-ssr');
const root = path.dirname(require.resolve('react-dom/package.json'));

async function renderStream(renderer, app) {
    const stream = new PassThrough();
    const html = text(stream);
    const { pipe } = renderer.renderToPipeableStream(app, {
        onAllReady() { pipe(stream); },
        onError(error) { stream.destroy(error); },
    });
    return html;
}

for (const mode of ['production.min', 'development']) {
    test(`SSR ${mode} preserves CJK/emoji text and URLs across UTF-8 buffer boundaries`, async () => {
        const renderer = require(path.join(root, 'cjs', `react-dom-server.node.${mode}.js`));
        const legacy = require(path.join(root, 'cjs', `react-dom-server-legacy.node.${mode}.js`));
        for (let offset = 0; offset < 12; offset++) {
            const app = React.createElement('main', null,
                React.createElement('span', null, 'x'.repeat(offset)),
                ...Array.from({ length: 100 }, (_, index) => React.createElement('a', {
                    key: index, href: `/docs/tags/数据湖-日本語-한글-😀/${index}/`,
                }, '数据湖 日本語 한글 😀')));
            const html = await renderStream(renderer, app);
            assert(!html.includes('\0'), `Unexpected NUL at offset ${offset}`);
            assert.equal(html, legacy.renderToString(app));
        }
        // A dependency install may run twice in an existing worktree.
        const file = path.join(root, 'cjs', `react-dom-server.node.${mode}.js`);
        const before = fs.readFileSync(file, 'utf8');
        patchReactSsr(root);
        assert.equal(fs.readFileSync(file, 'utf8'), before);
    });
}
