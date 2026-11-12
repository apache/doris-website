// Real five-language publication of a post introduced after a Git cutoff.
// History includes existing manual targets, including Chinese; generation uses
// the same planner, per-page ledger and guarded writer as scheduled workflows.
const assert = require('node:assert/strict'),
    fs = require('node:fs'),
    path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const cheerio = require('cheerio');
const { createBlogFixture } = require('./__tests__/fixtures/blog.cjs');
const { create: baseline } = require('./create-blog-baseline.cjs');
const { group, decision } = require('./automated-blog.cjs');
const { loadRecords } = require('./state.cjs');
const { blogStateFileFor, digestFiles } = require('./manual-state.cjs');
const { audit } = require('./audit-coverage.cjs'),
    { plan } = require('./plan-translations.cjs');
const { prepare, applyCandidates, readState, targetFor } = require('./translate-docs.cjs');
const repo = path.resolve(__dirname, '../..'),
    root = path.join(repo, '.i18n-build/blog-automation-fixture');
const managed = ['ja', 'ko', 'ru'],
    words = { ja: '日本語', ko: '한국어', ru: 'Русский' };
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
const commit = message => {
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', message);
    return git('rev-parse', 'HEAD');
};
const write = (file, bytes) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), bytes);
};
const file = '2020-01-01-future.mdx',
    sourcePath = 'blog/' + file;
const source =
    "---\ntitle: Future article\nsummary: Future summary with 6 nodes\nslug: /future-post\nauthors: [fixture]\ntags: [Tech Sharing]\nimage: /sample.svg\n---\n\nimport Label from './_parts/Label';\n\nFuture English body with 6 nodes.\n\n## Usage\n\n<Label/>\n\n![Shared diagram](./_parts/sample.svg)\n\n[History](./2026-01-01-sample.md#usage)\n\n```sql\nSELECT 1;\n```\n";
