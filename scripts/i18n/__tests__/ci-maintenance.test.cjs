const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {actionSubmodulesOnly} = require('../ci-maintenance.cjs');
const {buildScope, validationScope} = require('../build-scope.cjs');
const {policy, plan} = require('../ci-plan.cjs');

const versions = ['4.x', '3.x'];
const moduleConfig = (name, target, url = 'https://example.invalid/action.git') =>
    `[submodule "${name}"]\n\tpath = ${target}\n\turl = ${url}\n`;
const action = moduleConfig('action', '.github/actions/example');
const vendor = moduleConfig('vendor', 'vendor/example');

function repository(t, before, after, extra = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-maintenance-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: 'pipe'}).trim();
    const write = (file, content) => {
        const destination = path.join(root, file);
        fs.mkdirSync(path.dirname(destination), {recursive: true});
        if (content === null) fs.rmSync(destination, {force: true});
        else fs.writeFileSync(destination, content);
    };
    const commit = () => {
        git('add', '.');
        git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
            '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Fixture');
    };
    git('init', '-q');
    write('.gitignore', '.i18n-build/\n');
    write('versions.json', JSON.stringify(versions));
    write('.gitmodules', before);
    commit();
    const base = git('rev-parse', 'HEAD');
    write('.gitmodules', after);
    for (const [file, content] of Object.entries(extra)) write(file, content);
    commit();
    return {root, base, git};
}

for (const [name, before, after] of [
    ['add an action', null, action],
    ['remove an action', action, null],
    ['change an action URL', action, action.replace('action.git', 'replacement.git')],
    ['rename an action', action, action.replace('"action"', '"renamed"')],
    ['keep an unrelated module unchanged', vendor + action, vendor + action.replace('action.git', 'replacement.git')],
    ['change only comments', vendor, '# Maintenance comment\n' + vendor],
]) test(`gitmodules maintenance can ${name}`, t => {
    const {root, base} = repository(t, before, after);
    assert.equal(actionSubmodulesOnly(root, base), true);
    const selected = plan({root, base});
    assert.equal(selected.mode, 'fixtures');
    assert.equal(selected.impact.skip_build, true);
    assert.equal(selected.runPublishFixture, false);
});

for (const [name, before, after] of [
    ['add a site module', action, action + vendor],
    ['remove a site module', vendor + action, action],
    ['change a site module URL', vendor, vendor.replace('action.git', 'replacement.git')],
    ['move an action outside CI', action, moduleConfig('action', 'vendor/example')],
    ['move a site module into CI', vendor, moduleConfig('vendor', '.github/actions/example')],
    ['use a path that escapes CI', action, moduleConfig('action', '.github/actions/../../src/example')],
    ['omit the module path', action, '[submodule "action"]\nurl = https://example.invalid/action.git\n'],
    ['duplicate a module key', action, action + '\tpath = .github/actions/another\n'],
    ['duplicate a module path', action, action + moduleConfig('another', '.github/actions/example')],
    ['add an unknown configuration section', action, action + '[include]\npath = other-config\n'],
    ['contain invalid configuration', action, '[submodule "broken"\n'],
]) test(`gitmodules changes still require full CI when they ${name}`, t => {
    const {root, base} = repository(t, before, after);
    assert.equal(actionSubmodulesOnly(root, base), false);
    assert.equal(plan({root, base}).mode, 'full');
});

test('missing base history cannot reduce submodule validation', t => {
    const {root} = repository(t, null, action);
    assert.equal(actionSubmodulesOnly(root, '0'.repeat(40)), false);
    assert.equal(policy(['.gitmodules']).mode, 'full');
    assert.equal(policy(['.gitmodules'], {forceSample: true}).mode, 'full');
});

test('top-level publishing notes skip builds while executable code and fixture inputs retain checks', () => {
    for (const file of ['scripts/publish/README.md', 'scripts/publish/oss-oidc-probe.md']) {
        const selected = policy([file]);
        const scope = buildScope([file], versions);
        assert.equal(selected.mode, 'fixtures');
        assert.equal(selected.runPublishFixture, false);
        assert.equal(scope.skip_build, true);
        assert.equal(scope.optimize_publish, false);
    }
    for (const file of ['scripts/publish/optimize.cjs', 'scripts/publish/__tests__/fixtures/example.md']) {
        assert.equal(validationScope([file]).check_publish_tests, true);
        assert.equal(policy([file]).runPublishFixture, true);
        assert.equal(buildScope([file], versions).optimize_publish, true);
    }
});

test('the OIDC-action PR file set selects no website or publishing fixture build through both CLIs', t => {
    const fixture = repository(t, action, action + moduleConfig('oidc', '.github/actions/oidc'), {
        '.github/workflows/verify-website-oss.yml': 'name: OIDC probe\n',
        '.github/scripts/test_website_oss_probe.py': '# Workflow boundary tests\n',
        'scripts/publish/oss-oidc-probe.md': '# Operator notes\n',
    });
    fixture.git('update-index', '--add', '--cacheinfo', `160000,${fixture.base},.github/actions/oidc`);
    fixture.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
        '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Add pinned action');
    const selected = plan(fixture);
    assert.equal(selected.files.length, 5);
    assert.equal(selected.mode, 'fixtures');
    assert.equal(selected.impact.skip_build, true);
    assert.equal(selected.publicationAllowed, false);
    for (const key of ['runPublishFixture', 'runCompilerFixture', 'runSearchFixture']) assert.equal(selected[key], false);
    const env = {...process.env, GITHUB_EVENT_PATH: '', GITHUB_OUTPUT: '', GITHUB_STEP_SUMMARY: ''};
    const cli = name => JSON.parse(execFileSync(process.execPath,
        [path.resolve(__dirname, '..', name), fixture.base], {cwd: fixture.root, env, encoding: 'utf8'}));
    assert.equal(cli('build-scope.cjs').skip_build, true);
    assert.equal(cli('ci-plan.cjs').mode, 'fixtures');
    assert.equal(plan({...fixture, forceFull: true}).mode, 'full');
    assert.equal(plan({...fixture, event: {pull_request: {labels: [{name: 'ci/full'}]}}}).mode, 'full');
    for (const file of ['package.json', 'yarn.lock', 'versions.json', 'unknown-input.bin']) {
        assert.equal(policy([...selected.files, file], {actionSubmodules: true}).mode, 'full');
    }
});
