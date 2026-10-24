const test = require('node:test');
const assert = require('node:assert/strict');
const {coverage} = require('../manual-report.cjs');
const {policy} = require('../ci-plan.cjs');
test('coverage separates route availability, real bodies, drift and exclusions', () => {
    const page = {siteLocale: 'ja', contentId: 'page:a', kind: 'page', fallback: false, state: 'needs-update'};
    const report = coverage([{sourceSha: 'a', locale: 'ja', pages: [page,
        {...page, contentId: 'page:b', fallback: true, state: 'blocked'},
        {...page, contentId: 'utility:c', kind: 'utility'}], reports: [{kind: 'orphan_target'}]}], {partial: true});
    assert.deepEqual(report.groups[0], {locale: 'ja', family: 'page', pluginId: 'default', version: 'unversioned', denominator: 2,
        routes: 2, realTranslations: 1, englishSource: 0, englishFallback: 1, needsUpdate: 1, blocked: 1, missingRoutes: 0});
    assert.equal(report.exceptions.length, 2);
    assert.equal(report.partialCompilation, true);
    assert.throws(() => coverage([{sourceSha: 'a', pages: []}, {sourceSha: 'b', pages: []}]), /Mixed source/);
});
test('shared language mechanisms cannot be silently skipped or downgraded to samples', () => {
    for (const file of ['scripts/i18n/content-impact.cjs', 'scripts/i18n/page-body-loader.cjs', 'src/utils/localizedRoute.ts', 'static/js/locale-bootstrap.js'])
        assert.equal(policy([file]).mode, 'full', file);
    assert.equal(policy(['i18n/zh-CN/code.json']).mode, 'sample');
    assert.equal(policy(['plan-doc/global-lang/tasklist.md']).mode, 'skip');
});
