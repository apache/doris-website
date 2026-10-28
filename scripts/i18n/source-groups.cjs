const fs = require('node:fs');
const path = require('node:path');
const {identity, loadRecords, decide, stateFileFor} = require('./state.cjs');
const {scriptUnits} = require('./code-prose.cjs');

function matchesSource(group, file) {
    const suffix = file.startsWith(`${group.sourceRoot}/`) && file.slice(group.sourceRoot.length + 1);
    return !!suffix && !suffix.split('/').some(part => part.startsWith('_') || part === '..')
        && (!group.include || group.include.some(prefix => prefix.endsWith('/') ? suffix.startsWith(prefix) : suffix === prefix))
        && (group.kind === 'code' ? /(?<!\.d)\.tsx?$/.test(suffix) && !/\.(test|logic)\./.test(suffix) : /\.mdx?$/.test(suffix));
}
function sourceFiles(root, group) {
    const walk = dir => !fs.existsSync(path.join(root, dir)) ? [] : fs.readdirSync(path.join(root, dir), {withFileTypes: true})
        .flatMap(entry => entry.isDirectory() ? entry.name.startsWith('_') ? [] : walk(`${dir}/${entry.name}`)
            : entry.isFile() && matchesSource(group, `${dir}/${entry.name}`) ? [`${dir}/${entry.name}`] : []);
    return walk(group.sourceRoot).sort();
}
function pageFor(group, sourcePath, locale) {
    const suffix = sourcePath.slice(group.sourceRoot.length + 1);
    const docId = suffix.replace(/\.(mdx?|tsx?)$/, '');
    return {pluginId: group.pluginId, version: group.version, docId, locale, sourceLocale: 'en', sourcePath,
        englishPath: sourcePath, targetPath: `i18n/${locale}/docusaurus-plugin-content-docs-${group.pluginId}/current/${suffix}`,
        kind: group.kind, draft: false, unlisted: true,
        permalink: `/${locale}${group.routeBasePath}/#${encodeURIComponent(docId)}`,
        englishPermalink: `${group.routeBasePath}/#${encodeURIComponent(docId)}`,
        sourcePermalink: `${group.routeBasePath}/#${encodeURIComponent(docId)}`};
}
function contentGroups(root, locale) {
    const file = path.join(root, `translations/scope/${locale}.json`);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).groups.filter(group => group.kind && group.kind!=='blog') : [];
}
function hasProse(root, group, file) {
    return group.kind !== 'code' || scriptUnits(fs.readFileSync(path.join(root, file), 'utf8')).length > 0;
}
async function collectSources(root, locale) {
    const groups = contentGroups(root, locale);
    if (!groups.length) return {pages: [], reports: [], versions: []};
    const {structure} = require('./structure.cjs');
    const records = loadRecords(root, locale), pages = [], reports = [], versions = [];
    for (const group of groups) {
        const sources = new Set();
        for (const file of sourceFiles(root, group)) {
            if (!hasProse(root, group, file)) continue;
            const page = pageFor(group, file, locale);
            sources.add(identity(page));
            const source = fs.readFileSync(path.join(root, file), 'utf8');
            const target = fs.existsSync(path.join(root, page.targetPath)) ? fs.readFileSync(path.join(root, page.targetPath), 'utf8') : undefined;
            const technicalHash = target === undefined ? undefined : (await structure(source, path.extname(file))).technicalHash;
            pages.push({...decide({page, source, target, record: records.get(identity(page)), technicalHash}), indexable: false});
        }
        for (const record of records.values()) {
            if (record.pluginId === group.pluginId && record.version === group.version && !sources.has(identity(record)))
                reports.push({kind: 'source_deleted', ...record});
        }
        versions.push({pluginId: group.pluginId, version: group.version, order: new Map()});
    }
    return {pages, reports, versions};
}

// Load only this module's shard during Webpack compilation, rather than every
// document record for each course component/report partial.
function readRecord(root, page) {
    const shard = stateFileFor(page);
    if (fs.existsSync(path.join(root, shard))) return JSON.parse(fs.readFileSync(path.join(root, shard), 'utf8')).page;
    const ledger = path.join(root, `translations/state/${page.locale}/docs.json`);
    return fs.existsSync(ledger) ? JSON.parse(fs.readFileSync(ledger, 'utf8')).pages.find(record => identity(record) === identity(page)) : undefined;
}

function translatedContentPages(root, locale) {
    const groups = contentGroups(root, locale);
    const complete = group => {
        const files = sourceFiles(root, group).filter(file => hasProse(root, group, file));
        return files.length > 0 && files.every(file => {
            const page = pageFor(group, file, locale), record = readRecord(root, page);
            if (!record || !fs.existsSync(path.join(root, page.targetPath))) return false;
            return decide({page, source: fs.readFileSync(path.join(root, file), 'utf8'),
                target: fs.readFileSync(path.join(root, page.targetPath), 'utf8'), record}).indexable;
        });
    };
    const ready = new Set(groups.filter(complete).map(group => group.pluginId));
    return [...(ready.has('course-ui') ? ['/course', ...['a1-hybrid-search', 'a2-mcp', 'a3-log-search', 'a4-agent-traces', 'track-b']
        .map(task => `/course/hackathon/${task}`)] : []),
    ...(ready.has('community-report') && ready.has('community-report-ui') ? ['/community-report'] : [])];
}

module.exports = {matchesSource, sourceFiles, pageFor, contentGroups, hasProse, collectSources, readRecord, translatedContentPages};
