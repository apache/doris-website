const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
// Shared chrome and URL services are deliberately outside the body compilation.
const shell = /^(src\/theme\/|src\/utils\/|src\/components\/(brand-theme\/|home-next\/(LayoutNext|NavbarNext|PageLanguageSwitcher|LanguageMenu|PageContent|LocalizedLink|SlackCommunityNudge)\b))/;
const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx', '/index.tsx', '/index.ts', '/index.js'];
function resolveLocal(root, file, name) {
    const base = name.startsWith('@site/') ? path.join(root, name.slice(6))
        : name.startsWith('.') ? path.resolve(path.dirname(file), name) : undefined;
    return base && extensions.map(extension => base + extension).find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}
function isBody(root, file) {return !shell.test(path.relative(root, file).split(path.sep).join('/'));}
function references(source, file) {
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : file.endsWith('.js') ? ts.ScriptKind.JSX : ts.ScriptKind.TS);
    const refs = [];
    function visit(node) {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) refs.push(node.moduleSpecifier);
        if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(ast) === 'require')
            && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) refs.push(node.arguments[0]);
        ts.forEachChild(node, visit);
    }
    visit(ast);
    return {ast, refs};
}
function bodyDependencies(root, entry, {shared = false} = {}) {
    const files = new Set(), messages = new Map();
    function scan(file) {
        if (files.has(file) || (!shared && !isBody(root, file))) return;
        files.add(file);
        if (!/\.(?:[jt]sx?|json|css|scss|html?)$/.test(file)) return;
        const source = fs.readFileSync(file, 'utf8');
        // Iframe HTML, its scripts/styles, and local media are publication
        // dependencies even when referenced as URLs rather than JS imports.
        for (const match of source.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']|["'](\/(?:animations|images|files)\/[^"'?#]+)(?:[?#][^"']*)?["']|url\(["']?([^"'()]+)["']?\)/g)) {
            const href = (match[1] ?? match[2] ?? match[3]).split(/[?#]/)[0];
            if (/^(?:[a-z]+:|\/\/)/i.test(href)) continue;
            const resource = href.startsWith('/') ? path.join(root, 'static', href) : path.resolve(path.dirname(file), href);
            if (resource.startsWith(root + path.sep) && fs.existsSync(resource) && fs.statSync(resource).isFile()) scan(resource);
        }
        if (!/\.[jt]sx?$/.test(file)) return;
        const {ast, refs} = references(source, file);
        for (const ref of refs) {const next = resolveLocal(root, file, ref.text); if (next) scan(next);}
        function visit(node) {
            if (ts.isCallExpression(node) && node.expression.getText(ast) === 'translate' && node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
                const props = node.arguments[0].properties;
                const value = key => props.find(p => p.name?.getText(ast) === key)?.initializer?.text;
                if (value('id')) messages.set(value('id'), value('message') ?? '');
            }
            if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(ast) === 'Translate') {
                const id = node.attributes.properties.find(p => p.name?.getText(ast) === 'id')?.initializer?.text;
                const message = ts.isJsxElement(node.parent) ? node.parent.children.map(child => ts.isJsxText(child) ? child.text
                    : ts.isJsxExpression(child) && child.expression && ts.isStringLiteral(child.expression) ? child.expression.text : '').join('').trim() : '';
                if (id) messages.set(id, message);
            }
            ts.forEachChild(node, visit);
        }
        visit(ast);
    }
    scan(path.join(root, entry));
    return {files: [...files].map(file => path.relative(root, file).split(path.sep).join('/')).sort(), messages};
}
function transformBody({root, file, source, english, englishI18n}) {
    const {ast, refs} = references(source, file);
    const edits = [];
    for (const ref of refs) {
        let replacement;
        if (english && ref.text === '@docusaurus/Translate') replacement = '@site/src/utils/englishTranslation';
        else if (english && ref.text === '@docusaurus/useDocusaurusContext') replacement = '@site/src/utils/useEnglishContentContext';
        else if (english && ref.text === '@generated/i18n') replacement = englishI18n;
        else if (english && /(?:@site\/src\/utils\/|\.\.\/utils\/)localization$/.test(ref.text)) replacement = '@site/src/utils/englishLocalization';
        else if (ref.text === '@docusaurus/Link') replacement = '@site/src/components/home-next/LocalizedLink';
        else {
            const next = resolveLocal(root, file, ref.text);
            if (next && isBody(root, next) && /\.[jt]sx?$/.test(next)) replacement = ref.text + '?doris-body=' + (english ? 'en' : 'target');
        }
        if (replacement) edits.push([ref.getStart(ast), ref.getEnd(), JSON.stringify(replacement)]);
    }
    let anchors = false;
    function visit(node) {
        if ((ts.isJsxOpeningElement(node) || ts.isJsxClosingElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(ast) === 'a') {
            anchors = true; edits.push([node.tagName.getStart(ast), node.tagName.getEnd(), '__DorisContentLink']);
        }
        ts.forEachChild(node, visit);
    }
    visit(ast);
    for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) source = source.slice(0, start) + text + source.slice(end);
    return (anchors ? 'import __DorisContentLink from "@site/src/components/home-next/LocalizedLink";\n' : '') + source;
}
function validateMessages(root, registration, locale) {
    const {files, messages} = bodyDependencies(root, registration.sourcePath);
    if (registration.id === 'P20')
        require('./track-b-messages.cjs').trackBMessages(root).forEach((source, id) => messages.set(id, source));
    if (registration.id === 'P05')
        require('./user-story-messages.cjs').userStoryMessages(root).forEach((source, id) => messages.set(id, source));
    if (registration.id === 'P14') {
        const reports = require('./report-messages.cjs');
        const coverage = JSON.parse(fs.readFileSync(path.join(root, 'translations/community-reports.json'), 'utf8'));
        const ids = coverage.translatedReports[locale] ?? [];
        const available = new Set(reports.reportSources(root).map(file => path.basename(file, '.mdx')));
        if (new Set(ids).size !== ids.length || ids.some(id => !available.has(id)))
            throw new Error(`Invalid translated report identities: ${locale}`);
        reports.reportMessages(root, ids).forEach((source, id) => messages.set(id, source));
        files.push(...reports.reportSources(root));
    }
    const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'i18n', locale, 'code.json'), 'utf8'));
    const placeholders = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort().join();
    for (const [id, source] of messages) {
        if (typeof dictionary[id]?.message !== 'string' || !dictionary[id].message.trim() || (source && placeholders(source) !== placeholders(dictionary[id].message)))
            throw new Error(`Incomplete page messages: ${registration.id}/${locale}/${id}`);
    }
    const required = [...new Set([...files, ...(registration.sourceFiles ?? [])])].sort();
    require('./embedded-messages.cjs').validateEmbeddedMessages(root, required, locale);
    return required;
}
module.exports = {bodyDependencies, transformBody, validateMessages};
