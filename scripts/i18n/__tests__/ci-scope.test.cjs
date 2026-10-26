const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const {buildScope, validationScope} = require('../build-scope.cjs');
const versions = ['4.x', '3.x', '2.1'];
const managed = ['ja', 'ko', 'ru'];

test('content-only edits retain scoped real builds without rerunning unchanged fixture implementations', () => {
    for (const file of ['i18n/ja/docusaurus-plugin-content-docs/version-4.x/topic.md', 'translations/state/ja/pages/default/4.x/topic.json']) {
        const plan = buildScope([file], versions, managed);
        assert.deepEqual(plan.locales, ['ja']);
        assert.equal(plan.docs_versions, '4.x');
        assert.equal(plan.partial_build, true);
        assert.equal(plan.check_content_fixture, false);
        assert.equal(plan.check_publish_fixture, false);
        assert.equal(plan.check_docs_report, file.startsWith('i18n/'));
    }
    const manual = buildScope(['translations/pages/state.json'], versions, managed);
    assert.equal(manual.optimize_publish, true, 'Keep the existing complete manual-state publication checks');
    assert.equal(manual.check_content_fixture, false);
    assert.equal(manual.check_publish_fixture, false);
});

test('new global language entry points select five languages and every active version', () => {
    for (const file of ['src/components/home-next/NavbarNext.tsx', 'src/components/home-next/LocalizedLink.tsx',
        'src/components/ContentMetadata.tsx', 'src/utils/localizedRoute.ts', 'src/utils/useLocalizedRoute.ts', 'static/.htaccess', 'config/i18n.js', 'docusaurus.config.js', 'package.json', 'yarn.lock', 'scripts/build-locale.cjs']) {
        const plan = buildScope([file], versions, managed);
        assert.deepEqual(plan.locales, ['en', 'zh-CN', 'ja', 'ko', 'ru'], file);
        assert.equal(plan.docs_versions, '', file);
        assert.equal(plan.optimize_publish, true, file);
        assert.equal(plan.partial_build, false, file);
    }
});

test('fixture work follows rendering/publishing dependencies and plan-only edits remain lightweight', () => {
    assert.deepEqual(validationScope(['plan-doc/global-lang/handoff.md']), {
        check_content_fixture: false, check_publish_tests: false, check_publish_fixture: false, check_docs_report: false,
    });
    assert.equal(buildScope(['plan-doc/global-lang/handoff.md'], versions, managed).skip_build, true);
    assert.equal(validationScope(['src/utils/localizedRoute.ts']).check_content_fixture, true);
    assert.equal(validationScope(['src/utils/localizedRoute.ts']).check_publish_fixture, false);
    assert.equal(validationScope(['scripts/publish/apache.cjs']).check_publish_fixture, true);
    assert.equal(validationScope(['scripts/publish/apache.cjs']).check_content_fixture, false);
    assert.equal(validationScope(['scripts/i18n/__tests__/localized-route.test.cjs']).check_content_fixture, false);
    assert.equal(validationScope(['scripts/i18n/__tests__/fixtures/content-manifest.cjs']).check_content_fixture, true);
    for (const file of ['package.json', 'yarn.lock', '.github/workflows/build-check.yml']) {
        assert(Object.values(validationScope([file])).every(Boolean), file);
    }
});

test('CI fails early on cheap checks, retains required job identity and deduplicates report/browser coverage', () => {
    const workflow = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../../.github/workflows/build-check.yml'), 'utf8'));
    const job = workflow.jobs['build-and-deploy'];
    assert.equal(job.name, 'Build Check');
    const steps = job.steps, index = name => steps.findIndex(step => step.name === name);
    assert(index('Publish artifact optimization tests') < index('Translation gate for changed locales'));
    assert(index('Publish artifact optimization tests') < index('Verify native content manifest fixture'));
    assert.match(steps[index('Translation unit tests')].run, /__tests__\/\*\.test\.cjs/);
    assert.equal(steps[index('Translation unit tests')].if, "steps.detect.outputs.translation_tests == 'true'");
    assert.match(steps[index('Install dependencies')].run, /\byarn --frozen-lockfile\b/);
    assert.equal(steps.filter(step => /docs:links:changed/.test(step.run ?? '')).length, 0);
    assert.match(steps[index('Docs governance report')].run, /docs:lint:changed/);
    assert.match(steps[index('Docs governance report')].if, /steps\.detect\.outputs\.docs_report == 'true'/);
    const browserTools = steps[index('Install browser verification tools')].if;
    for (const fixture of ['content_fixture', 'publish_fixture', 'sampling_fixture'])
        assert(browserTools.includes(`steps.detect.outputs.${fixture} == 'true'`), fixture);
    const verify = steps[index('Verify localized static pages')].run;
    assert.match(verify, /\[ "\$LOCALE" = "ru" \]; then EXTRA_ARGS\+=\(--source-locales/);
    assert.match(verify, /\[ "\$LOCALE" = "ko" \] \|\| \[ "\$LOCALE" = "ru" \]; then EXTRA_ARGS=\(--themes\)/);
    assert.match(verify, /verify-static\.cjs/);
    assert.match(verify, /verify-search\.cjs/);
    assert.match(verify, /verify-doc-navigation\.cjs/);
    assert.match(steps[index('Build')].run, /build:publish/);
    assert.deepEqual(workflow.permissions, {contents: 'read'});
    const checkout = steps.find(step => step.uses?.startsWith('actions/checkout@'));
    assert.equal(checkout.with['persist-credentials'], false);
});
