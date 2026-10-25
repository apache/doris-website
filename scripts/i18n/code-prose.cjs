// Extract visible text without asking a model to rewrite executable code.
const assert = require('node:assert/strict');
const ts = require('typescript');
const cheerio = require('cheerio');

const textFields = new Set(['title', 'shortTitle', 'name', 'description', 'label', 'summary', 'lead',
    'narrative', 'mergedNarrative', 'inProgressNarrative', 'caption', 'ariaLabel', 'aria-label',
    'alt', 'placeholder', 'readingTime', 'coachTitle', 'calloutTitle', 'question',
    'correctFeedback', 'incorrectFeedback', 'leftTitle', 'leftLead', 'rightTitle', 'rightLead',
    'note', 'membersIn', 'problem', 'fix', 'tab', 'term', 'text', 'pitch', 'titleLead', 'titleTail',
    'hook', 'short', 'body', 'checkpoint', 'tip', 'tests', 'data-label']);
const containers = new Set(['items', 'options', 'check', 'coach', 'callout', 'children', 'leftItems', 'rightItems']);
const decode = value => cheerio.load(`<span>${value}</span>`, {decodeEntities: true}, false)('span').text();
const escapeJsx = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');

function serialize(unit, value) {
    if (unit.quote === 'js-string') return JSON.stringify(value);
    if (unit.quote === 'jsx-attribute') return `"${escapeJsx(value)}"`;
    if (unit.quote === 'jsx-text') return escapeJsx(value);
    if (unit.quote === 'template-fragment') return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return value;
}

function parseScript(raw) {
    const file = ts.createSourceFile('content.tsx', raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    assert(!file.parseDiagnostics.length, 'Invalid TypeScript/JSX content');
    return file;
}

function staticData(node) {
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)
        || [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)) return true;
    if (ts.isArrayLiteralExpression(node)) return node.elements.every(staticData);
    return ts.isObjectLiteralExpression(node) && node.properties.every(property => ts.isPropertyAssignment(property)
        && !ts.isComputedPropertyName(property.name) && staticData(property.initializer));
}

function scriptUnits(raw, {report = false, expression = false} = {}) {
    const prefix = expression ? 'const __prose = (' : '';
    const file = parseScript(prefix + raw + (expression ? ');' : ''));
    const units = [];
    const propertyName = node => node?.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) ? node.name.text : '';
    function inCode(node) {
        for (let parent = node.parent; parent; parent = parent.parent) {
            if (ts.isJsxElement(parent) && /^(code|pre|CodeBlock)$/.test(parent.openingElement.tagName.getText(file))) return true;
        }
        return false;
    }
    function visible(node) {
        if (inCode(node)) return false;
        if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) return false;
        for (let parent = node.parent; parent; parent = parent.parent) {
            if (ts.isPropertyAssignment(parent)) {
                const object = parent.parent, call = object.parent;
                // Default UI text stays prose after adopting Docusaurus i18n.
                // Other `message` fields and translation IDs remain executable data.
                const translationMessage = propertyName(parent) === 'message' && ts.isObjectLiteralExpression(object)
                    && ts.isCallExpression(call) && call.arguments[0] === object && call.expression.getText(file) === 'translate';
                return translationMessage || textFields.has(propertyName(parent)) || containers.has(propertyName(parent))
                    || propertyName(parent) === 'file' && /\s/.test(node.text ?? '');
            }
            if (ts.isJsxAttribute(parent)) return textFields.has(parent.name.getText(file)) || containers.has(parent.name.getText(file));
            if (ts.isJsxExpression(parent)) return !ts.isJsxAttribute(parent.parent)
                || textFields.has(parent.parent.name.getText(file)) || containers.has(parent.parent.name.getText(file));
            if (ts.isCallExpression(parent) || ts.isImportDeclaration(parent) || ts.isElementAccessExpression(parent)) return false;
            if (ts.isVariableDeclaration(parent)) return expression || report && ['label', 'week'].includes(propertyName(parent));
            if (ts.isBindingElement(parent)) return textFields.has(propertyName(parent));
        }
        return false;
    }
    function add(start, end, text, quote) {
        start -= prefix.length; end -= prefix.length;
        if (start < 0 || end > raw.length || !/[A-Za-z\u0080-\uffff]/.test(text)) return;
        // URLs, inline code and numbers are protected separately by the engine.
        units.push({start, end, text, quote, kind: 'script:text'});
    }
    function visit(node) {
        if (report && ts.isVariableDeclaration(node)) {
            if (!['label', 'week', 'stats', 'report'].includes(propertyName(node)) || !node.initializer || !staticData(node.initializer)) return;
        }
        if (ts.isJsxText(node) && !inCode(node)) {
            const value = raw.slice(node.pos - prefix.length, node.end - prefix.length);
            const leading = /^\s*/.exec(value)[0].length, trailing = /\s*$/.exec(value)[0].length;
            if (value.trim()) add(node.pos + leading, node.end - trailing, decode(value.trim()), 'jsx-text');
        } else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && visible(node)) {
            const jsx = ts.isJsxAttribute(node.parent);
            add(node.getStart(file), node.end, jsx ? decode(node.text) : node.text, jsx ? 'jsx-attribute' : 'js-string');
        } else if ((ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) && visible(node)) {
            add(node.getStart(file) + 1, node.end - (ts.isTemplateTail(node) ? 1 : 2), node.text, 'template-fragment');
        }
        ts.forEachChild(node, visit);
    }
    visit(file);
    return units.sort((a, b) => a.start - b.start);
}

function canonicalScript(raw, options) {
    const units = scriptUnits(raw, options);
    let masked = raw;
    for (const unit of [...units].reverse()) masked = masked.slice(0, unit.start) + serialize(unit, 'DORIS_PROSE') + masked.slice(unit.end);
    const prefix = options?.expression ? 'const __prose = (' : '';
    const file = parseScript(prefix + masked + (options?.expression ? ');' : ''));
    return {code: ts.createPrinter({newLine: ts.NewLineKind.LineFeed}).printFile(file), prose: units.map(unit => unit.text),
        protectedText: units.flatMap(unit => unit.text.match(/`[^`]+`|https?:\/\/[^\s<>"')]+/g) || [])};
}

function reportEsm(raw) {
    return /^\s*export\s+const\s+(?:label|week|stats|report)\s*=/.test(raw);
}

module.exports = {textFields, containers, serialize, scriptUnits, canonicalScript, reportEsm, parseScript};
