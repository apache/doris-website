const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
function load(file, imports = {}) {
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    const output = ts.transpileModule(raw, {compilerOptions: {module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true}}).outputText;
    const module = {exports: {}};
    new Function('require', 'module', 'exports', output)(name => imports[name] ?? require(name), module, module.exports);
    return module.exports;
}
function translator(locale) {
    const dictionary = JSON.parse(fs.readFileSync(path.join(root, `i18n/${locale}/code.json`)));
    return {translate: ({id}, values = {}) => {
        assert(dictionary[id]?.message?.trim(), `${locale}/${id}`);
        return dictionary[id].message.replace(/\{(\w+)\}/g, (token, name) => values[name] ?? token);
    }};
}
function withoutLabels(value) {
    if (Array.isArray(value)) return value.map(withoutLabels);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
        .filter(([key]) => key !== 'label').map(([key, item]) => [key, withoutLabels(item)]));
    return value;
}
test('localized download selectors preserve every source value, URL and canonical enum', () => {
    const data = load('src/constant/download.data.ts');
    const options = [...data.ACTIVE_TOOL_VERSIONS, ...data.ARCHIVED_TOOL_VERSIONS];
    const before = JSON.stringify(options);
    for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) {
        const labels = load('src/components/download-form/download-labels.ts', {
            '@docusaurus/Translate': translator(locale), '@site/src/constant/download.data': data,
        });
        const localized = labels.localizeDownloadOptions(options);
        assert.equal(JSON.stringify(options), before, 'Shared source data mutated');
        assert.deepEqual(withoutLabels(localized), withoutLabels(options));
        let count = 0;
        function compare(source, target) {
            source.forEach((item, index) => {
                if (/^For (Flink|Spark) /.test(item.label)) {assert.notEqual(target[index].label, item.label); count++;}
                else assert.equal(target[index].label, item.label);
                if (item.children) compare(item.children, target[index].children);
            });
        }
        compare(options, localized);
        assert(count > 0, 'Actual compatibility labels were not exercised');
        assert.equal(data.DownloadTypeEnum.Binary, 'Binary');
        assert.equal(data.DownloadTypeEnum.Source, 'Source');
        assert.notEqual(labels.DOWNLOAD_TYPE_LABELS.Binary, 'Binary');
        assert.notEqual(labels.DOWNLOAD_TYPE_LABELS.Source, 'Source');
    }
});

test('owned Profile diagnostics from parser, upload, recovery and layout are localized in every page language', () => {
    const files = ['ProfileDag.tsx', 'ProfileUploader.tsx', 'AiAnalysisForm.tsx', 'profile-analysis.api.ts',
        'profile-analysis.file.ts', 'profile-analysis.parser-client.ts', 'profile-analysis.parser.ts',
        'profile-analysis.storage.ts', 'use-profile-analysis.ts'];
    const messages = new Set();
    for (const file of files) {
        const raw = fs.readFileSync(path.join(root, 'src/components/profile-analysis', file), 'utf8');
        const ast = ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        function visit(node) {
            if (ts.isStringLiteral(node) && /^(?:The |This |An |Select |Complete |Human |Unable |Profile ).+[.!]$/.test(node.text)
                && node.text !== 'The operation was aborted.') {
                let translated = false;
                for (let parent = node.parent; parent; parent = parent.parent)
                    if (ts.isCallExpression(parent) && parent.expression.getText(ast) === 'translate') translated = true;
                if (!translated) messages.add(node.text);
            }
            ts.forEachChild(node, visit);
        }
        visit(ast);
    }
    assert(messages.size >= 30, 'Owned error sources were not fully enumerated');
    for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) {
        const {localizeProfileMessage} = load('src/components/profile-analysis/profile-analysis.messages.ts', {
            '@docusaurus/Translate': translator(locale),
        });
        for (const message of messages) assert(!localizeProfileMessage(message).includes(message), `${locale}: ${message}`);
        assert(localizeProfileMessage('Profile analysis failed (HTTP 503). Please try again.').includes('HTTP 503'));
        assert(localizeProfileMessage('Vendor-specific diagnostic 123').includes('Vendor-specific diagnostic 123'));
    }
});

test('data-driven guide/checklist text and copy feedback cannot bypass message admission', () => {
    let feedback = 0;
    for (const file of ['src/components/download-form/download-form-all-release.tsx',
        'src/components/download-form/download-form-tools.tsx']) {
        const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        function visitFeedback(node) {
            if (ts.isCallExpression(node) && node.expression.getText(ast) === 'message.success') {
                feedback++;
                assert(ts.isCallExpression(node.arguments[0]) && node.arguments[0].expression.getText(ast) === 'translate', file);
            }
            ts.forEachChild(node, visitFeedback);
        }
        visitFeedback(ast);
    }
    assert.equal(feedback, 3);
    const guideFile = 'src/components/download-form-next/DownloadFormNext.tsx';
    const guides = ts.createSourceFile(guideFile, fs.readFileSync(path.join(root, guideFile), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let descriptions = 0;
    function visitGuides(node) {
        if (ts.isVariableDeclaration(node) && node.name.getText(guides) === 'GUIDES') {
            for (const entry of node.initializer.elements) {
                const description = entry.properties.find(p => p.name?.getText(guides) === 'desc').initializer;
                assert(ts.isCallExpression(description) && description.expression.getText(guides) === 'translate');
                descriptions++;
            }
        }
        ts.forEachChild(node, visitGuides);
    }
    visitGuides(guides);
    assert.equal(descriptions, 3);
    const file = 'src/components/course/hackathon/HackathonTrackBPage.tsx';
    const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let checklist = 0;
    function visitChecklist(node) {
        if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(p => p.name?.getText(ast) === 'id' && p.initializer?.text === 'done')) {
            function check(child) {
                if (ts.isArrayLiteralExpression(child)) {
                    child.elements.forEach(item => assert(ts.isCallExpression(item) && item.expression.getText(ast) === 'translate'));
                    checklist += child.elements.length;
                }
                ts.forEachChild(child, check);
            }
            check(node);
        }
        ts.forEachChild(node, visitChecklist);
    }
    visitChecklist(ast);
    assert.equal(checklist, 4);
});
