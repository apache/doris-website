const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {locales} = require('../../config/i18n');
const {readJson} = require('./manual-state.cjs');
function analyzeImpact(root, base, files) {
    const previous = file => {
        // A genuinely new file has no base blob; malformed JSON must fail closed.
        try {execFileSync('git', ['cat-file', '-e', `${base}:${file}`], {cwd: root, stdio: 'ignore'});} catch {return null;}
        return JSON.parse(execFileSync('git', ['show', `${base}:${file}`], {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}));
    };
    const registry = readJson(root, 'translations/pages/registry.json', {pages: []});
    const oldRegistry = previous('translations/pages/registry.json') ?? {pages: []};
    const state = ['pages', 'blog'].flatMap(kind => readJson(root, `translations/${kind}/state.json`, {pages: []}).pages);
    const oldState = ['pages', 'blog'].flatMap(kind => previous(`translations/${kind}/state.json`)?.pages ?? []);
    const wanted = new Set(), affected = [], manualPending = [];
    let complete = true, structural = false;
    for (const file of files) {
        const match = file.match(/^i18n\/([^/]+)\/code.json$/);
        if (match) {wanted.add(match[1]); affected.push({file, locale: match[1], dependency: 'locale messages'}); continue;}
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
        const ids = new Set([...owners.map(page => `${page.kind}:${page.id}`), ...records.map(row => row.contentId)]);
        for (const contentId of ids) for (const locale of locales.filter(locale => locale !== 'en')) {
            const record = state.find(row => row.contentId === contentId && row.locale === locale);
            const fallback = !record || ['missing', 'blocked'].includes(record.state);
            if (fallback) wanted.add(locale); else manualPending.push({contentId, locale, file, action: 'manual sync'});
            affected.push({file, contentId, locale, fallback});
        }
        const exists = fs.existsSync(path.join(root, file));
        let existed = true;
        try {execFileSync('git', ['cat-file', '-e', `${base}:${file}`], {cwd: root, stdio: 'ignore'});} catch {existed = false;}
        if (!exists || !existed) structural = true;
    }
    if (structural) locales.forEach(locale => wanted.add(locale));
    return {schemaVersion: 1, complete, structural, locales: locales.filter(locale => wanted.has(locale)), affected, manualPending};
}
module.exports = {analyzeImpact};
