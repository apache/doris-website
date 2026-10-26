const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {locales} = require('../../config/i18n');
const {readJson,readManualRecords} = require('./manual-state.cjs');
function analyzeImpact(root, base, files) {
    const previous = file => {
        // A genuinely new file has no base blob; malformed JSON must fail closed.
        try {execFileSync('git', ['cat-file', '-e', `${base}:${file}`], {cwd: root, stdio: 'ignore'});} catch {return null;}
        return JSON.parse(execFileSync('git', ['show', `${base}:${file}`], {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}));
    };
    const registry = readJson(root, 'translations/pages/registry.json', {pages: []});
    const oldRegistry = previous('translations/pages/registry.json') ?? {pages: []};
    const state = ['pages', 'blog'].flatMap(kind => readManualRecords(root,kind));
    const oldState = ['pages', 'blog'].flatMap(kind => readManualRecords(root,kind,base));
    const wanted = new Set(), affected = [], manualPending = [];
    let complete = true, structural = false;
    for (const file of files) {
        const match = file.match(/^i18n\/([^/]+)\/code.json$/);
        if (match) {wanted.add(match[1]); affected.push({file, locale: match[1], dependency: 'locale messages'}); continue;}
        if(/^translations\/blog\/pages\/.+\.json$/.test(file)){
            for(const record of [previous(file)?.page,readJson(root,file,null)?.page].filter(Boolean))wanted.add(record.locale);
            wanted.add('en');continue;
        }
        if (/^translations\/(pages|blog)\/state.json$/.test(file)) {
            const before = previous(file)?.pages ?? [], after = readJson(root, file, {pages: []}).pages;
            const identities = new Set([...before, ...after].map(r => JSON.stringify([r.contentId, r.locale])));
            for (const id of identities) {
                const find = rows => rows.find(row => JSON.stringify([row.contentId, row.locale]) === id);
                if (JSON.stringify(find(before)) !== JSON.stringify(find(after))) wanted.add(JSON.parse(id)[1]);
            }
            wanted.add('en'); continue;
        }
        const owners = [...registry.pages, ...oldRegistry.pages].filter(page => page.sourcePath === file || page.sourceFiles?.includes(file));
        const records = [...state, ...oldState].filter(row => row.sourceFiles.includes(file));
        if (!owners.length && !records.length) {complete = false; continue;}
        wanted.add('en');
        // Translated pages reuse the source TSX/CSS/data implementation. Their
        // text may be independent, but a layout/resource edit still renders
        // in every language. Independent blog Markdown only affects fallbacks.
        const sharedImplementation = owners.length > 0 || !/\.mdx?$/.test(file);
        const ids = new Set([...owners.map(page => `${page.kind}:${page.id}`), ...records.map(row => row.contentId)]);
        for (const contentId of ids) for (const locale of locales.filter(locale => locale !== 'en')) {
            const record = state.find(row => row.contentId === contentId && row.locale === locale);
            const fallback = !record || ['missing', 'blocked'].includes(record.state);
            if (fallback || sharedImplementation) wanted.add(locale);
            if (!fallback) manualPending.push({contentId, locale, file, action: 'manual sync'});
            affected.push({file, contentId, locale, fallback, sharedImplementation});
        }
        const exists = fs.existsSync(path.join(root, file));
        let existed = true;
        try {execFileSync('git', ['cat-file', '-e', `${base}:${file}`], {cwd: root, stdio: 'ignore'});} catch {existed = false;}
        if (!exists || !existed) structural = true;
        else if (/\.mdx?$/.test(file)) {
            // Slug/date/draft/title and other native metadata can change routes,
            // lists and SEO even when the target article body is independent.
            const header = text => (text.replace(/^\uFEFF/, '').match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0] ?? '').replace(/\r\n/g, '\n');
            const before = execFileSync('git', ['show', `${base}:${file}`], {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
            if (header(before) !== header(fs.readFileSync(path.join(root, file), 'utf8'))) structural = true;
        }
    }
    if (structural) locales.forEach(locale => wanted.add(locale));
    return {schemaVersion: 1, complete, structural, locales: locales.filter(locale => wanted.has(locale)), affected, manualPending};
}
module.exports = {analyzeImpact};
