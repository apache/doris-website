// Full read-only compensation scan and GitHub Actions summary. This runs even
// when the model and PR creation are disabled.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, languageName, pipelineLocale} = require('./state.cjs');

const root = path.resolve(__dirname, '../..');
const configInputs = ['docusaurus.config.js', 'config/i18n.js', 'sidebars.ts', 'sidebarsCommunity.json',
    'sidebarsCourse.ts', 'sidebarsReleases.json',
    'versioned_sidebars/version-4.x-sidebars.json', 'translations/config.json', 'translations/release-notes-baseline.json'];
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

// Everything a plan depends on besides the planner itself: the checkout, the
// open-PR reservations (blocked targets included) and the requested filters.
function planInputs(head, activeCandidates, env = process.env) {
    return hash(JSON.stringify({head, activeCandidates, filters: ['I18N_PLUGIN', 'I18N_VERSION', 'I18N_PATH', 'I18N_PATHS']
        .map(key => env[key] || '').concat(env.I18N_LIMIT || '20')}));
}

function summarize(plan, reconciliation, eligible, mode, language, reused = false) {
    const effective=plan.automaticCounts??plan.counts;
    const exceptionKinds = new Map();
    for (const item of [...plan.exceptions, ...reconciliation.exceptions])
        exceptionKinds.set(item.kind, (exceptionKinds.get(item.kind) ?? 0) + 1);
    return [
        `## ${language} translation discovery`,
        '',
        `- Source commit: \`${plan.sourceCommit}\``,
        `- Plan: ${reused ? 'reused from discovery; master and open-PR reservations are unchanged'
            : 'recounted from the native documents'}`,
        `- Mode: \`${mode}\`; generation eligible: **${eligible}**`,
        `- Required for enabled automatic groups: ${effective.required}; merged current: ${effective.mergedCurrent}; pending: ${effective.pending}`,
        `- Additional registered content outside automatic maintenance: ${plan.counts.required-effective.required}; not a required translation backlog`,
        `- Open PRs inspected: ${reconciliation.openPrCount}; relevant: ${reconciliation.relevantPrs.length}; active candidates: ${plan.counts.activeCandidates}`,
        `- Selected for a possible next batch: ${plan.selected.length}; blocked targets: ${reconciliation.blockedTargets.length}`,
        `- Outside enabled automatic groups: ${plan.deferredAutomationTasks ?? 0}; reported separately, not sent to a model`,
        `- Release-note policy: historical excluded=${plan.exceptions.filter(item=>item.kind==='historical_excluded').length}; manual reconciliation=${plan.exceptions.filter(item=>item.kind==='policy_review').length}`,
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
    assert(process.env.I18N_MODE !== 'validate' || !process.env.I18N_PATHS,
        'Validation mode requires path, not a list of paths');
    fs.mkdirSync(output, {recursive: true});
    const reconciliation = JSON.parse(fs.readFileSync(path.join(output, 'open-pr-reconciliation.json'), 'utf8'));
    const planFile = path.join(output, 'plan.json');
    const auditFile = path.join(output, 'coverage.json');
    const activeFile = path.join(output, 'active-candidates.json');
    const event = process.env.GITHUB_EVENT_NAME || 'workflow_dispatch';
    const inputs = planInputs(execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
        fs.readFileSync(activeFile, 'utf8'));
    // The generation job downloads the discovery plan. Recounting every native
    // document takes minutes, so an unchanged plan is reused.
    const previous = fs.existsSync(planFile) && fs.existsSync(auditFile)
        ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : null;
    const reused = event !== 'push' && previous?.planInputs === inputs;
    let plan = previous;
    if (!reused) {
        const args = [path.join(__dirname, 'plan-translations.cjs'), '--source-ref', 'HEAD',
            '--active-candidates', activeFile, '--output', planFile,
            '--audit-output', auditFile, '--limit', process.env.I18N_LIMIT || '20'];
        for (const [key, option] of [['I18N_PLUGIN', '--plugin'], ['I18N_VERSION', '--version'],
            ['I18N_PATH', '--path'], ['I18N_PATHS', '--paths']]) {
            if (process.env[key]) args.push(option, process.env[key]);
        }
        execFileSync(process.execPath, args, {cwd: root, stdio: 'inherit'});
        plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
        const blocked = new Set(reconciliation.blockedTargets);
        const originalSelected = plan.selected.length;
        plan.selected = plan.selected.filter(id => !blocked.has(plan.tasks.find(task => task.id === id)?.targetPath));
        plan.selectedCount = plan.selected.length;
        plan.selectedEstimatedSourceTokens = plan.selected.reduce((total, id) =>
            total + (plan.tasks.find(task => task.id === id)?.estimatedSourceTokens || 0), 0);
        plan.blockedSelected = originalSelected - plan.selected.length;
        plan.planInputs = inputs;
        fs.writeFileSync(planFile, JSON.stringify(plan, null, 2) + '\n');
    }
    const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
    const mode = process.env.I18N_MODE || 'dry-run';
    const changed = event === 'push' ? changedPaths(process.env.GITHUB_EVENT_BEFORE, plan.sourceCommit) : [];
    const locale = pipelineLocale(root);
    const scope = JSON.parse(fs.readFileSync(path.join(root, `translations/scope/${locale}.json`), 'utf8'));
    if (event === 'workflow_dispatch' && mode === 'validate') {
        assert(/\.(mdx?|tsx?)$/.test(process.env.I18N_PATH || ''),
            'Validation mode needs an exact English Markdown, MDX or TypeScript source path');
        assert(plan.selected.length === 1 && plan.tasks.find(task => task.id === plan.selected[0])?.sourcePath === process.env.I18N_PATH,
            'Validation mode must select exactly one eligible source file');
    }
    const eligible = event === 'schedule' || event === 'workflow_dispatch' && ['generate', 'validate'].includes(mode)
        || event === 'push' && changed !== null && relevantPush(changed, audit, scope);
    const summary = summarize(plan, reconciliation, eligible, mode, languageName(root, locale), reused);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    else process.stdout.write(summary);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
        `can_generate=${eligible && plan.selected.length > 0}\n`
        + `source_commit=${plan.sourceCommit}\n`);
}

if (require.main === module) {
    try {main();} catch (error) {console.error(error.message); process.exitCode = 1;}
}
module.exports = {relevantPush, changedPaths, summarize, rulesFor, planInputs};