async function create() {
    fs.rmSync(root, { recursive: true, force: true });
    await createBlogFixture(root);
    // Native TOC measures .navbar during hydration. The tiny navigation stub
    // must expose the same element contract as the production navbar.
    const navbar = 'src/components/home-next/NavbarNext.tsx';
    write(navbar, fs.readFileSync(path.join(root, navbar), 'utf8').replace('<nav>', '<nav className="navbar">'));
    // Explicitly publish a historical Chinese target before the cutoff.
    const old = '2026-01-01-sample.md',
        oldPath = 'blog/' + old,
        target = `i18n/zh-CN/docusaurus-plugin-content-blog/${old}`;
    write(
        target,
        fs
            .readFileSync(path.join(root, oldPath), 'utf8')
            .replaceAll('English article', '中文历史文章')
            .replace('./_parts/sample.svg', '@site/blog/_parts/sample.svg'),
    );
    const record = {
        contentId: 'blog:' + old,
        locale: 'zh-CN',
        state: 'ready',
        sourceFiles: [oldPath, 'blog/_parts/Label.jsx', 'blog/_parts/sample.svg'],
        targetFiles: [target],
        reviewStatus: 'unverified',
    };
    record.sourceHash = digestFiles(root, record.sourceFiles);
    record.targetHash = digestFiles(root, record.targetFiles);
    write(blogStateFileFor(record), JSON.stringify({ schemaVersion: 1, page: record }));
    const cutoff = commit('Historical blogs and Chinese target');
    await baseline(root, cutoff);
    for (const locale of managed) {
        write(
            `translations/scope/${locale}.json`,
            JSON.stringify({
                schemaVersion: 1,
                locale,
                maxBatchPages: 20,
                groups: [group],
                automaticGroups: ['BLOG'],
                retainEnglish: [],
                retainSidebarLabels: [],
            }),
        );
        write(`translations/state/${locale}/resolved-deletions.json`, '{"schemaVersion":1,"deletions":[]}');
    }
    for (const name of ['sidebars.ts', 'sidebarsCommunity.json', 'sidebarsCourse.ts', 'sidebarsReleases.json'])
        write(name, '{}');
    write('audit-baseline/summary.json', JSON.stringify({ sourceCommit: cutoff }));
    for (const name of ['dev', '4x', 'community']) write(`audit-baseline/${name}.json`, '{"entryFiles":[]}');
    write(sourcePath, source);
    commit('Genuinely new blog with an older display date');
    const results = [];
    for (const locale of managed) {
        process.env.I18N_LOCALE = locale;
        const report = await audit({ root, sourceRef: 'HEAD', baseline: path.join(root, 'audit-baseline') });
        assert.deepEqual(report.automaticCounts, { required: 1, current: 0, pending: 1 });
        assert.equal(report.groups[0].counts.historicalExcluded, 4);
        const scope = JSON.parse(fs.readFileSync(path.join(root, `translations/scope/${locale}.json`)));
        const options = {
            report,
            scope,
            records: loadRecords(root, locale),
            readCurrent: name => fs.readFileSync(path.join(root, name), 'utf8'),
            readAt: (ref, name) => git('show', `${ref}:${name}`),
        };
        const planned = await plan(options);
        assert.equal(planned.selected.length, 1);
        const task = planned.tasks.find(t => t.id === planned.selected[0]);
        assert.equal(task.sourcePath, sourcePath);
        const reserved = await plan({
            ...options,
            active: {
                schemaVersion: 1,
                candidates: [{ ...task, pr: 'https://github.com/apache/doris-website/pull/1' }],
            },
        });
        assert.equal(reserved.selected.length, 0);
        const state = readState(root, locale);
        let calls = 0;
        const candidate = await prepare({
            root,
            plan: planned,
            taskId: task.id,
            scope,
            state,
            target: targetFor(root, locale),
            glossary: { schemaVersion: 1, version: 'fixture', keep: [], terms: [] },
            adapter: {
                model: 'fixture',
                async translate({ units }) {
                    calls++;
                    return { translations: units.map(u => ({ id: u.id, text: words[locale] + ' ' + u.text })) };
                },
            },
        });
        assert(calls > 0);
        assert(candidate.target.includes(`summary: ${words[locale]}`));
        applyCandidates(state, [candidate]);
        commit(`${locale} generated blog and independent state`);
        const admission = await require('./check-translations.cjs').checkChangedTranslations({
            root,
            base: planned.sourceCommit,
            locale,
        });
        assert.equal(admission.checked, 1);
        assert.deepEqual(admission.errors, []);
        const links = spawnSync(
            'python3',
            [path.join(repo, 'scripts/check_md_links_single.py'), path.join(root, task.targetPath), '--no-external'],
            { encoding: 'utf8' },
        );
        assert.equal(links.status, 0, links.stdout + '\n' + links.stderr);
        assert((await decision(root, locale, file)).useTarget);
        const current = await audit({ root, sourceRef: 'HEAD', baseline: path.join(root, 'audit-baseline') });
        assert.deepEqual(current.automaticCounts, { required: 1, current: 1, pending: 0 });
        results.push({
            locale,
            historicalExcluded: 4,
            required: 1,
            current: 1,
            modelCalls: calls,
            reservationPassed: true,
        });
    }
    // Update the same committed MDX identity after the first translations.
    // Its prior targets now contain native heading IDs, as real bots produce.
    write(sourcePath, source.replace('Future English body with 6 nodes.', 'Future English body with 7 nodes.'));
    commit('Update the genuinely new blog after its first translation');
    for (const locale of managed) {
        process.env.I18N_LOCALE = locale;
        const report = await audit({ root, sourceRef: 'HEAD', baseline: path.join(root, 'audit-baseline') });
        const scope = JSON.parse(fs.readFileSync(path.join(root, `translations/scope/${locale}.json`)));
        const planned = await plan({
            report,
            scope,
            records: loadRecords(root, locale),
            readCurrent: name => fs.readFileSync(path.join(root, name), 'utf8'),
            readAt: (ref, name) => git('show', `${ref}:${name}`),
        });
        assert.equal(planned.selected.length, 1);
        const task = planned.tasks.find(t => t.id === planned.selected[0]);
        assert.equal(task.kind, 'update');
        const state = readState(root, locale),
            oldTitle = require('gray-matter')(fs.readFileSync(path.join(root, task.targetPath), 'utf8')).data.title;
        const candidate = await prepare({
            root,
            plan: planned,
            taskId: task.id,
            scope,
            state,
            target: targetFor(root, locale),
            glossary: { schemaVersion: 1, version: 'fixture', keep: [], terms: [] },
            adapter: {
                model: 'fixture',
                async translate({ units }) {
                    return { translations: units.map(u => ({ id: u.id, text: words[locale] + ' ' + u.text })) };
                },
            },
        });
        assert(candidate.target.includes('Future English body with 7 nodes.'));
        assert.equal(require('gray-matter')(candidate.target).data.title, oldTitle);
        applyCandidates(state, [candidate]);
        commit(`${locale} updated MDX blog and page state`);
        const admission = await require('./check-translations.cjs').checkChangedTranslations({
            root,
            base: planned.sourceCommit,
            locale,
        });
        assert.equal(admission.checked, 1);
        assert.deepEqual(admission.errors, []);
        assert((await decision(root, locale, file)).useTarget);
        results.find(r => r.locale === locale).subsequentUpdate = true;
    }
    await checkReload();
    write('eligibility.json', JSON.stringify(results, null, 2));
    return results;
}
async function checkReload() {
    const { loadContext } = require('@docusaurus/core/lib/server/site.js');
    const { loadPluginConfigs } = require('@docusaurus/core/lib/server/plugins/configs.js');
    const { initPluginsConfigs } = require('@docusaurus/core/lib/server/plugins/init.js');
    const ctx = await loadContext({ siteDir: root, locale: 'ja' });
    const configs = (await loadPluginConfigs(ctx)).filter(c => c.plugin.isManualBlogPlugin);
    const [{ plugin }] = await initPluginsConfigs(ctx, configs);
    await plugin.loadContent();
    const rule = plugin
        .configureWebpack()
        .module.rules.find(r => r.use?.some(u => u.loader.endsWith('/automated-blog-body-loader.cjs')));
    const mapping = rule.use[0].options.translations,
        resource = path.join(root, sourcePath);
    const target = mapping[resource].target,
        original = fs.readFileSync(target, 'utf8');
    assert(rule.test(resource));
    try {
        fs.writeFileSync(target, original + '\nA human correction.\n');
        await plugin.loadContent();
        assert(!rule.test(resource));
        assert(!mapping[resource], 'An earlier Webpack loader must not retain stale target hashes');
    } finally {
        fs.writeFileSync(target, original);
    }
    await plugin.loadContent();
    assert(rule.test(resource));
    assert.equal(mapping[resource].target, target);
    write(
        'reload-guard.json',
        JSON.stringify({ sameLoaderOptions: true, targetModifiedFallback: true, restoredTarget: true }),
    );
}
function verify() {
    const results = [];
    for (const locale of ['en', 'zh-CN', ...managed]) {
        const prefix = locale === 'en' ? '' : `/${locale}`,
            manifest = JSON.parse(fs.readFileSync(path.join(root, '.i18n-build/content-manifests', locale + '.json')));
        const read = route => cheerio.load(fs.readFileSync(path.join(root, 'build', route, 'index.html')));
        const posts = manifest.pages.filter(p => p.kind === 'blog' && !p.aggregate);
        assert.equal(posts.length, 5);
        for (const entry of posts) {
            const future = entry.contentId === 'blog:' + file,
                fallback = locale !== 'en' && (!future || locale === 'zh-CN');
            assert.equal(entry.fallback, fallback, entry.route);
            assert.equal(entry.contentLocale, fallback ? 'en' : locale);
            const $ = read(entry.route);
            assert.equal($('article.blog-article-content').attr('lang'), fallback ? 'en' : locale);
            assert.equal(
                $('link[rel=canonical]').attr('href'),
                'https://doris.apache.org' + (fallback ? entry.englishRoute : entry.route),
            );
            assert.equal(/noindex/.test($('meta[name=robots]').attr('content') ?? ''), !entry.indexable);
            const languages = $('link[rel=alternate][hreflang]')
                .map((_, n) => $(n).attr('hreflang'))
                .get();
            assert.deepEqual(
                languages.sort(),
                (entry.englishRoute.endsWith('/unlisted/')
                    ? []
                    : future
                      ? ['en-US', 'ja', 'ko', 'ru', 'x-default']
                      : ['en-US', 'x-default']
                ).sort(),
            );
            if (future) {
                assert(
                    $('article')
                        .text()
                        .includes(
                            fallback || locale === 'en'
                                ? 'Future English body'
                                : words[locale] + ' Future English body',
                        ),
                );
                assert($('article code').text().includes('SELECT 1;'));
                assert.equal(
                    $('article a')
                        .filter((_, n) => $(n).text().endsWith('History'))
                        .attr('href'),
                    prefix + '/blog/native-0/#usage',
                );
                for (const image of $('article img[src]').toArray()) {
                    const src = $(image).attr('src');
                    assert(
                        src.startsWith('data:image/') ||
                            (src.startsWith('/') && fs.existsSync(path.join(root, 'build', src))),
                        'Missing relative blog image: ' + src,
                    );
                }
            }
            assert(
                !JSON.stringify(require('./content-manifest.cjs').routeData(entry)).includes('sourceTechnicalHash'),
                'Automation ledger must stay out of browser route data',
            );
        }
        const list = read(prefix + '/blog/');
        assert(list('article[itemprop=blogPost]').length >= 4);
        assert.equal(list('.blog-language-note').length > 0, locale !== 'en');
        const feed = path.join(root, 'build', prefix, 'blog/rss.xml');
        if (locale === 'zh-CN') assert(!fs.existsSync(feed));
        else {
            const xml = cheerio.load(fs.readFileSync(feed), { xmlMode: true });
            assert.equal(xml('item').length, locale === 'en' ? 4 : 1);
            if (locale !== 'en') assert(xml('item link').text().includes('/future-post/'));
        }
        assert(!fs.existsSync(path.join(root, 'build', prefix, 'blog/draft/index.html')));
        results.push({
            locale,
            posts: posts.length,
            translated: locale === 'en' ? 5 : managed.includes(locale) ? 1 : 0,
            seo: true,
            relativeAssets: true,
            rss: true,
        });
    }
    return results;
}
async function checkBrowser() {
    const { chromium } = require('playwright'),
        { createServer } = require('../publish/serve.cjs');
    const server = createServer(path.join(root, 'build'));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true }),
        errors = [],
        results = [];
    try {
        const page = await browser.newPage();
        page.on('pageerror', error => errors.push(error.message));
        for (const locale of ['en', 'zh-CN', ...managed]) {
            const prefix = locale === 'en' ? '' : `/${locale}`;
            for (const post of ['future-post', 'native-0']) {
                await page.goto(`http://127.0.0.1:${server.address().port}${prefix}/blog/${post}/`);
                await page.waitForLoadState('networkidle');
                const expected = post === 'future-post' && managed.includes(locale) ? locale : 'en';
                assert.equal(await page.locator('article.blog-article-content').getAttribute('lang'), expected);
                if (expected !== 'en') assert((await page.locator('article').innerText()).includes(words[locale]));
                assert((await page.locator('article code').count()) > 0);
                results.push({ locale, post, contentLocale: expected, hydration: true });
            }
        }
        assert.deepEqual(errors, []);
        return { results, errors };
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}
async function main() {
    const existing = process.argv.includes('--verify-existing');
    const generation = existing ? JSON.parse(fs.readFileSync(path.join(root, 'eligibility.json'))) : await create();
    if (!existing) {
        const run = spawnSync(process.execPath, [path.join(repo, 'scripts/build-locales.cjs'), '--site-dir', root], {
            stdio: 'inherit',
            env: {
                ...process.env,
                DORIS_ASSET_ORIGIN: '',
                DORIS_OPTIMIZE_PUBLISH: '',
                NODE_OPTIONS: '--max-old-space-size=4096',
            },
        });
        assert.equal(run.status, 0, 'Small blog automation fixture build failed');
    }
    const publication = verify(),
        browser = process.argv.includes('--browser') ? await checkBrowser() : undefined,
        output = path.join(repo, '.i18n-build/blog-automation-verification.json');
    write('verification.json', JSON.stringify({ generation, publication, browser }, null, 2));
    fs.writeFileSync(
        output,
        JSON.stringify(
            {
                scope: 'small isolated fixture; no full website build',
                root,
                generation,
                publication,
                browser,
                reloadGuard: fs.existsSync(path.join(root, 'reload-guard.json'))
                    ? JSON.parse(fs.readFileSync(path.join(root, 'reload-guard.json')))
                    : undefined,
            },
            null,
            2,
        ) + '\n',
    );
    console.log(JSON.stringify({ output, generation, publication }));
}
if (require.main === module)
    main().catch(e => {
        console.error(e);
        process.exitCode = 1;
    });
module.exports = { main };
