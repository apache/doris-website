const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {userStoryMessages} = require('../user-story-messages.cjs');
const {validateMessages} = require('../page-body.cjs');
const root = path.resolve(__dirname, '../../..');
test('Chinese customer stories cover the complete source catalogue', () => {
    const messages = userStoryMessages(root);
    const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'i18n/zh-CN/code.json')));
    assert(messages.size >= 136);
    for (const [id] of messages) assert(/[\u3400-\u9fff]/.test(dictionary[id]?.message ?? ''), id);
});
test('an untranslated customer story blocks native Chinese publication', t => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-user-story-zh-'));
    t.after(() => fs.rmSync(fixture, {recursive: true, force: true}));
    fs.mkdirSync(path.join(fixture, 'src/constant'), {recursive: true});
    fs.writeFileSync(path.join(fixture, 'src/constant/users.data.json'), JSON.stringify([{name: 'A company', story: 'Its source story.'}]));
    fs.mkdirSync(path.join(fixture, 'src/pages'), {recursive: true});
    fs.writeFileSync(path.join(fixture, 'src/pages/index.tsx'), 'export default function Page(){return null;}');
    fs.mkdirSync(path.join(fixture, 'i18n/zh-CN'), {recursive: true});
    fs.writeFileSync(path.join(fixture, 'i18n/zh-CN/code.json'), '{}');
    assert.throws(() => validateMessages(fixture, {id: 'P05', sourcePath: 'src/pages/index.tsx'}, 'zh-CN'),
        /Incomplete page messages: P05\/zh-CN\/landing\.userStory\.A%20company/);
});
