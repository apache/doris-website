// Full read-only compensation scan and GitHub Actions summary. This runs even
// when the model and PR creation are disabled.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {languageName, pipelineLocale} = require('./state.cjs');

const root = path.resolve(__dirname, '../..');
const configInputs = ['docusaurus.config.js', 'config/i18n.js', 'sidebars.ts', 'sidebarsCommunity.json',
    'versioned_sidebars/version-4.x-sidebars.json', 'translations/config.json'];
// A push to this locale's own scope or glossary changes what may be generated.
const rulesFor = locale => new Set([...configInputs,
    `translations/scope/${locale}.json`, `translations/glossary/${locale}.json`]);

function relevantPush(changed, audit, scope) {
    const rules = rulesFor(scope.locale);
    const source = new Set(audit.groups.flatMap(group => group.entries.map(page => page.sourcePath))
        .concat(audit.removed.map(page => page.sourcePath)));
    const chinese = new Set(audit.groups.flatMap(group => {
        const scopeGroup = scope.groups.find(item => item.id === group.id);
        const plugin = group.pluginId === 'default' ? '' : `-${group.pluginId}`;
        const version = group.version === 'current' ? 'current' : `version-${group.version}`;
        return group.entries.map(page => `i18n/zh-CN/docusaurus-plugin-content-docs${plugin}/${version}/`
            + page.sourcePath.slice(scopeGroup.sourceRoot.length + 1));
    }));
    return changed.some(file => source.has(file) || chinese.has(file) || rules.has(file));
}

function changedPaths(before, head) {
    if (!/^[a-f0-9]{40}$/.test(before ?? '') || /^0{40}$/.test(before)) return null;
    try {return execFileSync('git', ['diff', '--name-only', before, head],
        {cwd: root, encoding: 'utf8'}).trim().split('\n').filter(Boolean);}
    catch {return null;}
}

function summarize(plan, reconciliation, eligible, mode, language) {
    const exceptionKinds = new Map();
    for (const item of [...plan.exceptions, ...reconciliation.exceptions])
        exceptionKinds.set(item.kind, (exceptionKinds.get(item.kind) ?? 0) + 1);
    return [
        `## ${language} translation discovery`,
        '',
        `- Source commit: \`${plan.sourceCommit}\``,
        `- Mode: \`${mode}\`; generation eligible: **${eligible}**`,
        `- Required: ${plan.counts.required}; merged current: ${plan.counts.mergedCurrent}; pending: ${plan.counts.pending}`,
        `- Open PRs inspected: ${reconciliation.openPrCount}; relevant: ${reconciliation.relevantPrs.length}; active candidates: ${plan.counts.activeCandidates}`,
        `- Selected for a possible next batch: ${plan.selected.length}; blocked targets: ${reconciliation.blockedTargets.length}`,
        `- Robot batch PRs already open: ${reconciliation.botPrs.join(', ') || 'none'}`,
        `- Exceptions: ${[...exceptionKinds].map(([kind, count]) => `${kind}=${count}`).join(', ') || 'none'}`,
        '',
        'This report is read only. Open PR candidates do not count as merged translations.',
        '',
    ].join('\n');
}

function main() {
    const output = process.argv[2];
    assert(output && process.argv.length === 3, 'Usage: workflow-scan.cjs <output-directory>');
    fs.mkdirSync(output, {recursive: true});
    const reconciliation = JSON.parse(fs.readFileSync(path.join(output, 'open-pr-reconciliation.json'), 'utf8'));
    const planFile = path.join(output, 'plan.json');
    const auditFile = path.join(output, 'coverage.json');
    const args = [path.join(__dirname, 'plan-translations.cjs'), '--source-ref', 'HEAD',
        '--active-candidates', path.join(output, 'active-candidates.json'), '--output', planFile,
        '--audit-output', auditFile, '--limit', process.env.I18N_LIMIT || '20'];
    for (const [key, option] of [['I18N_PLUGIN', '--plugin'], ['I18N_VERSION', '--version'], ['I18N_PATH', '--path']]) {
        if (process.env[key]) args.push(option, process.env[key]);
    }
    execFileSync(process.execPath, args, {cwd: root, stdio: 'inherit'});
    const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
    const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
    const blocked = new Set(reconciliation.blockedTargets);
    const originalSelected = plan.selected.length;
    plan.selected = plan.selected.filter(id => !blocked.has(plan.tasks.find(task => task.id === id)?.targetPath));
    plan.selectedCount = plan.selected.length;
    plan.selectedEstimatedSourceTokens = plan.selected.reduce((total, id) =>
        total + (plan.tasks.find(task => task.id === id)?.estimatedSourceTokens || 0), 0);
    plan.blockedSelected = originalSelected - plan.selected.length;
    fs.writeFileSync(planFile, JSON.stringify(plan, null, 2) + '\n');
    const event = process.env.GITHUB_EVENT_NAME || 'workflow_dispatch';
    const mode = process.env.I18N_MODE || 'dry-run';
    const changed = event === 'push' ? changedPaths(process.env.GITHUB_EVENT_BEFORE, plan.sourceCommit) : [];
    const locale = pipelineLocale(root);
    const scope = JSON.parse(fs.readFileSync(path.join(root, `translations/scope/${locale}.json`), 'utf8'));
    if (event === 'workflow_dispatch' && mode === 'validate') {
        assert(/\.mdx?$/.test(process.env.I18N_PATH || ''),
            'Validation mode needs an exact English .md or .mdx source path');
        assert(plan.selected.length === 1 && plan.tasks.find(task => task.id === plan.selected[0])?.sourcePath === process.env.I18N_PATH,
            'Validation mode must select exactly one eligible source file');
    }
    const eligible = event === 'schedule' || event === 'workflow_dispatch' && ['generate', 'validate'].includes(mode)
        || event === 'push' && changed !== null && relevantPush(changed, audit, scope);
    const summary = summarize(plan, reconciliation, eligible, mode, languageName(root, locale));
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    else process.stdout.write(summary);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
        `can_generate=${eligible && plan.selected.length > 0}\n`
        + `source_commit=${plan.sourceCommit}\n`);
}

if (require.main === module) {
    try {main();} catch (error) {console.error(error.message); process.exitCode = 1;}
}
module.exports = {relevantPush, changedPaths, summarize, rulesFor};
