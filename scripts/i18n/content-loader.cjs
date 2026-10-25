// Substitute a reviewed, current translation at the original resource path.
// Relative imports, source URLs and public routes therefore remain unchanged.
const fs = require('node:fs');
const path = require('node:path');
const {decide, stateFileFor} = require('./state.cjs');
const {structure} = require('./structure.cjs');
const {protectionSignature} = require('./protection.cjs');
const {matchesSource, pageFor, contentGroups, readRecord} = require('./source-groups.cjs');

async function localizedSource({root, locale, file, source, dependency = () => {}}) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const group = contentGroups(root, locale).find(group => matchesSource(group, relative));
    if (!group) return source;
    const page = pageFor(group, relative, locale);
    for (const name of [page.targetPath, stateFileFor(page), `translations/state/${locale}/docs.json`, `translations/scope/${locale}.json`])
        dependency(path.join(root, name));
    if (!fs.existsSync(path.join(root, page.targetPath))) return source;
    const target = fs.readFileSync(path.join(root, page.targetPath), 'utf8');
    const state = decide({page, source, target, record: readRecord(root, page)});
    if (state.status !== 'current' || !state.indexable) return source;
    // This loader can compile executable TSX/MDX. Even an admitted candidate
    // carrying advisory warnings must never change executable source here.
    const extension = path.extname(file);
    if (protectionSignature(await structure(source, extension)) !== protectionSignature(await structure(target, extension)))
        throw new Error(`Protected executable content differs from its source: ${page.targetPath}`);
    return target;
}
module.exports = function contentLoader(source) {
    // Manual page bodies have their own publication decision. Unqueried docs
    // imports keep the existing automatic state and ownership rules.
    if (new URLSearchParams((this.resourceQuery ?? '').slice(1)).has('doris-body')) return source;
    const {root, locale} = this.getOptions();
    return localizedSource({root, locale, file: this.resourcePath, source,
        dependency: file => fs.existsSync(file) ? this.addDependency(file) : this.addMissingDependency(file)});
};
module.exports.localizedSource = localizedSource;
