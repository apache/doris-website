const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const os = require('node:os');
const {spawnSync} = require('node:child_process');
const {allowGeneration} = require('../workflow-generate.cjs');
const workflows = path.resolve(__dirname, '../../../.github/workflows');
const load = name => yaml.load(fs.readFileSync(path.join(workflows, name), 'utf8'));
const shared = load('translation-run.yml');
const callers = {ja: load('japanese-translation.yml'), ko: load('korean-translation.yml')};
const russian = load('russian-translation.yml');

test('Russian discovery is manual only and uses the shared run, lock and explicit secrets', () => {
    assert.deepEqual(Object.keys(russian.on), ['workflow_dispatch']);
    const inputs = russian.on.workflow_dispatch.inputs;
    assert.deepEqual(inputs, callers.ko.on.workflow_dispatch.inputs);
    assert.deepEqual(russian.permissions, shared.permissions);
    for (const workflow of Object.values(callers)) assert.deepEqual(russian.concurrency, workflow.concurrency);
    assert.deepEqual(Object.keys(russian.jobs), ['translation']);
    const job = russian.jobs.translation;
    assert.equal(job.uses, './.github/workflows/translation-run.yml');
    assert.deepEqual(job.with, {...callers.ko.jobs.translation.with, locale: 'ru', workspace: 'russian-translation',
        mode: "${{ inputs.mode || 'dry-run' }}"});
    assert.deepEqual(job.secrets, callers.ko.jobs.translation.secrets);
    assert.equal(allowGeneration({I18N_MODE: inputs.mode.default, GITHUB_EVENT_NAME: 'workflow_dispatch'}), false);
    assert.equal(allowGeneration({I18N_MODE: 'validate', GITHUB_EVENT_NAME: 'workflow_dispatch', I18N_MAX_PAGES: '1',
        I18N_PATH: 'community/how-to-contribute/how-to-share-blogs.md'}), true);
    assert.equal(allowGeneration({I18N_MODE: 'generate', GITHUB_EVENT_NAME: 'workflow_dispatch', I18N_MAX_PAGES: '10'}), true);
});

test('one-page validation rejects an exact batch list before creating scan artifacts', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ko-validate-paths-'));
    t.after(() => fs.rmSync(directory, {recursive:true,force:true}));
    const output = path.join(directory,'scan');
    const result = spawnSync(process.execPath, [path.resolve(workflows,'../../scripts/i18n/workflow-scan.cjs'),output], {
        encoding:'utf8',env:{...process.env,I18N_LOCALE:'ko',I18N_MODE:'validate',I18N_PATHS:'["community/subscribe-mail-list.md"]'},
    });
    assert.equal(result.status,1);
    assert.match(result.stderr,/Validation mode requires path, not a list/);
    assert(!fs.existsSync(output));
});

test('each language workflow passes one fixed locale to the shared run under one lock', () => {
    const expected = {
        ja: {workspace: 'japanese-translation', mode: 'generate', cron: '23 4,16 * * *'},
        // Twenty minutes later; the shared lock queues it behind a Japanese run.
        ko: {workspace: 'korean-translation', mode: 'dry-run', cron: '43 4,16 * * *'},
    };
    for (const [locale, workflow] of Object.entries(callers)) {
        assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch', 'schedule']);
        assert.deepEqual(workflow.on.schedule, [{cron: expected[locale].cron}]);
        const inputs = workflow.on.workflow_dispatch.inputs;
        // No locale input: each workflow runs only its own language.
        assert.deepEqual(Object.keys(inputs), ['mode', 'plugin', 'version', 'path', 'paths']);
        assert.equal(inputs.mode.default, expected[locale].mode);
        assert.deepEqual(inputs.mode.options, ['dry-run', 'validate', 'generate']);
        assert.deepEqual(workflow.permissions, {'contents': 'read', 'pull-requests': 'read'});
        assert.deepEqual(workflow.concurrency, {group: 'docs-translation', 'cancel-in-progress': false, queue: 'max'});
        assert.deepEqual(Object.keys(workflow.jobs), ['translation']);
        const job = workflow.jobs.translation;
        assert.equal(job.uses, './.github/workflows/translation-run.yml');
        assert.deepEqual(job.with, {locale, workspace: expected[locale].workspace,
            mode: "${{ inputs.mode || 'generate' }}", plugin: '${{ inputs.plugin }}', version: '${{ inputs.version }}',
            path: '${{ inputs.path }}', paths: '${{ inputs.paths }}'});
        assert.deepEqual(Object.keys(job.secrets).sort(), Object.keys(shared.on.workflow_call.secrets).sort());
        for (const [name, value] of Object.entries(job.secrets)) assert.equal(value, `\${{ secrets.${name} }}`);
    }
});

