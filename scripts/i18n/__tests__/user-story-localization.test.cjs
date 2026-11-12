const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {userStoryMessages} = require('../user-story-messages.cjs');
const {validateMessages} = require('../page-body.cjs');
const root = path.resolve(__dirname, '../../..');
test('all published customer-story languages cover the complete source catalogue', () => {
    const messages = userStoryMessages(root);
    assert(messages.size >= 136);
    for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) {
        const dictionary = JSON.parse(fs.readFileSync(path.join(root, `i18n/${locale}/code.json`)));
        const script = locale === 'ko' ? /[\uac00-\ud7af]/ : locale === 'ru' ? /[\u0400-\u04ff]/ : /[\u3400-\u9fff]/;
        for (const [id] of messages) assert(script.test(dictionary[id]?.message ?? ''), `${locale}/${id}`);
    }
});
test('an untranslated customer story blocks publication in every target language', t => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-user-story-zh-'));
    t.after(() => fs.rmSync(fixture, {recursive: true, force: true}));
    fs.mkdirSync(path.join(fixture, 'src/constant'), {recursive: true});
    fs.writeFileSync(path.join(fixture, 'src/constant/users.data.json'), JSON.stringify([{name: 'A company', story: 'Its source story.'}]));
    fs.mkdirSync(path.join(fixture, 'src/pages'), {recursive: true});
    fs.writeFileSync(path.join(fixture, 'src/pages/index.tsx'), 'export default function Page(){return null;}');
    for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) {
        fs.mkdirSync(path.join(fixture, `i18n/${locale}`), {recursive: true});
        fs.writeFileSync(path.join(fixture, `i18n/${locale}/code.json`), '{}');
        assert.throws(() => validateMessages(fixture, {id: 'P05', sourcePath: 'src/pages/index.tsx'}, locale),
            error => error.message.includes(`Incomplete page messages: P05/${locale}/landing.userStory.A%20company`));
    }
});
