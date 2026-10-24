// The translation publisher and PR build workflow invoke this same subset of
// admission checks. This does not run the full Docusaurus production build.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {pipelineLocale} = require('./state.cjs');
const {checkLinks, checkSyntax} = require('./document-checks.cjs');

async function preflight({root, base, locale = pipelineLocale(root)}) {
    execFileSync(process.execPath, [path.join(root, 'scripts/i18n/check-translations.cjs'), '--base', base],
        {cwd: root, stdio: 'inherit', env: {...process.env, I18N_LOCALE: locale}});
    const files = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', '-z', base, 'HEAD'],
        {cwd: root, encoding: 'utf8'}).split('\0').filter(Boolean)
        .filter(file => /^i18n\/[^/]+\/docusaurus-plugin-content-docs[^/]*\/.+\.(mdx?|tsx?)$/.test(file));
    for (const targetPath of files) {
        const target = fs.readFileSync(path.join(root, targetPath), 'utf8');
        await checkSyntax(target, path.extname(targetPath));
        if (/\.mdx?$/.test(targetPath)) checkLinks({root, targetPath, target});
    }
    process.stdout.write(`Shared PR admission checks passed: translation state, syntax and internal links (${files.length} documents).\n`);
    return {checked: files.length};
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const base = args[args.indexOf('--base') + 1];
    if (!args.includes('--base') || !base) throw new Error('Usage: pr-preflight.cjs --base <commit>');
    preflight({root: path.resolve(__dirname, '../..'), base}).catch(error => {
        console.error(error.message); process.exitCode = 1;
    });
}
module.exports = {preflight};