test('a scheduled run resolves to a mode that the generation gate accepts', () => {
    // Discovery marks every scheduled run eligible, so the input-less fallback
    // must be a mode that workflow-generate.cjs will run, not a dry run.
    for (const workflow of Object.values(callers)) {
        const fallback = /\|\| '([a-z-]+)' \}\}$/.exec(workflow.jobs.translation.with.mode)[1];
        assert.equal(allowGeneration({I18N_MODE: fallback, GITHUB_EVENT_NAME: 'schedule', I18N_MAX_PAGES: '10'}), true);
    }
    assert.equal(allowGeneration({I18N_MODE: callers.ko.on.workflow_dispatch.inputs.mode.default,
        GITHUB_EVENT_NAME: 'workflow_dispatch', I18N_MAX_PAGES: '10'}), false);
});

test('the shared run names no language and sets mode and filters once', () => {
    const text = fs.readFileSync(path.join(workflows, 'translation-run.yml'), 'utf8');
    assert.doesNotMatch(text, /japanese|korean|russian|translate-(ja|ko|ru)\b/i);
    assert.deepEqual(Object.keys(shared.on), ['workflow_call']);
    assert.deepEqual(shared.permissions, {'contents': 'read', 'pull-requests': 'read'});
    assert.equal(shared.concurrency, undefined);
    const inputs = shared.on.workflow_call.inputs;
    for (const name of ['locale', 'workspace', 'mode']) assert.equal(inputs[name].required, true);
    for (const name of ['plugin', 'version', 'path', 'paths']) assert.equal(inputs[name].default, '');
    assert.equal(shared.env.I18N_LOCALE, '${{ inputs.locale }}');
    assert.equal(shared.env.I18N_MODE, '${{ inputs.mode }}');
    for (const name of ['plugin', 'version', 'path', 'paths'])
        assert.equal(shared.env[`I18N_${name.toUpperCase()}`], `\${{ inputs.${name} }}`);
    assert.equal(shared.env.I18N_LIMIT, '20');
    assert.equal(shared.env.I18N_MAX_PAGES, "${{ inputs.mode == 'validate' && '1' || '10' }}");
    assert.equal(shared.jobs.discover.if, "github.ref == 'refs/heads/master'");
    assert.equal(shared.jobs.generate.needs, 'discover');
    assert.equal(shared.jobs.generate.if, "needs.discover.outputs.can_generate == 'true'");
    const local = new Set(['I18N_CODEX_MODEL', 'I18N_GITHUB_PAT', 'I18N_PR_AUTH_KIND']);
    for (const job of Object.values(shared.jobs)) {
        assert.equal(job.env, undefined);
        for (const step of job.steps) {
            for (const key of Object.keys(step.env ?? {})) assert(!key.startsWith('I18N_') || local.has(key), key);
            if (step.uses?.startsWith('actions/checkout@')) {
                // Generation recounts against current master instead of the discovery commit.
                assert.deepEqual(step.with, {ref: 'master', 'fetch-depth': 0, 'persist-credentials': false});
            }
        }
    }
});

