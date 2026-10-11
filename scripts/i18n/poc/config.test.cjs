const assert = require('node:assert/strict');
const test = require('node:test');
const plugin = require('../../../config/custom-docusaurus-plugin');

function paths(baseUrl) {
    return plugin({ siteConfig: { baseUrl } }).configureWebpack({ output: {} }).output;
}

test('production CDN paths stay equivalent for English and Chinese; Japanese uses its own prefix', () => {
    const original = process.env.DORIS_ASSET_ORIGIN;
    delete process.env.DORIS_ASSET_ORIGIN;
    try {
        for (const [base, expected] of [['/', 'https://cdnd.selectdb.com/'], ['/zh-CN/', 'https://cdnd.selectdb.com/zh-CN/'], ['/ja/', 'https://cdnd.selectdb.com/ja/']]) {
            assert.equal(paths(base).publicPath, expected);
            assert.equal(paths(base).workerPublicPath, base);
        }
    } finally {
        if (original === undefined) delete process.env.DORIS_ASSET_ORIGIN;
        else process.env.DORIS_ASSET_ORIGIN = original;
    }
});

test('local static and single-locale previews load their own same-origin assets', () => {
    const original = process.env.DORIS_ASSET_ORIGIN;
    process.env.DORIS_ASSET_ORIGIN = '';
    try {
        assert.equal(paths('/ja/').publicPath, '/ja/');
        assert.equal(paths('/').publicPath, '/');
        assert.equal(paths('/ja/').workerPublicPath, '/ja/');
        process.env.DORIS_ASSET_ORIGIN = 'http://127.0.0.1:8000/';
        assert.equal(paths('/ja/').publicPath, 'http://127.0.0.1:8000/ja/');
        assert.equal(paths('/ja/').workerPublicPath, '/ja/');
    } finally {
        if (original === undefined) delete process.env.DORIS_ASSET_ORIGIN;
        else process.env.DORIS_ASSET_ORIGIN = original;
    }
});

test('SSR bootstrap, preload and stylesheet URLs use the same origin as webpack', () => {
    const original = process.env.DORIS_ASSET_ORIGIN;
    const templatePath = require.resolve('../../../config/ssrTemplate');
    const { render } = require('eta');
    try {
        for (const origin of [undefined, '', 'http://127.0.0.1:8000/']) {
            if (origin === undefined) delete process.env.DORIS_ASSET_ORIGIN;
            else process.env.DORIS_ASSET_ORIGIN = origin;
            delete require.cache[templatePath];
            const { ssrTemplate } = require(templatePath);
            const html = render(ssrTemplate, {
                htmlAttributes: 'lang="ja"', bodyAttributes: '', version: '3.6.3',
                baseUrl: '/ja/', headTags: '', metaAttributes: [], preBodyTags: '',
                postBodyTags: '', appHtml: '<main>test</main>', noIndex: false,
                stylesheets: ['assets/css/main.css'], scripts: ['assets/js/main.js'],
            });
            const prefix = origin === undefined ? 'https://cdnd.selectdb.com' : origin.replace(/\/$/, '');
            assert(html.includes(`href="${prefix}/ja/assets/css/main.css"`));
            assert(html.includes(`href="${prefix}/ja/assets/js/main.js" as="script"`));
            assert(html.includes(`src="${prefix}/ja/assets/js/main.js"`));
            assert.equal(paths('/ja/').publicPath, `${prefix}/ja/`);
        }
    } finally {
        delete require.cache[templatePath];
        if (original === undefined) delete process.env.DORIS_ASSET_ORIGIN;
        else process.env.DORIS_ASSET_ORIGIN = original;
    }
});
