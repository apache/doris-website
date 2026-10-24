const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {locales, localeRegistry} = require('../../config/i18n');
const {managedLocales} = require('./state.cjs');
// Locales that stay opt-in, so CI has to enable exactly the ones in scope.
const optionalLocales = localeRegistry.filter(locale => locale.optional).map(locale => locale.code);

// `managed` lists the locales whose content carries translation state. A change
// to one of their dictionaries or state files needs a real render build, while
// the same change for a source-only locale does not.
function buildScope(files, versions, managed = []) {
    const active = ['current', ...versions];
    const wanted = new Set(), languages = new Set(), json = new Set(), retired = new Set();
    let tier = 'skip';
    const build = () => {if (tier === 'skip') tier = 'build';};
    const shared = () => {locales.forEach(locale => languages.add(locale)); build();};
    for (const file of files) {
        let match;
        if (['versions.json', 'config/versions-plugin.js'].includes(file)) {tier = 'full'; shared();}
        else if (file.startsWith('docs/')) {languages.add('en'); wanted.add('current'); build();}
        else if ((match = file.match(/^versioned_docs\/version-([^/]+)\//))) {languages.add('en'); wanted.add(match[1]); build();}
        else if ((match = file.match(/^i18n\/([^/]+)\/(.+)$/))) {
            if (!locales.includes(match[1])) throw new Error(`Unconfigured locale: ${match[1]}`);
            const locale = match[1], content = match[2];
            if (content.endsWith('.json')) {
                json.add(file);
                // A managed locale's dictionary changes rendered UI text, which
                // only a real render build validates.
                if (managed.includes(locale)) {languages.add(locale); build();}
            } else {
                languages.add(locale); build();
                const version = content.match(/^docusaurus-plugin-content-docs\/(current|version-([^/]+))\//);
                if (version) wanted.add(version[2] || 'current');
            }
        } else if ((match = file.match(/^versioned_sidebars\/version-(.+)-sidebars.json$/))) {shared(); wanted.add(match[1]);}
        else if (file === 'sidebars.ts') {shared(); wanted.add('current');}
        else if (['.github/workflows/cron-deploy-website.yml', '.github/workflows/manual-deploy-website.yml'].includes(file)) shared();
        else if (/^(blog|community|releasenotes|course)\//.test(file)) {languages.add('en'); build();}
        else if (/^sidebars(Community|Releases|Course)\./.test(file)) shared();
        else if (/^(src|config)\//.test(file) || ['docusaurus.config.js','package.json','yarn.lock','tailwind.config.js','tsconfig.json'].includes(file)
            || /^scripts\/(key-features|last-update|publish)\//.test(file) || /^scripts\/(patch-search-tokenize.js|build-locales.cjs|build-locale.cjs)$/.test(file)
            || /^scripts\/i18n\/(docs-plugin|status-plugin|state|structure|content-plugin|content-loader|source-groups|code-prose|protection|content-manifest|manual-state|manual-plugins|native-context)\.cjs$/.test(file)) shared();
        else if (/^translations\/(pages|blog)\//.test(file)) {shared(); if (file.endsWith('.json')) json.add(file);}
        else if ((match = file.match(/^translations\/(scope|glossary)\/([^/]+)\.json$/))) {
            if (!locales.includes(match[2])) throw new Error(`Unconfigured locale: ${match[2]}`);
            json.add(file); // Offline configuration checks cover these without a site build.
        }
        // Translation configuration applies to every managed locale at once.
        else if (file === 'translations/config.json') {managed.forEach(locale => languages.add(locale)); build();}
        else if ((match = file.match(/^translations\/state\/([^/]+)\/[^/]+\.json$/))) {
            if (!locales.includes(match[1])) throw new Error(`Unconfigured locale: ${match[1]}`);
            languages.add(match[1]); build();
        }
        else if ((match = file.match(/^translations\/state\/([^/]+)\/pages\/[^/]+\/([^/]+)\//))) {
            if (!locales.includes(match[1])) throw new Error(`Unconfigured locale: ${match[1]}`);
            languages.add(match[1]); wanted.add(match[2]); json.add(file); build();
        }
        else if (file === 'static/.htaccess') shared();
        else if (/^static\/js\/(brand-theme|course-rail)-bootstrap\.js$/.test(file)) shared();
        else if (/^(static|\.github|\.claude|\.agents|\.vscode|\.idea|scripts|website-quality-governance|translations|plan-doc)\//.test(file)
            || /\.(py|sh)$/.test(file)
            || /^(README.md|AGENTS.md|TOC.md|LICENSE|NOTICE|store_format_v3.md|cspell.json|author.yml|buildVersions.json|\.gitignore|\.prettier.*|\.eslintrc.*)$/.test(file)) {}
        else {languages.add('en'); build();}
    }
    for (const version of wanted) if (!active.includes(version)) {wanted.delete(version); retired.add(version);}
    const searchChanged = files.some(file => /^scripts\/i18n\/search-plugin\.cjs$/.test(file)
        || /^src\/theme\/(SearchBar|SearchPage)\/.+\.[jt]sx?$/.test(file)
        || /^src\/utils\/(searchVersion|searchContexts|searchInput|searchNormalization|tokenize|smartQueries|smartTerms)\.[jt]s$/.test(file));
    const navigationChanged = files.some(file => /^src\/theme\/NavbarItem\/(LocaleDropdownNavbarItem\/index|DocsVersionDropdownNavbarItem)\.tsx$/.test(file)
        || /^scripts\/i18n\/verify-(doc-navigation|search)\.cjs$/.test(file));
    const contractChanged = files.some(file => /^scripts\/i18n\/(content-manifest|manual-state|manual-plugins|native-context|docs-plugin|status-plugin)\.cjs$/.test(file)
        || /^translations\/(pages|blog)\//.test(file));
    const optimizePublish = contractChanged || searchChanged || navigationChanged || files.some(file => /^(scripts\/publish\/|config\/(custom-docusaurus-plugin|ssrTemplate)\.js$|scripts\/build-locales\.cjs$|static\/js\/(brand-theme|course-rail)-bootstrap\.js$|\.github\/workflows\/(cron|manual)-deploy-website\.yml$)/.test(file));
    // Publication changes need the same complete artifact as deployment, on
    // the CI runner. Keep local checks scoped to fixtures and Dev versions.
    if (optimizePublish) {tier = 'full'; shared();}
    const selected = locales.filter(locale => languages.has(locale));
    return {tier, skip_build: tier === 'skip', need_full_build: tier === 'full',
        optimize_publish: optimizePublish,
        docs_versions: tier === 'full' ? '' : active.filter(version => wanted.has(version)).join(',') || versions[0] || 'current',
        locales: selected,
        // Only the opt-in locales have to be switched on for the build.
        enabled_locales: optionalLocales.filter(locale => languages.has(locale)).join(','),
        // A subset build cannot prove cross-locale reciprocity, so the caller
        // must say whether it built the whole configured locale set.
        partial_build: selected.length !== locales.length,
        json: [...json], retired: [...retired]};
}
if (require.main === module) {
    const root = process.cwd();
    const base = process.argv[2];
    if (!base) throw new Error('Usage: build-scope.cjs <base SHA>');
    const files = execFileSync('git', ['diff', '--name-only', base, 'HEAD'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const plan = buildScope(files, JSON.parse(fs.readFileSync(path.join(root,'versions.json'))), managedLocales(root));
    for (const file of plan.json) if (fs.existsSync(file)) JSON.parse(fs.readFileSync(file,'utf8'));
    console.log(JSON.stringify({files, ...plan}, null, 2));
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
        Object.entries({...plan, locale_args: plan.locales.map(locale => `--locale ${locale}`).join(' '),
            locale_count: plan.locales.length, locale_csv: plan.locales.join(',')})
            .filter(([key]) => !['json','retired','locales'].includes(key)).map(([key,value]) => `${key}=${value}\n`).join(''));
}
module.exports = {buildScope};
