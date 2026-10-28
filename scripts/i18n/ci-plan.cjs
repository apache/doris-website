// CI policy is separate from the production build scope. Sample artifacts never
// claim full compilation coverage and are not valid publication inputs.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {locales, localeRegistry} = require('../../config/i18n');
const {buildScope, validationScope} = require('./build-scope.cjs');
const {managedLocales} = require('./state.cjs');
const {analyzeImpact} = require('./content-impact.cjs');
const mechanism = /^(src\/utils\/(localizedRoute|localePreference|contentRoute|useLocalizedRoute|useLanguageItems)\.[jt]sx?$|src\/components\/Content(Route|Metadata)\.tsx$|scripts\/i18n\/(content-manifest|manual-state|manual-plugins|native-context|route-context|page-body|page-body-loader|sitemap|content-impact|manual-report|embedded-messages|locale-entry)\.cjs$|static\/js\/[^/]*bootstrap\.js$|static\/\.htaccess$|translations\/(pages|shared)\/registry\.json$|config\/(?:(i18n|ssrTemplate)\.js|locale-entry\.json)$)/;
const runtime =
    /^(src\/|config\/|docusaurus\.config\.js$|sidebars[^/]*\.(ts|json)$|versioned_sidebars\/|scripts\/i18n\/(automated-blog|automated-blog-body-loader|release-policy|docs-plugin|status-plugin|state|structure|content-plugin|content-loader|source-groups|code-prose|protection|content-manifest|manual-state|manual-plugins|native-context|route-context|page-body|page-body-loader|sitemap)\.cjs$)/;
const content =
    /^(static\/|docs\/|versioned_docs\/|community\/|course\/|releasenotes\/|blog\/|i18n\/|translations\/(pages|blog|state)\/)/;
