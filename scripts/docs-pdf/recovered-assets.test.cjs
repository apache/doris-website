const test = require('node:test');
const assert = require('node:assert/strict');
const {rewriteAssetReferences} = require('./recovered-assets.cjs');

test('archived exports use the verified originals without modifying unrelated URLs', () => {
    const previous = 'https://cdnd.selectdb.com/images/upload/dogstack/overview_logs.png';
    const text = `![Logs](${previous})\n${previous.replace('https:', 'http:')}\nhttps://example.test/image.png`;
    const rewritten = rewriteAssetReferences(text);
    assert.equal(rewritten, '![Logs](https://assets-cdn.selectdb.com/site/images/upload/dogstack/overview_logs.png)\n'
        + 'https://assets-cdn.selectdb.com/site/images/upload/dogstack/overview_logs.png\nhttps://example.test/image.png');
    assert.equal(rewriteAssetReferences(rewritten), rewritten);
});

test('only the recovered TAR pipeline loses its incorrect XZ flag', () => {
    const text = 'curl https://cdn.selectdb.com/static/doc_ddl_dir_d27a752a7b.tar -o - | tar -Jxf -\n'
        + 'tar -Jxf unrelated.tar.xz';
    assert.equal(rewriteAssetReferences(text), 'curl https://assets-cdn.selectdb.com/media/static/doc_ddl_dir_d27a752a7b.tar -o - | tar -xf -\n'
        + 'tar -Jxf unrelated.tar.xz');
});
