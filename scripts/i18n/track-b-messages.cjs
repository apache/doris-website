const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {localizeTrackBTask} = require('../../src/components/course/hackathon/track-b-localization');
function readTrackBTasks(root) {
    const file = 'src/components/course/hackathon/tasks/trackB.tsx';
    const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let array;
    function find(node) {if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'TRACK_B_TASKS') array = node.initializer; ts.forEachChild(node, find);}
    find(ast);
    if (!array || !ts.isArrayLiteralExpression(array)) throw new Error('Missing Track B source metadata');
    const property = (node, name) => node.properties.find(item => ts.isPropertyAssignment(item) && item.name.getText(ast) === name)?.initializer;
    const text = node => {if (!node || !ts.isStringLiteral(node)) throw new Error('Track B source text must stay literal English'); return node.text;};
    return array.elements.map(node => ({code: text(property(node, 'code')), id: text(property(node, 'id')),
        title: text(property(node, 'title')), time: text(property(node, 'time')),
        doc: {label: text(property(property(node, 'doc'), 'label'))},
        alsoSee: property(node, 'alsoSee')?.elements.map(doc => ({label: text(property(doc, 'label'))})),
        proves: property(node, 'proves').elements.map(text)}));
}
function trackBMessages(root) {
    const messages = new Map();
    for (const task of readTrackBTasks(root)) localizeTrackBTask(task, (id, source) => {messages.set(id, source); return source;});
    return messages;
}
module.exports = {readTrackBTasks, trackBMessages};
