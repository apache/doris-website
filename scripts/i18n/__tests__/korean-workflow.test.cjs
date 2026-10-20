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
const korean = load('korean-translation.yml');
const japanese = load('japanese-translation.yml');

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

test('Korean generation runs on its schedule or a manual choice and shares the existing whole-run lock', () => {
    assert.deepEqual(Object.keys(korean.on), ['workflow_dispatch', 'schedule']);
    // Twice daily, offset from the Japanese runs that hold the same lock.
    assert.deepEqual(korean.on.schedule, [{cron: '43 4,16 * * *'}]);
    assert.deepEqual(japanese.on.schedule, [{cron: '23 4,16 * * *'}]);
    assert.equal(korean.on.workflow_dispatch.inputs.mode.default, 'dry-run');
    assert.deepEqual(korean.on.workflow_dispatch.inputs.mode.options, ['dry-run', 'validate', 'generate']);
    assert.equal(korean.on.workflow_dispatch.inputs.locale, undefined);
    assert.equal(korean.on.workflow_dispatch.inputs.paths.type, 'string');
    assert.deepEqual(korean.permissions, {'contents':'read', 'pull-requests':'read'});
    assert.deepEqual(korean.concurrency, japanese.concurrency);
    assert.equal(korean.concurrency.group, 'japanese-translation-ja');
    assert.equal(korean.jobs.discover.if, "github.ref == 'refs/heads/master'");
    assert.equal(korean.jobs.generate.needs, 'discover');
    assert.equal(korean.jobs.generate.if, "needs.discover.outputs.can_generate == 'true'");
    for (const job of Object.values(korean.jobs)) {
        assert.equal(job.env.I18N_LOCALE, 'ko');
        for (const step of job.steps) {
            if (step.env?.I18N_MODE) assert.equal(step.env.I18N_MODE, "${{ inputs.mode || 'generate' }}");
            if (step.uses?.startsWith('actions/checkout@')) {
                assert.equal(step.with['fetch-depth'], 0);
                assert.equal(step.with['persist-credentials'], false);
            }
        }
    }
});

test('a scheduled run resolves to a mode that the generation gate accepts', () => {
    // Discovery marks every scheduled run eligible, so the input-less fallback
    // must be a mode that workflow-generate.cjs will run, not a dry run.
    const step = korean.jobs.generate.steps.find(item => item.id === 'translation');
    const fallback = /\|\| '([a-z-]+)' \}\}$/.exec(step.env.I18N_MODE)[1];
    assert.equal(allowGeneration({I18N_MODE: fallback, GITHUB_EVENT_NAME: 'schedule', I18N_MAX_PAGES: '10'}), true);
    assert.equal(allowGeneration({I18N_MODE: korean.on.workflow_dispatch.inputs.mode.default,
        GITHUB_EVENT_NAME: 'workflow_dispatch', I18N_MAX_PAGES: '10'}), false);
});

test('Korean discovery and generation exchange Korean artifacts at the exact scanned commit', () => {
    const discover = korean.jobs.discover.steps;
    const generate = korean.jobs.generate.steps;
    assert.equal(generate.find(step => step.uses?.startsWith('actions/checkout@')).with.ref,
        '${{ needs.discover.outputs.source_commit }}');
    const upload = discover.find(step => step.uses?.startsWith('actions/upload-artifact@'));
    const download = generate.find(step => step.uses?.startsWith('actions/download-artifact@'));
    assert.equal(upload.with.name, 'korean-translation-plan-${{ github.run_id }}');
    assert.equal(download.with.name, upload.with.name);
    assert.equal(download.with.path, '${{ runner.temp }}/korean-translation');
    const scripts = [...discover, ...generate].filter(step => /node scripts\/i18n\/workflow-(prs|scan|generate|publish)/.test(step.run ?? ''));
    assert.equal(scripts.length, 6);
    assert(scripts.every(step => step.run.includes('"$RUNNER_TEMP/korean-translation"')));
    const execute = generate.find(step => step.id === 'translation');
    assert.equal(execute.env.I18N_MAX_PAGES, "${{ inputs.mode == 'validate' && '1' || '10' }}");
    assert.equal(execute.env.I18N_PATH, '${{ inputs.path }}');
    for (const steps of [discover, generate]) {
        const scan = steps.find(step => step.run?.includes('workflow-scan.cjs'));
        assert.equal(scan.env.I18N_PATHS, '${{ inputs.paths }}');
    }
    assert.equal(execute.env.I18N_CODEX_MODEL, japanese.jobs.generate.steps.find(step => step.id === 'translation').env.I18N_CODEX_MODEL);
});

test('Korean publication checks the label before auth loading and preserves the verified runtime and refresh path', () => {
    const steps = korean.jobs.generate.steps;
    const label = steps.findIndex(step => step.name === 'Verify the Korean PR label before model calls');
    const auth = steps.findIndex(step => step.id === 'auth');
    assert(label >= 0 && label < auth);
    assert.equal(steps[label].if, "steps.fresh.outputs.can_generate == 'true'");
    assert.equal(steps[label].env.GH_TOKEN, '${{ github.token }}');
    assert(steps[label].run.includes('labels/translate-ko'));
    const runtime = steps.find(step => step.name === 'Install the verified Codex runtime used by Doris review');
    assert.deepEqual(runtime, japanese.jobs.generate.steps.find(step => step.name === runtime.name));
    const sync = steps.find(step => step.name === 'Sync refreshed Codex auth without overwriting a newer snapshot');
    assert.equal(sync.if, "always() && steps.auth.outcome == 'success'");
    assert.equal(sync.run, 'node scripts/i18n/codex-auth.cjs sync');
    const publish = steps.find(step => step.run?.includes('workflow-publish.cjs'));
    assert.equal(publish.if, "steps.translation.outputs.created == 'true' && steps.config.outputs.auth_kind != 'none'");
    assert.equal(publish.env.GH_TOKEN, '${{ steps.app.outputs.token || secrets.I18N_GITHUB_PAT }}');
});
