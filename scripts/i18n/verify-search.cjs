const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

async function verify({site,devOnly = false}) {
    const manifest = JSON.parse(fs.readFileSync(path.join(site,'ja','ja-search-summary.json'),'utf8'));
    assert.deepEqual(Object.keys(manifest.contexts).sort(),['community','docs/4.x','docs/dev'].sort());
    assert.equal(manifest.indexedPages,Object.values(manifest.contexts).reduce((a,b)=>a+b,0));
    const indexFiles = ['search-index.json','search-index-docs-dev.json','search-index-docs-4.x.json','search-index-community.json'];
    const indexes = Object.fromEntries(indexFiles.map(file => [file,JSON.parse(fs.readFileSync(path.join(site,'ja',file),'utf8'))]));
    // "Everywhere" searches each context index in the browser; a union copy at
    // the root outgrew GitHub's 100 MiB file limit.
    assert(indexes['search-index.json'].every(section => section.documents.length === 0),'Root index repeats the contexts');
    for (const [file,index] of Object.entries(indexes)) {
        for (const section of index) for (const doc of section.documents) {
            assert(doc.u.startsWith('/ja/'),`Cross-locale result in ${file}: ${doc.u}`);
            if (file === 'search-index-community.json') assert(doc.u.startsWith('/ja/community/'));
            if (file === 'search-index-docs-dev.json') assert(doc.u.startsWith('/ja/docs/dev/'));
            if (file === 'search-index-docs-4.x.json') assert(doc.u.startsWith('/ja/docs/4.x/'));
        }
    }
    const server = http.createServer((req,res) => {
        const pathname = decodeURIComponent(new URL(req.url,'http://local').pathname);
        const local = path.join(site,pathname.endsWith('/') ? `${pathname}index.html` : pathname);
        if (!local.startsWith(site+path.sep) || !fs.existsSync(local) || !fs.statSync(local).isFile()) {res.writeHead(404);res.end();return;}
        res.setHeader('Content-Type',local.endsWith('.html')?'text/html':local.endsWith('.json')?'application/json':local.endsWith('.js')?'application/javascript':local.endsWith('.css')?'text/css':'application/octet-stream');
        fs.createReadStream(local).pipe(res);
    });
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({headless:true});
    const cases = [
        {locale:'ja',ctx:'docs/dev',query:'データベース',path:'/ja/docs/dev/'},
        {locale:'ja',ctx:'docs/dev',query:'分析',path:'/ja/docs/dev/'},
        {locale:'ja',ctx:'docs/dev',query:'SQL',path:'/ja/docs/dev/'},
        {locale:'ja',ctx:'docs/dev',query:'match',path:'/ja/docs/dev/'},
        {locale:'ja',ctx:'docs/dev',query:'query_vector',path:'/ja/docs/dev/'},
        {locale:'ja',ctx:'docs/4.x',query:'SQL',path:'/ja/docs/4.x/'},
        {locale:'ja',ctx:'community',query:'コミュニティ',path:'/ja/community/'},
    ].filter(item => !devOnly || item.ctx !== 'docs/4.x');
    const results = [];
    try {
        for (const item of cases) {
            const page = await browser.newPage();
            const requests = [], errors = [];
            page.on('request',request => {if(request.url().includes('search-index'))requests.push(new URL(request.url()).pathname);});
            page.on('pageerror',error => errors.push(error.message));
            page.on('response',response => {if(response.status() >= 400 && response.url().startsWith(origin)) errors.push(`${response.status()} ${response.url()}`);});
            const url = `${origin}/ja/search/?${new URLSearchParams({ctx:item.ctx,q:item.query})}`;
            const response = await page.goto(url);
            assert.equal(response.status(),200,url);
            try {await page.waitForFunction(() => document.querySelectorAll('section article a').length > 0,null,{timeout:30000});}
            catch (error) {throw new Error(`${item.ctx}: ${error.message}; requests=${requests}; errors=${errors}; body=${(await page.locator('body').innerText()).slice(0,500)}`);}
            const links = await page.locator('section article a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
            assert(links.length && links.every(link => link.startsWith(item.path)),`${item.ctx} leaked a result: ${links.join(',')}`);
            assert(requests.some(request => request.includes(`search-index-${item.ctx.replace(/\//g,'-')}`)),`Wrong worker index: ${requests}`);
            assert.deepEqual(errors,[],`Search page errors: ${item.ctx}`);
            results.push({...item,indexRequests:requests,results:links.length});
            await page.close();
        }
        // Without ctx the page searches "Everywhere": every context index, merged.
        for (const item of [{query:'SQL',path:'/ja/docs/dev/'},{query:'コミュニティ',path:'/ja/community/'}]) {
            const everywhere = await browser.newPage();
            const requests = [];
            everywhere.on('request',request => {if(request.url().includes('search-index')) requests.push(new URL(request.url()).pathname);});
            await everywhere.goto(`${origin}/ja/search/?${new URLSearchParams({q:item.query})}`);
            await everywhere.locator('section article a').first().waitFor({timeout:30000});
            const links = await everywhere.locator('section article a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
            const expected = ['docs-dev','docs-4.x','community'].map(ctx => `/ja/search-index-${ctx}.json`);
            assert(expected.every(file => requests.includes(file)),`Everywhere skipped a context index: ${requests}`);
            assert(!requests.includes('/ja/search-index.json'),`Everywhere fetched the root index: ${requests}`);
            assert(links.some(link => link.startsWith(item.path)),`Everywhere missed ${item.path}: ${links.slice(0,10)}`);
            results.push({everywhereQuery:item.query,results:links.length,indexRequests:requests});
            await everywhere.close();
        }

        const bar = await browser.newPage();
        const barRequests = [];
        bar.on('request',request => {if(request.url().includes('search-index')) barRequests.push(new URL(request.url()).pathname);});
        await bar.goto(`${origin}/ja/docs/dev/getting-started/intro/`);
        const input = bar.locator('input[aria-label="Search"]:visible').first();
        await input.focus();
        await bar.waitForTimeout(1200);
        await input.fill('query_vector');
        const suggestion = bar.locator('[class*="suggestion_"]');
        await suggestion.first().waitFor({timeout:30000});
        assert(barRequests.some(request => request.includes('search-index-docs-dev')),`SearchBar used wrong index: ${barRequests}`);
        results.push({searchBarQuery:'query_vector',suggestions:await suggestion.count(),indexRequests:barRequests});
        await bar.close();

        const mobile = await browser.newPage({viewport:{width:390,height:844}});
        await mobile.goto(`${origin}/ja/search/?q=SQL&ctx=docs/dev`);
        await mobile.locator('section article a').first().waitFor({timeout:30000});
        const box = await mobile.locator('input[type="search"]').boundingBox();
        assert(box && box.x >= 0 && box.x + box.width <= 391,`Mobile search input overflow: ${JSON.stringify(box)}`);
        results.push({mobileSearch:true,inputWidth:Math.round(box.width)});
        await mobile.close();

        const page = await browser.newPage();
        await page.goto(`${origin}/ja/search/?q=zzzzzzzz_t04_nomatch_98765&ctx=docs/dev`);
        try {await page.getByRole('link',{name:'英語の原文を検索'}).waitFor({timeout:30000});}
        catch (error) {throw new Error(`Missing original-language search link: ${(await page.locator('body').innerText()).slice(-600)}; ${error.message}`);}
        const original = await page.getByRole('link',{name:'英語の原文を検索'}).getAttribute('href');
        assert(original.startsWith('/search/?q='),original);
        assert(new URL(original,origin).searchParams.get('version') === 'docs/dev/',original);
        results.push({noResultsOriginalSearch:original});
        await page.close();
    } finally {await browser.close(); await new Promise(resolve => server.close(resolve));}
    return {manifest,results};
}
if (require.main === module) {
    const args = process.argv.slice(2),site = path.resolve(args[args.indexOf('--site')+1]);
    verify({site,devOnly:args.includes('--dev-only')}).then(result => console.log(JSON.stringify(result,null,2))).catch(error => {console.error(error);process.exitCode=1;});
}
module.exports = {verify};
