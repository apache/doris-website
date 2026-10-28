// Contributors change only translation bodies. This small real site exercises
// the same admission, effective Git ledger, native render and source invalidation.
const fs = require('node:fs'),
    path = require('node:path'),
    assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const cheerio = require('cheerio');
const { createFixture } = require('./__tests__/fixtures/multi-locale.cjs');
const { hash, loadRecords } = require('./state.cjs'),
    { structure } = require('./structure.cjs');
const { checkChangedTranslations } = require('./check-translations.cjs');
const { collect } = require('./inventory.cjs');
const repo = path.resolve(__dirname, '../..'),
    root = path.join(repo, '.i18n-build/source-revisions-fixture');
const locales = ['ja', 'ko', 'ru'],
    markers = { ja: '開発者による修正です。', ko: '개발자가 직접 수정했습니다.', ru: 'Исправлено разработчиком.' };
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
const commit = message => {
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);
    return git('rev-parse', 'HEAD');
};
async function create() {
    fs.rmSync(root, { recursive: true, force: true });
    const { write } = await createFixture(root),
        sourceCommit = git('rev-parse', 'HEAD');
    const config = JSON.parse(fs.readFileSync(path.join(root, 'translations/config.json')));
    config.maintenancePolicy = 'source-revisions-v1';
    write('translations/config.json', JSON.stringify(config));
    for (const locale of locales) {
        write(
            `translations/scope/${locale}.json`,
            JSON.stringify({
                schemaVersion: 1,
                locale,
                maxBatchPages: 20,
                automaticGroups: ['DEV', '4X', 'COMMUNITY'],
                retainEnglish: [],
                groups: [
                    { id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs' },
                    { id: '4X', pluginId: 'default', version: '4.x', sourceRoot: 'versioned_docs/version-4.x' },
                    { id: 'COMMUNITY', pluginId: 'community', version: 'current', sourceRoot: 'community' },
                ],
            }),
        );
        const file = `translations/state/${locale}/docs.json`,
            state = JSON.parse(fs.readFileSync(path.join(root, file)));
        for (const r of state.pages) {
            const source = fs.readFileSync(path.join(root, r.sourcePath), 'utf8');
            Object.assign(r, {
                sourceCommit,
                sourceHash: hash(source),
                sourceTechnicalHash: (await structure(source, '.md')).technicalHash,
            });
        }
        write(file, JSON.stringify(state));
    }
    const baseline = commit('Automation snapshots before contributor corrections'),
        ledgers = Object.fromEntries(
            locales.map(l => [l, fs.readFileSync(path.join(root, `translations/state/${l}/docs.json`), 'utf8')]),
        );
    for (const locale of locales) {
        const file = `i18n/${locale}/docusaurus-plugin-content-docs/current/01-shared.md`;
        write(file, fs.readFileSync(path.join(root, file), 'utf8') + '\n' + markers[locale] + '\n');
    }
    const manual = commit('Contributor changes only the three translation bodies');
    assert.equal(git('diff', '--name-only', baseline, manual).split('\n').length, 3);
    for (const locale of locales) {
        assert.equal(
            fs.readFileSync(path.join(root, `translations/state/${locale}/docs.json`), 'utf8'),
            ledgers[locale],
        );
        process.env.I18N_LOCALE = locale;
        const admitted = await checkChangedTranslations({ root, base: baseline, locale });
        assert.equal(admitted.checked, 1);
        assert.deepEqual(admitted.errors, []);
    }
    write(
        'body-only-proof.json',
        JSON.stringify({ baseline, manual, filesChanged: 3, ledgerFilesChanged: 0, admissionLocales: locales }),
    );
}
function verify() {
    const results = [];
    for (const locale of ['en', 'zh-CN', ...locales]) {
        const manifest = JSON.parse(
            fs.readFileSync(path.join(root, '.i18n-build/content-manifests', locale + '.json')),
        );
        const page = manifest.pages.find(
            p =>
                p.contentId ===
                require('./content-manifest.cjs').docsId({ pluginId: 'default', version: 'current', docId: 'shared' }),
        );
        assert(page, 'Missing native shared document ' + locale);
        const $ = cheerio.load(fs.readFileSync(path.join(root, 'build', page.route, 'index.html')));
        assert.equal($('link[rel=canonical]').attr('href'), 'https://doris.apache.org' + page.route);
        assert(!/noindex/.test($('meta[name=robots]').attr('content') ?? ''));
        if (locales.includes(locale)) {
            assert.equal(page.fallback, false);
            assert.equal(page.contentLocale, locale);
            assert.equal($('.theme-doc-markdown').attr('lang'), locale);
            assert($('.theme-doc-markdown').text().includes(markers[locale]));
            assert.equal($('[data-translation-status]').attr('data-translation-status'), 'current');
        }
        results.push({
            locale,
            route: page.route,
            fallback: page.fallback,
            bodyOnlyCorrection: locales.includes(locale),
        });
    }
    return results;
}
async function invalidation() {
    const file = path.join(root, 'i18n/zh-CN/docusaurus-plugin-content-docs/current/01-shared.md');
    fs.appendFileSync(file, '\n中文源文随后更新。\n');
    commit('Chinese counterpart changes after the manual corrections');
    const result = [];
    for (const locale of locales) {
        process.env.I18N_LOCALE = locale;
        const native = await collect(root),
            page = native.pages.find(p => p.pluginId === 'default' && p.version === 'current' && p.docId === 'shared');
        assert.equal(page.status, 'stale_unknown');
        assert.equal(page.useTarget, false);
        const record = loadRecords(root, locale).get(JSON.stringify(['default', 'current', 'shared', locale]));
        assert(require('./source-revisions.cjs').canGenerate(record));
        result.push({ locale, status: page.status, canRegenerate: true });
    }
    return result;
}
async function main() {
    const output = path.join(repo, '.i18n-build/source-revisions-verification.json'),
        existing = process.argv.includes('--verify-existing');
    if (!existing) {
        await create();
        const run = spawnSync(process.execPath, [path.join(repo, 'scripts/build-locales.cjs'), '--site-dir', root], {
            stdio: 'inherit',
            env: {
                ...process.env,
                DORIS_ASSET_ORIGIN: '',
                DORIS_OPTIMIZE_PUBLISH: '',
                NODE_OPTIONS: '--max-old-space-size=4096',
            },
        });
        assert.equal(run.status, 0, 'Small source-revisions fixture build failed');
    }
    const publication = verify(),
        sourceChanges = existing ? JSON.parse(fs.readFileSync(output)).sourceChanges : await invalidation(),
        bodyOnly = JSON.parse(fs.readFileSync(path.join(root, 'body-only-proof.json')));
    const browser = process.argv.includes('--browser') ? await checkBrowser(publication) : undefined;
    fs.writeFileSync(
        output,
        JSON.stringify(
            {
                scope: 'small isolated five-language fixture; no full website build',
                root,
                bodyOnly,
                publication,
                sourceChanges,
                browser,
            },
            null,
            2,
        ) + '\n',
    );
    console.log(JSON.stringify({ output, publication, sourceChanges, browser }));
}
async function checkBrowser(publication) {
    const { chromium } = require('playwright'),
        { createServer } = require('../publish/serve.cjs'),
        server = createServer(path.join(root, 'build'));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true }),
        errors = [],
        results = [];
    try {
        const page = await browser.newPage();
        page.on('pageerror', e => errors.push(e.message));
        for (const row of publication.filter(p => locales.includes(p.locale))) {
            await page.goto(`http://127.0.0.1:${server.address().port}${row.route}`);
            await page.waitForLoadState('networkidle');
            assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), row.locale);
            assert((await page.locator('.theme-doc-markdown').innerText()).includes(markers[row.locale]));
            assert.equal(
                await page.locator('[data-translation-status]').getAttribute('data-translation-status'),
                'current',
            );
            results.push({ locale: row.locale, manualBody: true, hydration: true });
        }
        assert.deepEqual(errors, []);
        return { results, errors };
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}
if (require.main === module)
    main().catch(e => {
        console.error(e);
        process.exitCode = 1;
    });
module.exports = { main };
