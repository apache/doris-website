const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {locales} = require('../../config/i18n');

function buildScope(files, versions) {
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
                // Japanese dictionary changes need real rendering validation.
                if (locale === 'ja') {languages.add(locale); build();}
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
            || /^scripts\/(key-features|last-update)\//.test(file) || /^scripts\/(patch-search-tokenize.js|build-locales.cjs|build-locale.cjs)$/.test(file)
            || /^scripts\/i18n\/(docs-plugin|status-plugin|state|structure)\.cjs$/.test(file)) shared();
        else if (['translations/config.json', 'translations/state/ja/docs.json',
            'translations/state/ja/shards.schema.json'].includes(file)) {languages.add('ja'); build();}
        else if ((match = file.match(/^translations\/state\/ja\/pages\/[^/]+\/([^/]+)\//))) {
            languages.add('ja'); wanted.add(match[1]); json.add(file); build();
        }
        else if (file === 'static/.htaccess') shared();
        else if (/^(static|\.github|\.claude|\.agents|\.vscode|\.idea|scripts|website-quality-governance|translations|plan-doc)\//.test(file)
            || /\.(py|sh)$/.test(file)
            || /^(README.md|AGENTS.md|TOC.md|LICENSE|NOTICE|store_format_v3.md|cspell.json|author.yml|buildVersions.json|\.gitignore|\.prettier.*|\.eslintrc.*)$/.test(file)) {}
        else {languages.add('en'); build();}
    }
    for (const version of wanted) if (!active.includes(version)) {wanted.delete(version); retired.add(version);}
    return {tier, skip_build: tier === 'skip', need_full_build: tier === 'full',
        docs_versions: tier === 'full' ? '' : active.filter(version => wanted.has(version)).join(',') || versions[0] || 'current',
        locales: locales.filter(locale => languages.has(locale)), enable_ja: languages.has('ja'),
        json: [...json], retired: [...retired]};
}
if (require.main === module) {
    const root = process.cwd();
    const base = process.argv[2];
    if (!base) throw new Error('Usage: build-scope.cjs <base SHA>');
    const files = execFileSync('git', ['diff', '--name-only', base, 'HEAD'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const plan = buildScope(files, JSON.parse(fs.readFileSync(path.join(root,'versions.json'))));
    for (const file of plan.json) if (fs.existsSync(file)) JSON.parse(fs.readFileSync(file,'utf8'));
    console.log(JSON.stringify({files, ...plan}, null, 2));
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
        Object.entries({...plan, locale_args: plan.locales.map(locale => `--locale ${locale}`).join(' '), locale_count: plan.locales.length})
            .filter(([key]) => !['json','retired','locales'].includes(key)).map(([key,value]) => `${key}=${value}\n`).join(''));
}
module.exports = {buildScope};
