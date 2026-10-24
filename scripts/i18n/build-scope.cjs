const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {locales, localeRegistry} = require('../../config/i18n');
const {managedLocales} = require('./state.cjs');
// Locales that stay opt-in, so CI has to enable exactly the ones in scope.
const optionalLocales = localeRegistry.filter(locale => locale.optional).map(locale => locale.code);
const globalLanguageRuntime = file => /^src\/utils\/(locale|localization|translation|localizedRoute|localePreference|contentRoute|useLocalizedRoute|useLanguageItems|languageMessages|englishTranslation|englishLocalization|useEnglishContentContext)\.[jt]sx?$/.test(file)
    || /^src\/components\/(ContentRoute|ContentMetadata)\.tsx$/.test(file)
    || /^src\/components\/home-next\/(LayoutNext|LocalizedLink|NavbarNext|LanguageMenu|PageContent|PageLanguageSwitcher)\.(tsx|scss)$/.test(file)
    || /^src\/theme\/(SiteMetadata|Layout|DocItem|NavbarItem|MDXComponents|BlogPost)/.test(file);

// Fixtures validate implementations, while the scoped real build validates
// changed content/state. Keep those decisions separate from publish mode.
function validationScope(files) {
    const dependencies = files.some(file => /^(package.json|yarn.lock)$/.test(file));
    const workflow = files.includes('.github/workflows/build-check.yml');
    const publishing = files.some(file => /^(scripts\/publish\/|scripts\/build-locales\.cjs$|scripts\/build-locale\.cjs$|config\/(custom-docusaurus-plugin|ssrTemplate|asset-origin)\.js$|static\/\.htaccess$|static\/js\/[^/]*bootstrap\.js$|\.github\/workflows\/(cron|manual)-deploy-website\.yml$)/.test(file));
    const content = files.some(file => globalLanguageRuntime(file)
        || /^scripts\/i18n\/(?!__tests__\/).*\.[cm]?js$/.test(file)
        || /^scripts\/i18n\/__tests__\/fixtures\//.test(file)
        || /^(docusaurus.config.js|config\/i18n.js)$/.test(file));
    const docs = files.some(file => /^(docs\/|versioned_docs\/|versioned_sidebars\/|blog\/|community\/|course\/|releasenotes\/|i18n\/[^/]+\/docusaurus-plugin-content-|scripts\/docs-governance\/)/.test(file)
        || /^(sidebars[^/]*\.(ts|json)|versions.json|docusaurus.config.js)$/.test(file));
    return {check_content_fixture: dependencies || workflow || content,
        check_publish_tests: dependencies || workflow || publishing,
        check_publish_fixture: dependencies || workflow || publishing,
        check_docs_report: dependencies || workflow || docs};
}

// `managed` lists the locales whose content carries translation state. A change
// to one of their dictionaries or state files needs a real render build, while
// the same change for a source-only locale does not.
function buildScope(files, versions, managed = [], dependencies = null) {
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
                if (managed.includes(locale) || content === 'code.json') {languages.add(locale); build();}
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
            || /^scripts\/i18n\/(docs-plugin|status-plugin|state|structure|content-plugin|content-loader|source-groups|code-prose|protection|content-manifest|manual-state|manual-plugins|native-context|route-context|page-body|page-body-loader|sitemap|content-impact|manual-report|embedded-messages)\.cjs$/.test(file)) shared();
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
        else if (/^static\/js\/[^/]*bootstrap\.js$/.test(file)) shared();
        else if (/^(static|\.github|\.claude|\.agents|\.vscode|\.idea|scripts|website-quality-governance|translations|plan-doc)\//.test(file)
            || /\.(py|sh)$/.test(file)
            || /^(README.md|AGENTS.md|TOC.md|LICENSE|NOTICE|store_format_v3.md|cspell.json|author.yml|buildVersions.json|\.gitignore|\.prettier.*|\.eslintrc.*)$/.test(file)) {}
        else {languages.add('en'); build();}
    }
    for (const version of wanted) if (!active.includes(version)) {wanted.delete(version); retired.add(version);}
    const searchChanged = files.some(file => /^scripts\/i18n\/search-plugin\.cjs$/.test(file)
        || /^src\/theme\/(SearchBar|SearchPage)\/.+\.[jt]sx?$/.test(file)
        || /^src\/utils\/(searchVersion|searchContexts|searchInput|searchNormalization|tokenize|smartQueries|smartTerms)\.[jt]s$/.test(file));
    const navigationChanged = files.some(file => globalLanguageRuntime(file) || /^src\/theme\/NavbarItem\/(LocaleDropdownNavbarItem\/index|DocsVersionDropdownNavbarItem)\.tsx$/.test(file)
        || /^scripts\/i18n\/verify-(doc-navigation|search)\.cjs$/.test(file));
    const contractChanged = files.some(file => /^scripts\/i18n\/(content-manifest|manual-state|manual-plugins|native-context|docs-plugin|status-plugin|route-context|page-body|page-body-loader|sitemap)\.cjs$/.test(file)
        || (/^translations\/(pages|blog)\//.test(file) && !dependencies?.complete));
    const optimizePublish = contractChanged || searchChanged || navigationChanged || files.some(file => /^(scripts\/publish\/|package\.json$|yarn\.lock$|docusaurus\.config\.js$|config\/(i18n|custom-docusaurus-plugin|ssrTemplate|asset-origin)\.js$|scripts\/build-locales?\.cjs$|static\/\.htaccess$|static\/js\/[^/]*bootstrap\.js$|\.github\/workflows\/(cron-deploy-website|manual-deploy-website|build-check)\.yml$)/.test(file));
    // Publication changes need the same complete artifact as deployment, on
    // the CI runner. Keep local checks scoped to fixtures and Dev versions.
    if (optimizePublish) {tier = 'full'; shared();}
    if (tier !== 'full' && dependencies?.complete && dependencies.locales.length) {
        languages.clear(); dependencies.locales.forEach(locale => languages.add(locale));
    }
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
        json: [...json], retired: [...retired], ...validationScope(files)};
}
if (require.main === module) {
    const root = process.cwd();
    const base = process.argv[2];
    if (!base) throw new Error('Usage: build-scope.cjs <base SHA>');
    const files = execFileSync('git', ['diff', '--name-only', base, 'HEAD'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const dependencies = require('./content-impact.cjs').analyzeImpact(root, base, files);
    const plan = buildScope(files, JSON.parse(fs.readFileSync(path.join(root,'versions.json'))), managedLocales(root), dependencies);
    for (const file of plan.json) if (fs.existsSync(file)) JSON.parse(fs.readFileSync(file,'utf8'));
    const report = JSON.stringify({schemaVersion: 1, sourceSha: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
        baseSha: base, files, ...plan}, null, 2) + '\n';
    fs.mkdirSync(path.join(root, '.i18n-build'), {recursive: true});
    fs.writeFileSync(path.join(root, '.i18n-build/ci-plan.json'), report);
    console.log(report);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
        Object.entries({...plan, locale_args: plan.locales.map(locale => `--locale ${locale}`).join(' '),
            locale_count: plan.locales.length, locale_csv: plan.locales.join(',')})
            .filter(([key]) => !['json','retired','locales'].includes(key)).map(([key,value]) => `${key}=${value}\n`).join(''));
}
module.exports = {buildScope, validationScope, globalLanguageRuntime};
