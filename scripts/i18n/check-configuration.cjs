const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadConfig, pipelineLocale} = require('./state.cjs');
const {validateScope} = require('./inventory.cjs');

// Validate inputs without loading Docusaurus, an inventory, credentials or a model.
function checkConfiguration(root, locale, {releaseHistory = false} = {}) {
    require('./locale-entry.cjs').settings(root);
    assert(loadConfig(root).locales[locale], `Unconfigured translation locale: ${locale}`);
    const read = kind => JSON.parse(fs.readFileSync(path.join(root, `translations/${kind}/${locale}.json`), 'utf8'));
    const scope = read('scope');
    validateScope(scope, locale);
    for (const group of scope.groups.filter(group => group.pluginId === 'releases'||group.kind==='blog')) {
        if (!scope.automaticGroups || scope.automaticGroups.includes(group.id))
            assert(group.sourcePolicy, `${locale}: automatic ${group.kind==='blog'?'blogs':'Release Notes'} need a new-only source policy`);
        if (group.sourcePolicy) {
            const policy = require('./release-policy.cjs');
            const baseline=policy.loadBaseline(root, group).data;
            if(group.kind==='blog'){
                require('./automated-blog.cjs').validateSettings(root,baseline);
                if(!scope.automaticGroups||scope.automaticGroups.includes(group.id))
                    assert(baseline.locales.includes(locale),`${locale}: blog automation is not admitted by its baseline`);
            }
            if (releaseHistory) policy.releasePolicy(root, group, 'HEAD');
        }
    }
    const retained = scope.retainSidebarLabels ?? [];
    assert(Array.isArray(retained), `${locale}: retainSidebarLabels must be an array`);
    const labels = new Set();
    for (const entry of retained) {
        const key = JSON.stringify([entry.pluginId, entry.version, entry.key]);
        assert(entry.reason?.trim() && entry.key?.startsWith('sidebar.') && !labels.has(key)
            && scope.groups.some(group => group.pluginId === entry.pluginId && group.version === entry.version),
        `${locale}: invalid retained sidebar label`);
        labels.add(key);
    }
    const glossary = read('glossary');
    assert(glossary.schemaVersion === 1 && typeof glossary.version === 'string' && glossary.version.trim(),
        `${locale}: invalid glossary schema/version`);
    assert(Array.isArray(glossary.keep) && glossary.keep.every(term => typeof term === 'string' && term.trim())
        && new Set(glossary.keep).size === glossary.keep.length, `${locale}: invalid glossary keep terms`);
    assert(Array.isArray(glossary.terms), `${locale}: glossary terms must be an array`);
    const terms = new Set();
    for (const term of glossary.terms) {
        assert(typeof term.source === 'string' && term.source.trim() && typeof term.target === 'string' && term.target.trim()
            && (term.required === undefined || typeof term.required === 'boolean') && !terms.has(term.source),
        `${locale}: invalid glossary term`);
        terms.add(term.source);
    }
    if (glossary.keepReasons !== undefined) {
        assert(glossary.keepReasons && typeof glossary.keepReasons === 'object' && !Array.isArray(glossary.keepReasons)
            && glossary.keep.every(term => typeof glossary.keepReasons[term] === 'string' && glossary.keepReasons[term].trim())
            && Object.keys(glossary.keepReasons).every(term => glossary.keep.includes(term)),
        `${locale}: keepReasons must explain each retained term exactly once`);
    }
    return {locale, groups: scope.groups.length, maxBatchPages: scope.maxBatchPages,
        retainedLabels: retained.length, keepTerms: glossary.keep.length, translatedTerms: glossary.terms.length};
}

if (require.main === module) {
    try {
        const root = path.resolve(__dirname, '../..');
        const args = process.argv.slice(2);
        assert(args.every(arg => ['--all','--release-history'].includes(arg)),
            'Usage: check-configuration.cjs [--all] [--release-history], or set I18N_LOCALE');
        const locales = args.includes('--all') ? Object.keys(loadConfig(root).locales) : [pipelineLocale(root)];
        console.log(JSON.stringify({checked: locales.map(locale => checkConfiguration(root, locale,
            {releaseHistory:args.includes('--release-history')})), releaseHistory:args.includes('--release-history')}, null, 2));
    } catch (error) {console.error(error.message); process.exitCode = 1;}
}
module.exports = {checkConfiguration};
