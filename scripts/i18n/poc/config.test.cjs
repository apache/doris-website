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