const highRisk = /^(package\.json|yarn\.lock|versions\.json|config\/versions-plugin\.js)$/;
// Maintenance notes are not site content. The report registry, in contrast,
// changes ordinary pages, which the real sample build always renders.
const maintenanceNotes = /^translations\/(?:[^/]+\.md|scope\/README\.md)$/;
// Registered locale scope/glossary files are validated offline and exercised
// through native metadata plus representative builds, like other known shared
// language inputs. Unknown translation configuration still requires full CI.
const maintenanceConfig = file => {
    if (['translations/config.json', 'translations/release-notes-baseline.json', 'translations/blog-baseline.json'].includes(file)) return true;
    const match=file.match(/^translations\/(?:scope|glossary)\/([^/]+)\.json$/);
    return !!match && localeRegistry.some(locale=>locale.optional&&locale.code===match[1]);
};
const reportRegistry = 'translations/community-reports.json';
function policy(files, {forceFull = false, forceSample = false} = {}) {
    const risk = files.filter(file => highRisk.test(file));
    const changed = files.some(file => content.test(file));
    const shared = files.some(file => runtime.test(file) || mechanism.test(file) || file === reportRegistry || maintenanceConfig(file));
    const checks = validationScope(files);
    const ci = files.some(file => /^(scripts\/|\.github\/)/.test(file));
    const unknown = files.filter(
        file =>
            !runtime.test(file) &&
            !mechanism.test(file) &&
            !content.test(file) &&
            file !== reportRegistry &&
            !maintenanceConfig(file) &&
            !maintenanceNotes.test(file) &&
            !/^((scripts|\.github|plan-doc|review-docs|\.agents)\/|README\.md$|AGENTS\.md$|LICENSE$|NOTICE$)/.test(
                file,
            ),
    );
    const mode =
        forceFull || risk.length || unknown.length
            ? 'full'
            : shared || changed || forceSample
              ? 'sample'
              : ci
                ? 'fixtures'
                : 'skip';
    return {
        mode,
        selection: shared || forceSample ? 'representative' : 'changed',
        reasons: forceFull
            ? ['explicit full validation']
            : risk.length
              ? risk
              : unknown.length
                ? unknown
                : [mode],
        runContentFixture:
            (shared && checks.check_content_fixture) ||
            files.some(file =>
                /verify-(content-fixture|doc-dates-fixture|blog(?:-automation)?-fixture|global-language)|create-blog-baseline\.cjs$|__tests__\/fixtures\/(content-manifest|blog)\.cjs$/.test(file),
            ),
        runSamplingFixture: files.some(file =>
            /^scripts\/(build-locales?\.cjs$|i18n\/(compiler-processes|ci-sample|ci-blog-sample|build-cache|verify-ci-sampl(?:e|ing-fixture))\.cjs$)/.test(file)),
        runCompilerFixture: mode === 'full' || files.some(file =>
            /^scripts\/(build-locales?\.cjs|i18n\/(compiler-processes|verify-compiler-fixture)\.cjs)$/.test(file)),
        runSearchFixture: mode === 'full' || files.some(file =>
            /^(src\/theme\/(SearchBar|SearchPage)\/|src\/utils\/(fetchSearchIndex|searchMessages|searchScopes|useLanguageItems)\.[jt]sx?$|src\/hooks\/use-search-query\.ts$|docusaurus\.config\.js$|scripts\/build-locales?\.cjs$|scripts\/i18n\/(compiler-processes|search-plugin|search-worker-loader|verify-search-transport)\.cjs$)/.test(file)),
        runPublishFixture: checks.check_publish_fixture || mode === 'full' || files.includes('scripts/i18n/compiler-processes.cjs'),
        runTranslationTests: mode === 'full' || files.some(file =>
            runtime.test(file) || mechanism.test(file) || maintenanceConfig(file) || /^scripts\/(i18n\/|build-locales?\.cjs$)/.test(file)
                || file === '.github/workflows/build-check.yml'),
        runDocsReport: mode === 'full' || (mode !== 'fixtures' && checks.check_docs_report),
        publicationAllowed: mode === 'full',
        checkRenderedLinks: !(files.length && files.every(file => /\.(css|scss|sass)$/.test(file))),
    };
}
function plan({root, base, event = {}, forceFull = false, forceSample = false}) {
    const files = execFileSync('git', ['diff', '--name-only', '-z', base, 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
    })
        .split('\0')
        .filter(Boolean);
    const labels = event.pull_request?.labels ?? [];
    const selected = policy(files, {
        forceFull:
            forceFull ||
            event.inputs?.validation === 'full' ||
            labels.some(label => label.name === 'ci/full'),
        forceSample: forceSample || event.inputs?.validation === 'sample',
    });
    const dependencies = analyzeImpact(root, base, files);
    const impact = buildScope(
        files,
        JSON.parse(fs.readFileSync(path.join(root, 'versions.json'))),
        managedLocales(root),
        dependencies,
    );
    let requested = impact.locales;
    if (selected.mode === 'full' || selected.selection === 'representative') requested = locales;
    else if (selected.mode === 'sample') {
        // English source changes may alter any target's fallback or source
        // freshness; use every locale until an exact dependency proof exists.
        requested = files.some(file =>
            /^(docs|versioned_docs|community|course|releasenotes|blog)\//.test(file),
        )
            ? locales
            : [...new Set(['en', ...requested])];
    }
    if (selected.mode === 'sample' && dependencies.complete && dependencies.locales.length) requested = dependencies.locales;
    if (selected.mode === 'sample' && !requested.length) requested = locales;
    const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: root,
        encoding: 'utf8',
    }).trim();
    const trackedDiffHash = createHash('sha256')
        .update(
            execFileSync('git', ['diff', 'HEAD', '--binary'], {
                cwd: root,
                maxBuffer: 16 * 1024 * 1024,
            }),
        )
        .digest('hex');
    return {
        schemaVersion: 1,
        sourceSha,
        trackedDiffHash,
        baseSha: base,
        files,
        ...selected,
        impact,
        dependencies,
        locales: locales.filter(locale => requested.includes(locale)),
        enabledLocales: localeRegistry.filter(locale => locale.optional).map(locale => locale.code),
        activeVersions: [
            'current',
            ...JSON.parse(fs.readFileSync(path.join(root, 'versions.json'))),
        ],
    };
}
if (require.main === module) {
    try {
        const root = process.cwd(),
            args = process.argv.slice(2),
            base = args[0];
        if (!base) throw new Error('Usage: ci-plan.cjs <base SHA> [--full|--sample]');
        const event = process.env.GITHUB_EVENT_PATH
            ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH))
            : {};
        const result = plan({
            root,
            base,
            event,
            forceFull: args.includes('--full'),
            forceSample: args.includes('--sample'),
        });
        fs.mkdirSync(path.join(root, '.i18n-build'), {recursive: true});
        fs.writeFileSync(
            path.join(root, '.i18n-build/ci-plan.json'),
            JSON.stringify(result, null, 2) + '\n',
        );
        console.log(JSON.stringify(result, null, 2));
        if (process.env.GITHUB_STEP_SUMMARY)
            fs.appendFileSync(
                process.env.GITHUB_STEP_SUMMARY,
                `### Validation scope: ${result.mode}\n\nSource: \`${result.sourceSha}\`. Languages: ${result.locales.join(', ') || 'none'}.\n\n` +
                    (result.mode === 'full'
                        ? 'Full document compilation and publication artifact verification requested.\n\n'
                        : 'This check does **not** claim full document compilation or produce a publication artifact.\n\n'),
            );
        if (process.env.GITHUB_OUTPUT)
            fs.appendFileSync(
                process.env.GITHUB_OUTPUT,
                Object.entries({
                    validation_mode: result.mode,
                    validation_locales: result.locales.join(','),
                    validation_enabled_locales: result.enabledLocales.join(','),
                    content_fixture: result.runContentFixture,
                    publish_fixture: result.runPublishFixture,
                    sampling_fixture: result.runSamplingFixture,
                    search_fixture: result.runSearchFixture,
                    compiler_fixture: result.runCompilerFixture,
                    translation_tests: result.runTranslationTests,
                    docs_report: result.runDocsReport,
                })
                    .map(([k, v]) => `${k}=${v}\n`)
                    .join(''),
            );
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}
module.exports = {policy, plan};
