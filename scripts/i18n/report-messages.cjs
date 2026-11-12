const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {mapReportText} = require('../../src/components/community-report-next/report-localization');
const reportDirectory = 'src/pages/community-report/_reports';
function reportSources(root) {
    return fs.readdirSync(path.join(root, reportDirectory)).filter(file => /^\d{4}-\d{2}-\d{2}\.mdx$/.test(file))
        .sort().map(file => `${reportDirectory}/${file}`);
}
function readReport(root, file) {
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    const ast = ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const entry = {};
    function visit(node) {
        if (ts.isVariableDeclaration(node) && ['label', 'week', 'stats', 'report'].includes(node.name.getText(ast))) {
            const value = node.initializer;
            entry[node.name.getText(ast)] = ts.isStringLiteral(value) ? value.text : JSON.parse(value.getText(ast));
        }
        ts.forEachChild(node, visit);
    }
    visit(ast);
    if (!entry.label || !entry.report?.summary) throw new Error(`Incomplete structured report: ${file}`);
    return entry;
}
function reportMessages(root, ids) {
    const messages = new Map();
    for (const file of reportSources(root)) {
        const id = path.basename(file, '.mdx');
        if (ids && !ids.includes(id)) continue;
        mapReportText(id, readReport(root, file), (key, value) => {
            if (messages.has(key) && messages.get(key) !== value) throw new Error(`Report message identity collision: ${key}`);
            messages.set(key, value); return value;
        });
    }
    return messages;
}
module.exports = {reportDirectory, reportSources, readReport, reportMessages};
