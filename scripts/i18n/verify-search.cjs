const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createServer} = require('../publish/serve.cjs');
const root = path.resolve(__dirname, '../..');
const contexts = ['docs/dev', 'docs/4.x', 'community'];
const route = url => new URL(url, 'https://doris.apache.org').pathname.replace(/\/?$/, '/');
const corpus = {
    ja: {database:'データベース', query:'分析', community:'コミュニティ'},
    ko: {database:'데이터베이스', query:'쿼리', community:'커뮤니티'},
    ru: {database:'данных', query:'запрос', community:'сообщество'},
};

function checkIndexes({site, locale, manifest}) {
    const summary = JSON.parse(fs.readFileSync(path.join(site, locale, `${locale}-search-summary.json`), 'utf8'));
    assert.equal(summary.locale, locale);
    assert.deepEqual(Object.keys(summary.contexts).sort(), [...contexts].sort());
    const files = fs.readdirSync(path.join(site, locale)).filter(file => /^search-index.*\.json$/.test(file));
    const fileFor = context => {
        const prefix = `search-index${context ? '-'+context.replace(/\//g,'-') : ''}`;
        const candidates = files.filter(file => file === `${prefix}.json`
            || new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}-[a-f0-9]+\\.json$`).test(file));
        assert.equal(candidates.length, 1, `Missing/ambiguous ${locale} index: ${context}`);
        return candidates[0];
    };
    const expected = new Map(contexts.map(context => [context, new Set()]));
    for (const page of manifest.pages) {
        if (page.locale !== locale || page.status !== 'current' || !page.useTarget || !page.indexable) continue;
        const context = page.pluginId === 'community' && page.version === 'current' ? 'community'
            : page.pluginId === 'default' && page.version === 'current' ? 'docs/dev'
                : page.pluginId === 'default' && page.version === '4.x' ? 'docs/4.x' : null;
        if (context) expected.get(context).add(route(page.permalink));
    }
    const indexFiles = {};
    for (const context of ['', ...contexts]) {
        const file = fileFor(context);
        indexFiles[context] = file;
        const sections = JSON.parse(fs.readFileSync(path.join(site, locale, file), 'utf8'));
        const documents = sections.flatMap(section => section.documents ?? []).filter(doc => doc.u);
        for (const doc of documents) assert(doc.u.startsWith(`/${locale}/`), `Cross-locale or external result: ${doc.u}`);
        const urls = new Set(documents.map(doc => route(doc.u)));
        if (!context) assert(sections.every(section => !section.documents?.length), 'Root index repeats context data');
        else {
            for (const url of urls) assert(url.startsWith(`/${locale}/${context}/`), `Wrong context/locale in ${file}: ${url}`);
            assert.deepEqual([...urls].sort(), [...expected.get(context)].sort(), `Invalid/fallback/stale/unlisted target in ${file}, or a current target is missing`);
            assert.equal(summary.contexts[context], expected.get(context).size);
        }
    }
    assert.equal(summary.indexedPages, [...expected.values()].reduce((sum, pages) => sum + pages.size, 0));
    return {summary, indexFiles};
}

async function verify({site, locale = 'ja', devOnly = false, sourceLocales = [], themes = false,
    manifest = path.join(root, '.i18n-build/manifests', `${locale}.json`)}) {
    assert(corpus[locale], `Add representative search queries for ${locale}`);
    const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    assert.equal(data.locale, locale);
    const {summary, indexFiles} = checkIndexes({site, locale, manifest:data});
    const dictionary = JSON.parse(fs.readFileSync(path.join(root, `i18n/${locale}/code.json`), 'utf8'));
    const settings = JSON.parse(fs.readFileSync(path.join(root, 'translations/config.json'), 'utf8')).locales[locale];
    const server = createServer(site);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const {chromium} = require('playwright');
    const browser = await chromium.launch({headless:true});
    const context = await browser.newContext({viewport:{width:1440,height:1000}, serviceWorkers:'block'});
    await context.route('**/*', request => {
        const url = new URL(request.request().url());
        return /^https?:/.test(url.protocol) && url.origin !== origin ? request.abort() : request.continue();
    });
    const results = [], themeChecks = [], sourceChecks = [], errors = [], failed = [], workers = [];
    const newPage = async (viewport) => {
        const page = await context.newPage();
        if (viewport) await page.setViewportSize(viewport);
        page.on('pageerror', error => errors.push({url:page.url(),message:error.message}));
        page.on('response', response => {if (response.url().startsWith(origin) && response.status() >= 400) failed.push({url:response.url(),status:response.status()});});
        page.on('worker', worker => {workers.push(worker.url());assert.equal(new URL(worker.url()).origin, origin, 'Cross-origin worker');});
        return page;
    };
    const open = async (page, url) => {
        const response = await page.goto(origin + url, {waitUntil:'domcontentloaded'});
        assert.equal(response.status(), 200, url);
        await page.waitForSelector('html[data-has-hydrated="true"]');
    };
    const searchLinks = async page => {
        try {await page.locator('section article a').first().waitFor({timeout:30000});}
        catch (error) {throw new Error(`${page.url()}: ${error.message}; failures=${JSON.stringify(failed)}; body=${(await page.locator('body').innerText()).slice(-700)}`);}
        return page.locator('section article a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    };
    const indexRequests = page => {
        const requests = [];
        page.on('request', request => {if (request.url().includes('search-index')) requests.push(new URL(request.url()).pathname);});
        return requests;
    };
    try {
        const probes = [
            {ctx:'docs/dev',query:corpus[locale].database}, {ctx:'docs/dev',query:corpus[locale].query},
            {ctx:'docs/dev',query:'SQL'}, {ctx:'docs/dev',query:'query_vector'},
            {ctx:'docs/4.x',query:'SQL'}, {ctx:'community',query:corpus[locale].community},
            ...(locale === 'ru' ? ['ЗАПРОСЫ', 'отчёты', 'отчеты', 'ОТЧЁТЫ', 'match',
                'query_vector()', '(SQL)', 'SQL запрос'].map(query => ({ctx:'docs/dev',query})) : []),
        ].filter(probe => (!devOnly || probe.ctx !== 'docs/4.x') && summary.contexts[probe.ctx] > 0);
        for (const probe of probes) {
            const page = await newPage();
            const requests = indexRequests(page);
            await open(page, `/${locale}/search/?${new URLSearchParams({ctx:probe.ctx,q:probe.query})}`);
            const links = await searchLinks(page);
            assert(links.every(link => route(link).startsWith(`/${locale}/${probe.ctx}/`)), `Wrong search scope: ${links}`);
            assert(requests.length && requests.every(url => url === `/${locale}/${indexFiles[probe.ctx]}`), `Wrong index: ${requests}`);
            assert(await page.locator('section article mark').count(), `Missing result highlight: ${probe.query}`);
            const labels = await page.locator('select option').allTextContents();
            for (const label of Object.values(settings.searchContextLabels)) assert(labels.includes(label), `Missing context label: ${label}`);
            if (locale === 'ru' && probe.query === 'отчеты') {
                const target = await newPage();
                await open(target, links[0]);
                await target.locator('.theme-doc-markdown mark').first().waitFor();
                assert((await target.locator('.theme-doc-markdown mark').allTextContents())
                    .some(text => /отчёты/i.test(text)), 'Russian target highlighting lost ё/е equivalence');
                await target.close();
            }
            results.push({...probe,results:links.length,indexRequests:requests});
            await page.close();
        }
        for (const probe of [{query:'SQL',context:'docs/dev'},{query:corpus[locale].community,context:'community'}].filter(probe => summary.contexts[probe.context] > 0)) {
            const page = await newPage();
            const requests = indexRequests(page);
            await open(page, `/${locale}/search/?${new URLSearchParams({q:probe.query})}`);
            const links = await searchLinks(page);
            assert(links.every(link => route(link).startsWith(`/${locale}/`)));
            assert(links.some(link => route(link).startsWith(`/${locale}/${probe.context}/`)));
            for (const contextName of contexts) assert(requests.includes(`/${locale}/${indexFiles[contextName]}`), `Everywhere skipped ${contextName}`);
            assert(!requests.includes(`/${locale}/${indexFiles['']}`), 'Everywhere fetched a duplicate union index');
            results.push({everywhere:probe.query,results:links.length,indexRequests:requests});
            await page.close();
        }
        const devPage = data.pages.find(page => page.pluginId === 'default' && page.version === 'current' && !page.draft);
        if (!devOnly || devPage) {
            const bar = await newPage();
            const requests = indexRequests(bar);
            const path = devPage?.permalink ?? data.pages.find(page => !page.draft)?.permalink;
            await open(bar, path);
            const input = bar.locator('input.navbar__search-input:visible').first();
            assert.equal(await input.getAttribute('aria-label'), await input.getAttribute('placeholder'));
            await bar.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
            assert(await input.evaluate(element => element === document.activeElement), 'Keyboard search shortcut did not focus the input');
            await bar.waitForTimeout(1000);
            if (summary.contexts['docs/dev'] > 0 && devPage) {
                const previous = bar.url();
                await input.dispatchEvent('compositionstart', {data:''});
                await input.fill(corpus[locale].database.slice(0,2));
                await input.dispatchEvent('keydown', {key:'Enter',code:'Enter',isComposing:true,keyCode:229,which:229});
                assert.equal(bar.url(), previous, 'IME commit navigated before composition ended');
                await input.dispatchEvent('compositionend', {data:corpus[locale].database});
                await input.fill('query_vector');
                await bar.locator('[class*="suggestion_"]').first().waitFor({timeout:30000});
                assert(requests.every(url => url === `/${locale}/${indexFiles['docs/dev']}`), `SearchBar loaded wrong context: ${requests}`);
                assert(await bar.locator('[class*="suggestion_"] mark').count(), 'SearchBar highlight missing');
                results.push({searchBar:'query_vector',ime:true,suggestions:await bar.locator('[class*="suggestion_"]').count(),indexRequests:requests});
            }
            await bar.close();
        }
        const mobile = await newPage({width:390,height:844});
        const mobileContext = summary.contexts['docs/dev'] > 0 ? 'docs/dev' : 'community';
        await open(mobile, `/${locale}/search/?${new URLSearchParams({ctx:mobileContext,q:mobileContext==='community'?corpus[locale].community:'SQL'})}`);
        if (summary.contexts[mobileContext] > 0) await searchLinks(mobile);
        const box = await mobile.locator('input[type="search"]').boundingBox();
        assert(box && box.x >= 0 && box.x + box.width <= 391, `Mobile search overflow: ${JSON.stringify(box)}`);
        results.push({mobile:true,inputWidth:Math.round(box.width)});
        await mobile.close();
        const empty = await newPage();
        await open(empty, `/${locale}/search/?q=zzzzqqqq_xxxxwwww&ctx=docs/dev`);
        const label = dictionary['theme.SearchPage.searchSource'].message;
        await empty.getByRole('link',{name:label,exact:true}).waitFor({timeout:30000});
        const original = await empty.getByRole('link',{name:label,exact:true}).getAttribute('href');
        assert(original.startsWith('/search/?q='), original);
        assert.equal(new URL(original,origin).searchParams.get('version'), 'docs/dev/');
        results.push({noResultsOriginalSearch:original});
        await empty.close();
        for (const sourceLocale of sourceLocales) {
            const page = await newPage();
            const prefix = sourceLocale === 'en' ? '' : `/${sourceLocale}`;
            const requests = indexRequests(page);
            await open(page, `${prefix}/docs/dev/getting-started/what-is-apache-doris/`);
            await page.waitForTimeout(600);
            await open(page, `${prefix}/search/?${new URLSearchParams({q:'SQL',ctx:'docs',version:'docs/dev/'})}`);
            const links = await searchLinks(page);
            assert(links.every(link => route(link).startsWith(`${prefix}/docs/dev/`)), `Wrong source version: ${links}`);
            sourceChecks.push({locale:sourceLocale,results:links.length,indexRequests:requests});
            await page.close();
        }
        if (themes && devPage) {
            const page = await newPage();
            const sample = data.pages.find(page => page.docId === 'getting-started/what-is-apache-doris' && page.version === 'current');
            await open(page, sample.permalink);
            await page.frameLocator('iframe[src^="/animations/what-is-apache-doris-intro.html"]').locator('body').waitFor();
            const palette = page.locator('.brand-theme-switcher:visible').first();
            const count = await palette.locator('button').count();
            const seen = new Set();
            for (let i=0;i<count;i++) {
                await page.setViewportSize({width:1440,height:1000});
                await palette.locator('summary').click();
                await palette.locator('button').nth(i).click();
                await page.waitForFunction(() => {
                    const parent=document.documentElement, child=document.querySelector('iframe[src^="/animations/what-is-apache-doris-intro.html"]').contentDocument.documentElement;
                    return child.dataset.brandTheme===parent.dataset.brandTheme && child.style.getPropertyValue('--brand-primary')===getComputedStyle(parent).getPropertyValue('--brand-primary').trim();
                });
                const theme = await page.locator('html').getAttribute('data-brand-theme');
                seen.add(theme);
                for (const width of [1440,390]) {
                    await page.setViewportSize({width,height:1000});
                    assert(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth+1), `${theme} overflow at ${width}`);
                    themeChecks.push({theme,width,iframeBridge:true});
                }
            }
            assert.equal(seen.size,count,'A theme was skipped');
            await page.close();
        }
        assert.deepEqual(errors, [], 'Browser runtime errors');
        assert.deepEqual(failed, [], 'Failed resources from the current artifact');
        assert(workers.length, 'No actual browser search worker was exercised');
        return {locale,devOnly,summary,results,sourceChecks,themeChecks,workers:[...new Set(workers)],errors,failed,
            skippedProbeContexts:contexts.filter(context => summary.contexts[context]===0)};
    } finally {await browser.close(); await new Promise(resolve => server.close(resolve));}
}
if (require.main === module) {
    const args=process.argv.slice(2), option=name=>args.includes(name)?args[args.indexOf(name)+1]:undefined;
    verify({site:path.resolve(option('--site')),locale:option('--locale')??'ja',devOnly:args.includes('--dev-only'),
        sourceLocales:(option('--source-locales')??'').split(',').filter(Boolean),themes:args.includes('--themes'),
        manifest:option('--manifest')?path.resolve(option('--manifest')):undefined})
        .then(result=>{if(option('--output'))fs.writeFileSync(option('--output'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));})
        .catch(error=>{console.error(error);process.exitCode=1;});
}
module.exports = {verify, checkIndexes};