test('discovery and generation exchange artifacts in the caller workspace', () => {
    const discover = shared.jobs.discover.steps;
    const generate = shared.jobs.generate.steps;
    const upload = discover.find(step => step.uses?.startsWith('actions/upload-artifact@'));
    const download = generate.find(step => step.uses?.startsWith('actions/download-artifact@'));
    assert.equal(upload.with.name, '${{ inputs.workspace }}-plan-${{ github.run_id }}');
    assert.equal(download.with.name, upload.with.name);
    assert.equal(download.with.path, '${{ runner.temp }}/${{ inputs.workspace }}');
    assert.equal(generate.at(-1).with.name, '${{ inputs.workspace }}-generation-${{ github.run_id }}');
    assert.equal(shared.env.TRANSLATION_WORKSPACE, '${{ inputs.workspace }}');
    const scripts = [...discover, ...generate].filter(step => /node scripts\/i18n\/workflow-(prs|scan|generate|publish)/.test(step.run ?? ''));
    assert.equal(scripts.length, 6);
    assert(scripts.every(step => step.run.endsWith(' "$RUNNER_TEMP/$TRANSLATION_WORKSPACE"')));
    const index = name => generate.findIndex(step => step.name === name);
    assert(index('Reconcile again immediately before model calls') < index('Replan exact source and open PRs'));
    assert(index('Replan exact source and open PRs') < index('Verify the PR label before model calls'));
    assert.equal(generate.find(step => step.id === 'translation').env.I18N_CODEX_MODEL,
        "${{ vars.I18N_CODEX_MODEL || 'gpt-6-sol' }}");
});

test('the label check runs before auth loading and fails for a missing locale label', t => {
    const steps = shared.jobs.generate.steps;
    const label = steps.findIndex(step => step.name === 'Verify the PR label before model calls');
    const auth = steps.findIndex(step => step.id === 'auth');
    assert(label >= 0 && label < auth);
    assert.equal(steps[label].if, "steps.fresh.outputs.can_generate == 'true'");
    assert.equal(steps[label].env.GH_TOKEN, '${{ github.token }}');
    const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-label-'));
    t.after(() => fs.rmSync(bin, {recursive: true, force: true}));
    // The mock answers like the labels API: the name, or nothing when missing.
    fs.writeFileSync(path.join(bin, 'gh'), '#!/bin/sh\ncase "$2" in */labels/translate-ja) echo translate-ja;; */labels/translate-ru) echo translate-ru;; esac\n',
        {mode: 0o755});
    const run = locale => spawnSync('bash', ['-e', '-c', steps[label].run],
        {env: {...process.env, PATH: `${bin}:${process.env.PATH}`, I18N_LOCALE: locale}}).status;
    assert.equal(run('ja'), 0);
    assert.equal(run('ru'), 0);
    assert.notEqual(run('ko'), 0);
});

test('publication preserves the verified runtime and refresh path', () => {
    const steps = shared.jobs.generate.steps;
    const runtime = steps.find(step => step.name === 'Install the verified Codex runtime used by Doris review');
    assert(runtime.run.includes('codex-exec-goal-0.156.1-a310d33f7ebb-x86_64-unknown-linux-gnu.tar.gz'));
    assert(runtime.run.includes('2ee3073479bc8c94436684b55a13d7a3f299e768d04436d90e0427814a3954bc  $archive'));
    assert.equal(runtime.if, "steps.fresh.outputs.can_generate == 'true'");
    const sync = steps.find(step => step.name === 'Sync refreshed Codex auth without overwriting a newer snapshot');
    assert.equal(sync.if, "always() && steps.auth.outcome == 'success'");
    assert.equal(sync.run, 'node scripts/i18n/codex-auth.cjs sync');
    const publish = steps.find(step => step.run?.includes('workflow-publish.cjs'));
    assert.equal(publish.if, "steps.translation.outputs.created == 'true' && steps.config.outputs.auth_kind != 'none'");
    assert.equal(publish.env.GH_TOKEN, '${{ steps.app.outputs.token || secrets.I18N_GITHUB_PAT }}');
});
