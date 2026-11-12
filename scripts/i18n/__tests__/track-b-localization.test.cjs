const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {localizeTrackBTask, trackBSourceTask} = require('../../../src/components/course/hackathon/track-b-localization');
const {trackBMessages} = require('../track-b-messages.cjs');
const root = path.resolve(__dirname, '../../..');
function loadTasks() {
    const source = fs.readFileSync(path.join(root, 'src/components/course/hackathon/tasks/trackB.tsx'), 'utf8');
    const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true}}).outputText;
    const module = {exports: {}};
    new Function('require', 'module', 'exports', output)(name => name === '@docusaurus/Translate'
        ? {translate: () => 'TRANSLATED_UI_ONLY'} : require(name), module, module.exports);
    return module.exports;
}
for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) test(`${locale} task text is complete while copied documentation and PR templates keep English source metadata`, () => {
    const dictionary = JSON.parse(fs.readFileSync(path.join(root, `i18n/${locale}/code.json`)));
    for (const [id] of trackBMessages(root)) assert(dictionary[id]?.message?.trim(), id);
    const {TRACK_B_TASKS, sectionTemplate, prTemplate} = loadTasks();
    for (const task of TRACK_B_TASKS) {
        const before = JSON.stringify(task);
        const localized = localizeTrackBTask(task, (id, message) => dictionary[id]?.message ?? message);
        const source = trackBSourceTask(localized, TRACK_B_TASKS);
        assert.equal(source, task);
        assert.equal(JSON.stringify(task), before);
        const section = sectionTemplate(source).code, pr = prTemplate(source).code;
        assert(section.includes('## Step-by-step demo {#demo}'));
        task.proves.forEach((line, index) => assert(section.includes(`### ${index + 1}. ${line}`)));
        assert(pr.includes('- [x] English') && pr.includes('- [ ] Chinese'));
        assert(pr.includes(task.doc.label) && pr.includes(task.title));
        assert(!section.includes('TRANSLATED_UI_ONLY') && !pr.includes('TRANSLATED_UI_ONLY'));
        assert(!/[\u3400-\u9fff]/.test(section + pr));
    }
});
