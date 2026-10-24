const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {validateEmbeddedMessages} = require('../embedded-messages.cjs');
const root = path.resolve(__dirname, '../../..');
test('every live illustration label is translated in Japanese, Korean and Russian', () => {
    const frames = fs.readdirSync(path.join(root, 'static/home-next')).map(file => 'static/home-next/' + file);
    for (const locale of ['ja', 'ko', 'ru']) assert.doesNotThrow(() => validateEmbeddedMessages(root, frames, locale));
});
test('a new untranslated visible frame label blocks ready publication', t => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'embedded-messages-'));
    t.after(() => fs.rmSync(fixture, {recursive: true, force: true}));
    fs.mkdirSync(path.join(fixture, 'static/home-next'), {recursive: true});
    fs.mkdirSync(path.join(fixture, 'static/js'), {recursive: true});
    fs.copyFileSync(path.join(root, 'static/js/embedded-locale.js'), path.join(fixture, 'static/js/embedded-locale.js'));
    const file = 'static/home-next/test.html';
    fs.writeFileSync(path.join(fixture, file), '<p>New visible control</p>');
    assert.throws(() => validateEmbeddedMessages(fixture, [file], 'ja'), /Incomplete embedded message.*New visible control/);
    fs.writeFileSync(path.join(fixture, file), '<p>Kafka</p>');
    assert.doesNotThrow(() => validateEmbeddedMessages(fixture, [file], 'ja'));
    assert.doesNotThrow(() => validateEmbeddedMessages(fixture, [file], 'en'));
    assert.throws(() => validateEmbeddedMessages(fixture, [file], 'zh-CN'), /Missing embedded locale/);
});
